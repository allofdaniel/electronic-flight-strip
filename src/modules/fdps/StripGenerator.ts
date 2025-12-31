// ============================================================
// FDPS - Flight Strip Generator
// Converts parsed flight plans to flight strips
// ============================================================

import type {
  FlightStrip,
  ParsedFlightPlan,
  StripStatus,
  WakeTurbulenceCategory,
  FlightRules,
  FlightType,
} from '@types/index';
import { generateId, generateSquawk, parseZuluTime } from '@utils/helpers';
import { AircraftDatabase } from '@data/aircraft/AircraftDatabase';

export class StripGenerator {
  /**
   * Generate a flight strip from a parsed flight plan
   */
  static fromFlightPlan(
    fpl: ParsedFlightPlan,
    options: {
      assignedRunway?: string;
      assignedGate?: string;
      assignedSid?: string;
      assignedStar?: string;
      ssrCode?: string;
    } = {}
  ): FlightStrip {
    const now = new Date();
    const eobt = fpl.eobt ? parseZuluTime(fpl.eobt) : undefined;

    // Determine initial status
    const status: StripStatus = fpl.messageType === 'ARR'
      ? 'INITIAL_APPROACH'
      : fpl.messageType === 'DEP'
      ? 'DEPARTED'
      : 'FILED';

    // Determine initial bay based on status
    const bay = this.determineBay(status, options.assignedRunway);

    // Parse altitude from flight level
    const altitude = this.parseAltitude(fpl.cruiseLevel);

    return {
      id: generateId(),
      callsign: fpl.callsign,
      aircraftType: fpl.aircraftType,
      wakeTurbulenceCategory: fpl.wakeTurbulence,
      ssrCode: options.ssrCode || generateSquawk(),
      departure: fpl.departureAirport,
      destination: fpl.destinationAirport,
      altitude,
      route: fpl.route,
      sid: options.assignedSid,
      star: options.assignedStar,
      runway: options.assignedRunway,
      gate: options.assignedGate,
      status,
      bay,
      position: 0,
      flightRules: fpl.flightRules as FlightRules,
      flightType: fpl.flightType as FlightType,
      eobt,
      createdAt: now,
      updatedAt: now,
      annotations: [],
      clearances: [],
    };
  }

  /**
   * Generate a departure strip with pre-filled data
   */
  static createDeparture(options: {
    callsign: string;
    aircraftType: string;
    departure: string;
    destination: string;
    route?: string;
    runway?: string;
    gate?: string;
    sid?: string;
    altitude?: number;
    eobt?: Date;
  }): FlightStrip {
    const now = new Date();
    const aircraft = AircraftDatabase.get(options.aircraftType);
    const wtc = aircraft?.wakeTurbulence || 'M';

    return {
      id: generateId(),
      callsign: options.callsign,
      aircraftType: options.aircraftType,
      wakeTurbulenceCategory: wtc,
      ssrCode: generateSquawk(),
      departure: options.departure,
      destination: options.destination,
      altitude: options.altitude || 35000,
      route: options.route || 'DCT',
      sid: options.sid,
      runway: options.runway,
      gate: options.gate,
      status: 'FILED',
      bay: 'clearance',
      position: 0,
      flightRules: 'I' as FlightRules,
      flightType: 'S' as FlightType,
      eobt: options.eobt,
      createdAt: now,
      updatedAt: now,
      annotations: [],
      clearances: [],
    };
  }

  /**
   * Generate an arrival strip with pre-filled data
   */
  static createArrival(options: {
    callsign: string;
    aircraftType: string;
    departure: string;
    destination: string;
    route?: string;
    runway?: string;
    gate?: string;
    star?: string;
    eta?: Date;
  }): FlightStrip {
    const now = new Date();
    const aircraft = AircraftDatabase.get(options.aircraftType);
    const wtc = aircraft?.wakeTurbulence || 'M';

    return {
      id: generateId(),
      callsign: options.callsign,
      aircraftType: options.aircraftType,
      wakeTurbulenceCategory: wtc,
      ssrCode: generateSquawk(),
      departure: options.departure,
      destination: options.destination,
      altitude: 0,
      route: options.route || 'DCT',
      star: options.star,
      runway: options.runway,
      gate: options.gate,
      status: 'INITIAL_APPROACH',
      bay: 'approach',
      position: 0,
      flightRules: 'I' as FlightRules,
      flightType: 'S' as FlightType,
      eta: options.eta,
      createdAt: now,
      updatedAt: now,
      annotations: [],
      clearances: [],
    };
  }

  /**
   * Parse altitude from cruise level string
   */
  private static parseAltitude(cruiseLevel: string): number {
    if (!cruiseLevel) return 0;

    // Flight level: F350 = 35000 ft
    if (cruiseLevel.startsWith('F')) {
      return parseInt(cruiseLevel.slice(1)) * 100;
    }

    // Altitude: A100 = 10000 ft
    if (cruiseLevel.startsWith('A')) {
      return parseInt(cruiseLevel.slice(1)) * 100;
    }

    // Metric: S1200 = 12000 m -> convert to ft
    if (cruiseLevel.startsWith('S')) {
      return Math.round(parseInt(cruiseLevel.slice(1)) * 3.28084);
    }

    // VFR
    if (cruiseLevel === 'VFR') {
      return 0;
    }

    return parseInt(cruiseLevel) || 0;
  }

  /**
   * Determine initial bay based on status
   */
  private static determineBay(status: StripStatus, runway?: string): string {
    switch (status) {
      case 'FILED':
        return 'clearance';
      case 'CLEARANCE_DELIVERED':
      case 'PUSH_APPROVED':
        return 'ground';
      case 'TAXIING':
      case 'HOLDING':
      case 'LINEUP':
        return runway ? `rwy-${runway.toLowerCase()}` : 'ground';
      case 'INITIAL_APPROACH':
      case 'FINAL_APPROACH':
        return 'approach';
      case 'LANDED':
      case 'TAXI_IN':
        return 'arrival';
      case 'AT_GATE':
      case 'COMPLETED':
        return 'arrival';
      default:
        return 'clearance';
    }
  }

  /**
   * Create a ghost strip (reference in multiple bays)
   */
  static createGhost(strip: FlightStrip, targetBay: string): FlightStrip {
    return {
      ...strip,
      id: `${strip.id}-ghost-${targetBay}`,
      bay: targetBay,
      isGhost: true,
      ghostSourceBay: strip.bay,
    };
  }

  /**
   * Generate multiple strips from scenario data
   */
  static fromScenario(
    scenario: { flights: ScenarioFlight[] },
    startTime: Date = new Date()
  ): FlightStrip[] {
    return scenario.flights.map((flight, index) => {
      const scheduledTime = this.parseScheduledTime(flight.scheduledTime, startTime);

      if (flight.type === 'DEPARTURE') {
        return this.createDeparture({
          callsign: flight.callsign,
          aircraftType: flight.aircraftType,
          departure: flight.origin || 'RKSI',
          destination: flight.destination || 'RJTT',
          runway: flight.runway,
          gate: flight.gate,
          route: flight.route,
          eobt: scheduledTime,
        });
      } else {
        return this.createArrival({
          callsign: flight.callsign,
          aircraftType: flight.aircraftType,
          departure: flight.origin || 'RJTT',
          destination: flight.destination || 'RKSI',
          runway: flight.runway,
          gate: flight.gate,
          route: flight.route,
          eta: scheduledTime,
        });
      }
    });
  }

  /**
   * Parse scheduled time from scenario format
   */
  private static parseScheduledTime(timeStr: string, baseTime: Date): Date {
    // Format: +MM (minutes from start) or HHMM (absolute UTC)
    if (timeStr.startsWith('+')) {
      const minutes = parseInt(timeStr.slice(1));
      return new Date(baseTime.getTime() + minutes * 60000);
    } else {
      return parseZuluTime(timeStr);
    }
  }
}

// Type for scenario flights
interface ScenarioFlight {
  callsign: string;
  type: 'DEPARTURE' | 'ARRIVAL';
  aircraftType: string;
  scheduledTime: string;
  origin?: string;
  destination?: string;
  runway: string;
  gate: string;
  route?: string;
}

export default StripGenerator;
