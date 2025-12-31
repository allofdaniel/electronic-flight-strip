// ============================================================
// AMAN - Arrival Manager
// Calculates arrival sequences and timing advisories
// ============================================================

import type {
  FlightStrip,
  ArrivalSequence,
  SequencedArrival,
  RunwayConfiguration,
  Position,
} from '@types/index';
import { WakeTurbulenceSeparation } from '@modules/safety-net/WakeTurbulenceSeparation';
import { TrajectoryPredictor } from '@modules/fdps/TrajectoryPredictor';
import { calculateDistance } from '@utils/helpers';

export interface AMANConfig {
  horizonTime: number; // minutes to look ahead
  meterFix: string; // Final approach fix name
  meterFixPosition: Position;
  runwayThreshold: Position;
  finalApproachDistance: number; // nm
  minimumSeparationTime: number; // seconds
  useRECAT: boolean;
}

/**
 * Arrival Manager (AMAN)
 * Computes optimal arrival sequence considering:
 * - Wake turbulence separation
 * - Runway capacity
 * - Aircraft performance
 * - Holding patterns
 */
export class ArrivalManager {
  private config: AMANConfig;
  private currentSequence: ArrivalSequence | null = null;

  constructor(config: AMANConfig) {
    this.config = config;
  }

  /**
   * Calculate arrival sequence for all inbound aircraft
   */
  calculateSequence(
    inboundFlights: FlightStrip[],
    runwayConfig: RunwayConfiguration
  ): ArrivalSequence {
    // Filter and sort by ETA
    const arrivals = inboundFlights
      .filter((f) => f.eta && ['INITIAL_APPROACH', 'FINAL_APPROACH', 'ACTIVE'].includes(f.status))
      .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

    if (arrivals.length === 0) {
      return {
        flights: [],
        runway: runwayConfig.runway,
        calculatedAt: new Date(),
      };
    }

    const sequencedArrivals: SequencedArrival[] = [];
    let previousScheduledTime: Date | null = null;
    let previousStrip: FlightStrip | null = null;

    for (let i = 0; i < arrivals.length; i++) {
      const strip = arrivals[i];
      const originalETA = new Date(strip.eta!);

      let scheduledTime: Date;
      let delay = 0;
      let advisedDelay: number | undefined;

      if (i === 0) {
        // First aircraft - use original ETA
        scheduledTime = originalETA;
      } else {
        // Calculate minimum separation from previous aircraft
        const separation = WakeTurbulenceSeparation.calculateSeparation(
          previousStrip!,
          strip,
          this.config.useRECAT
        );

        // Convert distance separation to time based on approach speed
        const approachSpeed = 140; // knots, average approach speed
        const separationTime = Math.max(
          this.config.minimumSeparationTime,
          Math.ceil((separation.distance / approachSpeed) * 3600)
        );

        // Earliest possible time based on separation
        const earliestTime = new Date(
          previousScheduledTime!.getTime() + separationTime * 1000
        );

        if (originalETA.getTime() >= earliestTime.getTime()) {
          // Can make original ETA with required separation
          scheduledTime = originalETA;
        } else {
          // Need to delay
          scheduledTime = earliestTime;
          delay = Math.round(
            (scheduledTime.getTime() - originalETA.getTime()) / 60000
          );
          advisedDelay = delay;
        }
      }

      // Calculate speed advisory if delayed
      let advisedSpeed: number | undefined;
      if (delay > 0) {
        advisedSpeed = this.calculateSpeedAdvisory(strip, delay);
      }

      sequencedArrivals.push({
        callsign: strip.callsign,
        stripId: strip.id,
        originalETA,
        scheduledTime,
        delay,
        sequencePosition: i + 1,
        meterFix: this.config.meterFix,
        advisedSpeed,
        advisedDelay,
      });

      previousScheduledTime = scheduledTime;
      previousStrip = strip;
    }

    this.currentSequence = {
      flights: sequencedArrivals,
      runway: runwayConfig.runway,
      calculatedAt: new Date(),
    };

    return this.currentSequence;
  }

  /**
   * Calculate speed reduction to absorb delay
   */
  private calculateSpeedAdvisory(strip: FlightStrip, delayMinutes: number): number {
    // Simplified speed advisory calculation
    // In reality, this depends on distance to meter fix and current speed

    const baseSpeed = 280; // knots cruise speed
    const minSpeed = 220; // minimum advisable speed

    // Reduce by approximately 3 knots per minute of delay to absorb
    const speedReduction = Math.min(delayMinutes * 3, baseSpeed - minSpeed);
    return Math.round(baseSpeed - speedReduction);
  }

  /**
   * Get holding advice for delayed aircraft
   */
  getHoldingAdvice(
    strip: FlightStrip,
    sequencedArrival: SequencedArrival
  ): {
    holdRequired: boolean;
    holdFix?: string;
    expectedHoldDuration?: number;
    expectedExitTime?: Date;
  } {
    // If delay is more than 10 minutes, holding is likely needed
    if (sequencedArrival.delay > 10) {
      return {
        holdRequired: true,
        holdFix: 'GUKDO', // Default holding fix
        expectedHoldDuration: sequencedArrival.delay,
        expectedExitTime: new Date(
          sequencedArrival.scheduledTime.getTime() - 10 * 60000
        ),
      };
    }

    return { holdRequired: false };
  }

  /**
   * Recalculate sequence after a change
   */
  updateSequence(
    updatedStrip: FlightStrip,
    allInboundFlights: FlightStrip[],
    runwayConfig: RunwayConfiguration
  ): ArrivalSequence {
    // Update the strip in the list and recalculate
    const updatedFlights = allInboundFlights.map((f) =>
      f.id === updatedStrip.id ? updatedStrip : f
    );

    return this.calculateSequence(updatedFlights, runwayConfig);
  }

  /**
   * Get estimated landing time
   */
  getEstimatedLandingTime(strip: FlightStrip): Date | null {
    if (!this.currentSequence) return null;

    const sequenced = this.currentSequence.flights.find(
      (f) => f.stripId === strip.id
    );

    if (!sequenced) return null;

    // Add final approach time (approximately 5 minutes from meter fix)
    return new Date(sequenced.scheduledTime.getTime() + 5 * 60000);
  }

  /**
   * Get runway capacity utilization
   */
  getRunwayUtilization(
    runwayConfig: RunwayConfiguration
  ): {
    currentRate: number;
    maxRate: number;
    utilization: number;
  } {
    if (!this.currentSequence || this.currentSequence.flights.length < 2) {
      return {
        currentRate: 0,
        maxRate: runwayConfig.arrivalRate,
        utilization: 0,
      };
    }

    // Calculate average inter-arrival time
    const flights = this.currentSequence.flights;
    let totalInterval = 0;

    for (let i = 1; i < flights.length; i++) {
      const interval =
        flights[i].scheduledTime.getTime() -
        flights[i - 1].scheduledTime.getTime();
      totalInterval += interval;
    }

    const avgIntervalSeconds = totalInterval / (flights.length - 1) / 1000;
    const currentRate = Math.round(3600 / avgIntervalSeconds);

    return {
      currentRate,
      maxRate: runwayConfig.arrivalRate,
      utilization: Math.round((currentRate / runwayConfig.arrivalRate) * 100),
    };
  }

  /**
   * Get current sequence
   */
  getCurrentSequence(): ArrivalSequence | null {
    return this.currentSequence;
  }
}

export default ArrivalManager;
