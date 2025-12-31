// ============================================================
// DMAN - Departure Manager
// Calculates departure sequences and CDM timeline
// ============================================================

import type {
  FlightStrip,
  DepartureSequence,
  SequencedDeparture,
  RunwayConfiguration,
} from '@types/index';
import { WakeTurbulenceSeparation } from '@modules/safety-net/WakeTurbulenceSeparation';

export interface DMANConfig {
  taxiTimeAverage: number; // minutes average taxi time
  minimumGroundTime: number; // minutes from startup to takeoff
  ctotWindow: number; // minutes (ATFM slot window, typically -5/+10)
  tsat2ttotBuffer: number; // minutes between TSAT and TTOT
}

/**
 * CDM Timeline Milestones
 * TOBT: Target Off-Block Time (airline request)
 * TSAT: Target Start-up Approval Time (ATC assigns)
 * TTOT: Target Take-Off Time (calculated)
 * CTOT: Calculated Take-Off Time (ATFM slot, if applicable)
 */
export interface CDMTimeline {
  tobt: Date;
  tsat: Date;
  ttot: Date;
  ctot?: Date;
  taxiTime: number;
  sequenceNumber: number;
}

/**
 * Departure Manager (DMAN)
 * Implements A-CDM (Airport Collaborative Decision Making)
 * for departure sequencing
 */
export class DepartureManager {
  private config: DMANConfig;
  private currentSequence: DepartureSequence | null = null;

  constructor(config?: Partial<DMANConfig>) {
    this.config = {
      taxiTimeAverage: 15, // 15 minutes average
      minimumGroundTime: 20, // 20 minutes from startup to takeoff
      ctotWindow: 15, // -5/+10 minute window
      tsat2ttotBuffer: 15, // 15 minutes taxi time included
      ...config,
    };
  }

  /**
   * Calculate departure sequence for all outbound aircraft
   */
  calculateSequence(
    outboundFlights: FlightStrip[],
    runwayConfig: RunwayConfiguration
  ): DepartureSequence {
    // Filter departures that haven't departed yet
    const departures = outboundFlights
      .filter((f) =>
        ['FILED', 'CLEARANCE_DELIVERED', 'PUSH_APPROVED', 'TAXIING', 'HOLDING', 'LINEUP'].includes(f.status)
      )
      .sort((a, b) => {
        // Sort by CTOT if present, otherwise by EOBT
        const timeA = a.ctot || a.ttot || a.tsat || a.eobt;
        const timeB = b.ctot || b.ttot || b.tsat || b.eobt;
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return new Date(timeA).getTime() - new Date(timeB).getTime();
      });

    if (departures.length === 0) {
      return {
        flights: [],
        runway: runwayConfig.runway,
        calculatedAt: new Date(),
      };
    }

    const sequencedDepartures: SequencedDeparture[] = [];
    let previousTTOT: Date | null = null;
    let previousStrip: FlightStrip | null = null;

    for (let i = 0; i < departures.length; i++) {
      const strip = departures[i];
      const tobt = strip.tobt || strip.eobt || new Date();

      // Calculate TSAT based on taxi time
      const taxiTime = this.estimateTaxiTime(strip);

      let ttot: Date;
      let tsat: Date;

      if (i === 0) {
        // First aircraft
        ttot = new Date(new Date(tobt).getTime() + (taxiTime + 5) * 60000);
        tsat = new Date(ttot.getTime() - taxiTime * 60000);
      } else {
        // Calculate minimum separation from previous aircraft
        const separation = WakeTurbulenceSeparation.calculateSeparation(
          previousStrip!,
          strip,
          true // Use RECAT
        );

        // Minimum time between takeoffs
        const minSeparationSeconds = Math.max(
          separation.time, // Wake turbulence time separation
          90 // Minimum 90 seconds between departures
        );

        // Earliest possible TTOT
        const earliestTTOT = new Date(
          previousTTOT!.getTime() + minSeparationSeconds * 1000
        );

        // Desired TTOT based on TOBT
        const desiredTTOT = new Date(
          new Date(tobt).getTime() + (taxiTime + 5) * 60000
        );

        // Use the later of earliest or desired
        ttot = earliestTTOT.getTime() > desiredTTOT.getTime()
          ? earliestTTOT
          : desiredTTOT;

        tsat = new Date(ttot.getTime() - taxiTime * 60000);
      }

      // Apply CTOT constraint if present
      let ctot: Date | undefined;
      if (strip.ctot) {
        ctot = new Date(strip.ctot);

        // TTOT must be within CTOT window (-5/+10)
        const ctotWindowStart = new Date(ctot.getTime() - 5 * 60000);
        const ctotWindowEnd = new Date(ctot.getTime() + 10 * 60000);

        if (ttot.getTime() < ctotWindowStart.getTime()) {
          ttot = ctotWindowStart;
          tsat = new Date(ttot.getTime() - taxiTime * 60000);
        } else if (ttot.getTime() > ctotWindowEnd.getTime()) {
          // Cannot meet CTOT - flag this
          console.warn(`${strip.callsign} cannot meet CTOT ${ctot.toISOString()}`);
          ttot = ctotWindowEnd;
          tsat = new Date(ttot.getTime() - taxiTime * 60000);
        }
      }

      sequencedDepartures.push({
        callsign: strip.callsign,
        stripId: strip.id,
        tobt: new Date(tobt),
        tsat,
        ttot,
        ctot,
        taxiTime,
        sequencePosition: i + 1,
        gate: strip.gate || 'UNKNOWN',
        runway: runwayConfig.runway,
      });

      previousTTOT = ttot;
      previousStrip = strip;
    }

    this.currentSequence = {
      flights: sequencedDepartures,
      runway: runwayConfig.runway,
      calculatedAt: new Date(),
    };

    return this.currentSequence;
  }

  /**
   * Estimate taxi time based on gate location
   */
  private estimateTaxiTime(strip: FlightStrip): number {
    // Simplified taxi time estimation
    // In reality, this would use airport layout and current traffic

    const gate = strip.gate || '';

    // Terminal 2 gates typically have longer taxi times
    if (gate.startsWith('2')) {
      return this.config.taxiTimeAverage + 5;
    }

    // Remote stands have longer taxi times
    if (gate.length > 3) {
      return this.config.taxiTimeAverage + 8;
    }

    return this.config.taxiTimeAverage;
  }

  /**
   * Calculate TSAT for a single flight
   */
  calculateTSAT(
    strip: FlightStrip,
    targetTTOT?: Date
  ): CDMTimeline {
    const tobt = strip.tobt || strip.eobt || new Date();
    const taxiTime = this.estimateTaxiTime(strip);

    let ttot: Date;
    if (targetTTOT) {
      ttot = targetTTOT;
    } else {
      // Calculate based on TOBT + taxi time + buffer
      ttot = new Date(new Date(tobt).getTime() + (taxiTime + 5) * 60000);
    }

    const tsat = new Date(ttot.getTime() - taxiTime * 60000);

    // Apply CTOT if present
    let ctot: Date | undefined;
    if (strip.ctot) {
      ctot = new Date(strip.ctot);
    }

    return {
      tobt: new Date(tobt),
      tsat,
      ttot,
      ctot,
      taxiTime,
      sequenceNumber: this.getSequencePosition(strip.id),
    };
  }

  /**
   * Update TOBT and recalculate sequence
   */
  updateTOBT(
    stripId: string,
    newTOBT: Date,
    allOutboundFlights: FlightStrip[],
    runwayConfig: RunwayConfiguration
  ): DepartureSequence {
    // Find and update the strip
    const updatedFlights = allOutboundFlights.map((f) =>
      f.id === stripId ? { ...f, tobt: newTOBT } : f
    );

    return this.calculateSequence(updatedFlights, runwayConfig);
  }

  /**
   * Get sequence position for a flight
   */
  private getSequencePosition(stripId: string): number {
    if (!this.currentSequence) return 0;

    const idx = this.currentSequence.flights.findIndex(
      (f) => f.stripId === stripId
    );
    return idx >= 0 ? idx + 1 : 0;
  }

  /**
   * Check CTOT compliance
   */
  checkCTOTCompliance(
    strip: FlightStrip,
    currentTime: Date
  ): {
    compliant: boolean;
    windowOpens?: Date;
    windowCloses?: Date;
    status: 'EARLY' | 'ON_TIME' | 'LATE' | 'NO_SLOT';
  } {
    if (!strip.ctot) {
      return { compliant: true, status: 'NO_SLOT' };
    }

    const ctot = new Date(strip.ctot);
    const windowOpens = new Date(ctot.getTime() - 5 * 60000);
    const windowCloses = new Date(ctot.getTime() + 10 * 60000);

    if (currentTime < windowOpens) {
      return { compliant: false, windowOpens, windowCloses, status: 'EARLY' };
    } else if (currentTime > windowCloses) {
      return { compliant: false, windowOpens, windowCloses, status: 'LATE' };
    }

    return { compliant: true, windowOpens, windowCloses, status: 'ON_TIME' };
  }

  /**
   * Get runway capacity utilization for departures
   */
  getDepartureRate(runwayConfig: RunwayConfiguration): {
    currentRate: number;
    maxRate: number;
    utilization: number;
  } {
    if (!this.currentSequence || this.currentSequence.flights.length < 2) {
      return {
        currentRate: 0,
        maxRate: runwayConfig.departureRate,
        utilization: 0,
      };
    }

    const flights = this.currentSequence.flights;
    let totalInterval = 0;

    for (let i = 1; i < flights.length; i++) {
      const interval =
        flights[i].ttot.getTime() - flights[i - 1].ttot.getTime();
      totalInterval += interval;
    }

    const avgIntervalSeconds = totalInterval / (flights.length - 1) / 1000;
    const currentRate = Math.round(3600 / avgIntervalSeconds);

    return {
      currentRate,
      maxRate: runwayConfig.departureRate,
      utilization: Math.round((currentRate / runwayConfig.departureRate) * 100),
    };
  }

  /**
   * Get current sequence
   */
  getCurrentSequence(): DepartureSequence | null {
    return this.currentSequence;
  }

  /**
   * Suggest optimal departure order to minimize delays
   */
  optimizeSequence(
    flights: FlightStrip[],
    runwayConfig: RunwayConfiguration
  ): FlightStrip[] {
    // Use wake turbulence optimization from safety net module
    return WakeTurbulenceSeparation.optimizeSequence(flights);
  }
}

export default DepartureManager;
