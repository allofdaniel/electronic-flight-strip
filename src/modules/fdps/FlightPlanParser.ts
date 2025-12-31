// ============================================================
// FDPS - ICAO Flight Plan Parser
// Parses ICAO FPL format messages according to Doc 4444
// ============================================================

import type { ParsedFlightPlan, FlightRules, FlightType, WakeTurbulenceCategory } from '@types/index';

/**
 * ICAO Flight Plan Message Parser
 * Supports FPL, CHG, CNL, DEP, ARR message types
 */
export class FlightPlanParser {
  /**
   * Parse an ICAO FPL message string
   */
  static parse(message: string): ParsedFlightPlan | null {
    try {
      const normalized = this.normalizeMessage(message);
      const messageType = this.extractMessageType(normalized);

      if (!messageType) {
        console.error('Unknown message type');
        return null;
      }

      switch (messageType) {
        case 'FPL':
          return this.parseFPL(normalized);
        case 'CHG':
          return this.parseCHG(normalized);
        case 'CNL':
          return this.parseCNL(normalized);
        case 'DEP':
          return this.parseDEP(normalized);
        case 'ARR':
          return this.parseARR(normalized);
        default:
          return null;
      }
    } catch (error) {
      console.error('Flight plan parse error:', error);
      return null;
    }
  }

  /**
   * Normalize message - remove extra whitespace, standardize format
   */
  private static normalizeMessage(message: string): string {
    return message
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/-\s+/g, '-')
      .trim()
      .toUpperCase();
  }

  /**
   * Extract message type (FPL, CHG, CNL, DEP, ARR)
   */
  private static extractMessageType(message: string): string | null {
    const match = message.match(/^\(?(FPL|CHG|CNL|DEP|ARR)/);
    return match ? match[1] : null;
  }

  /**
   * Parse FPL (Filed Flight Plan) message
   * Format: (FPL-CALLSIGN-RULES TYPE/WTC-ACTYPE/EQUIP-DEP/TIME-SPEED/LEVEL ROUTE-DEST/EET ALT1 ALT2-OTHER)
   */
  private static parseFPL(message: string): ParsedFlightPlan {
    const result: ParsedFlightPlan = {
      messageType: 'FPL',
      callsign: '',
      flightRules: 'I' as FlightRules,
      flightType: 'S' as FlightType,
      aircraftCount: 1,
      aircraftType: '',
      wakeTurbulence: 'M' as WakeTurbulenceCategory,
      equipment: '',
      surveillance: '',
      departureAirport: '',
      eobt: '',
      cruiseSpeed: '',
      cruiseLevel: '',
      route: '',
      destinationAirport: '',
      eet: '',
      alternateAirports: [],
      otherInfo: {},
    };

    // Remove outer parentheses and split by hyphens
    const content = message.replace(/^\(/, '').replace(/\)$/, '');
    const fields = this.splitByDash(content);

    // Field 3: Message type (already extracted)
    // Skip "FPL"

    // Field 7: Aircraft identification
    if (fields[1]) {
      result.callsign = fields[1];
    }

    // Field 8: Flight rules and type
    if (fields[2]) {
      const rulesType = fields[2];
      result.flightRules = (rulesType[0] || 'I') as FlightRules;
      result.flightType = (rulesType[1] || 'S') as FlightType;
    }

    // Field 9: Number and type of aircraft, wake turbulence
    if (fields[3]) {
      const match = fields[3].match(/^(\d*)([A-Z0-9]+)\/([JHLM])/);
      if (match) {
        result.aircraftCount = match[1] ? parseInt(match[1]) : 1;
        result.aircraftType = match[2];
        result.wakeTurbulence = match[3] as WakeTurbulenceCategory;
      } else {
        // Try simpler format: TYPE/WTC
        const simpleMatch = fields[3].match(/^([A-Z0-9]+)\/([JHLM])/);
        if (simpleMatch) {
          result.aircraftType = simpleMatch[1];
          result.wakeTurbulence = simpleMatch[2] as WakeTurbulenceCategory;
        }
      }
    }

    // Field 10: Equipment and surveillance
    if (fields[4]) {
      const [equip, surv] = fields[4].split('/');
      result.equipment = equip || '';
      result.surveillance = surv || '';
    }

    // Field 13: Departure aerodrome and time
    if (fields[5]) {
      const match = fields[5].match(/^([A-Z]{4})(\d{4})/);
      if (match) {
        result.departureAirport = match[1];
        result.eobt = match[2];
      }
    }

    // Field 15: Cruising speed, level, and route
    if (fields[6]) {
      const routeField = fields[6];
      // Speed: N0450 (knots) or M082 (mach)
      const speedMatch = routeField.match(/^([NMK]\d{4})/);
      if (speedMatch) {
        result.cruiseSpeed = speedMatch[1];
      }

      // Level: F350 (flight level) or A100 (altitude) or VFR
      const levelMatch = routeField.match(/([FAM]\d{3,4}|VFR|S\d{4})/);
      if (levelMatch) {
        result.cruiseLevel = levelMatch[1];
      }

      // Route: everything after speed and level
      const routeStart = routeField.indexOf(' ');
      if (routeStart > 0) {
        result.route = routeField.substring(routeStart + 1).trim();
      }
    }

    // Field 16: Destination and EET, alternates
    if (fields[7]) {
      const destField = fields[7];
      // Primary destination: ICAO code + EET
      const destMatch = destField.match(/^([A-Z]{4})(\d{4})?/);
      if (destMatch) {
        result.destinationAirport = destMatch[1];
        result.eet = destMatch[2] || '';
      }

      // Alternates: additional ICAO codes
      const altMatches = destField.match(/\s([A-Z]{4})/g);
      if (altMatches) {
        result.alternateAirports = altMatches.map((a) => a.trim());
      }
    }

    // Field 18: Other information
    if (fields[8]) {
      result.otherInfo = this.parseOtherInfo(fields[8]);
    }

    return result;
  }

  /**
   * Parse CHG (Change) message
   */
  private static parseCHG(message: string): ParsedFlightPlan {
    // CHG messages reference an existing flight plan with changes
    // For now, treat as partial FPL
    const result = this.parseFPL(message);
    result.messageType = 'CHG';
    return result;
  }

  /**
   * Parse CNL (Cancel) message
   */
  private static parseCNL(message: string): ParsedFlightPlan {
    const result: ParsedFlightPlan = {
      messageType: 'CNL',
      callsign: '',
      flightRules: 'I' as FlightRules,
      flightType: 'S' as FlightType,
      aircraftCount: 1,
      aircraftType: '',
      wakeTurbulence: 'M' as WakeTurbulenceCategory,
      equipment: '',
      surveillance: '',
      departureAirport: '',
      eobt: '',
      cruiseSpeed: '',
      cruiseLevel: '',
      route: '',
      destinationAirport: '',
      eet: '',
      alternateAirports: [],
      otherInfo: {},
    };

    const fields = this.splitByDash(message.replace(/^\(/, '').replace(/\)$/, ''));

    if (fields[1]) result.callsign = fields[1];
    if (fields[2]) result.departureAirport = fields[2].slice(0, 4);

    return result;
  }

  /**
   * Parse DEP (Departure) message
   */
  private static parseDEP(message: string): ParsedFlightPlan {
    const result: ParsedFlightPlan = {
      messageType: 'DEP',
      callsign: '',
      flightRules: 'I' as FlightRules,
      flightType: 'S' as FlightType,
      aircraftCount: 1,
      aircraftType: '',
      wakeTurbulence: 'M' as WakeTurbulenceCategory,
      equipment: '',
      surveillance: '',
      departureAirport: '',
      eobt: '',
      cruiseSpeed: '',
      cruiseLevel: '',
      route: '',
      destinationAirport: '',
      eet: '',
      alternateAirports: [],
      otherInfo: {},
    };

    const fields = this.splitByDash(message.replace(/^\(/, '').replace(/\)$/, ''));

    if (fields[1]) result.callsign = fields[1];
    if (fields[2]) {
      const match = fields[2].match(/^([A-Z]{4})(\d{4})/);
      if (match) {
        result.departureAirport = match[1];
        result.eobt = match[2]; // Actually ATD (Actual Time of Departure)
      }
    }
    if (fields[3]) result.destinationAirport = fields[3].slice(0, 4);

    return result;
  }

  /**
   * Parse ARR (Arrival) message
   */
  private static parseARR(message: string): ParsedFlightPlan {
    const result: ParsedFlightPlan = {
      messageType: 'ARR',
      callsign: '',
      flightRules: 'I' as FlightRules,
      flightType: 'S' as FlightType,
      aircraftCount: 1,
      aircraftType: '',
      wakeTurbulence: 'M' as WakeTurbulenceCategory,
      equipment: '',
      surveillance: '',
      departureAirport: '',
      eobt: '',
      cruiseSpeed: '',
      cruiseLevel: '',
      route: '',
      destinationAirport: '',
      eet: '',
      alternateAirports: [],
      otherInfo: {},
    };

    const fields = this.splitByDash(message.replace(/^\(/, '').replace(/\)$/, ''));

    if (fields[1]) result.callsign = fields[1];
    if (fields[2]) result.departureAirport = fields[2].slice(0, 4);
    if (fields[3]) {
      const match = fields[3].match(/^([A-Z]{4})(\d{4})/);
      if (match) {
        result.destinationAirport = match[1];
        result.eet = match[2]; // Actually ATA (Actual Time of Arrival)
      }
    }

    return result;
  }

  /**
   * Parse Field 18 other information
   * Format: KEY/VALUE KEY/VALUE ...
   */
  private static parseOtherInfo(field18: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = field18.match(/([A-Z]+)\/([^\s]+)/g);

    if (pairs) {
      for (const pair of pairs) {
        const [key, value] = pair.split('/');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Split message by dashes, respecting parentheses
   */
  private static splitByDash(message: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of message) {
      if (char === '(') depth++;
      else if (char === ')') depth--;

      if (char === '-' && depth === 0) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) result.push(current.trim());

    return result;
  }

  /**
   * Validate a parsed flight plan
   */
  static validate(fpl: ParsedFlightPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fpl.callsign || fpl.callsign.length < 2) {
      errors.push('Invalid or missing callsign');
    }

    if (!fpl.aircraftType) {
      errors.push('Missing aircraft type');
    }

    if (!fpl.departureAirport || fpl.departureAirport.length !== 4) {
      errors.push('Invalid departure airport code');
    }

    if (!fpl.destinationAirport || fpl.destinationAirport.length !== 4) {
      errors.push('Invalid destination airport code');
    }

    if (!['I', 'V', 'Y', 'Z'].includes(fpl.flightRules)) {
      errors.push('Invalid flight rules');
    }

    if (!['J', 'H', 'M', 'L'].includes(fpl.wakeTurbulence)) {
      errors.push('Invalid wake turbulence category');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate ICAO FPL message from parsed data
   */
  static generate(fpl: ParsedFlightPlan): string {
    const parts: string[] = ['FPL'];

    // Field 7: Callsign
    parts.push(fpl.callsign);

    // Field 8: Flight rules and type
    parts.push(`${fpl.flightRules}${fpl.flightType}`);

    // Field 9: Aircraft type and WTC
    const count = fpl.aircraftCount > 1 ? fpl.aircraftCount.toString() : '';
    parts.push(`${count}${fpl.aircraftType}/${fpl.wakeTurbulence}`);

    // Field 10: Equipment
    parts.push(`${fpl.equipment}/${fpl.surveillance}`);

    // Field 13: Departure
    parts.push(`${fpl.departureAirport}${fpl.eobt}`);

    // Field 15: Route
    parts.push(`${fpl.cruiseSpeed}${fpl.cruiseLevel} ${fpl.route}`);

    // Field 16: Destination
    let dest = `${fpl.destinationAirport}${fpl.eet}`;
    if (fpl.alternateAirports.length > 0) {
      dest += ' ' + fpl.alternateAirports.join(' ');
    }
    parts.push(dest);

    // Field 18: Other info
    if (Object.keys(fpl.otherInfo).length > 0) {
      const otherParts = Object.entries(fpl.otherInfo).map(([k, v]) => `${k}/${v}`);
      parts.push(otherParts.join(' '));
    }

    return `(${parts.join('-')})`;
  }
}

export default FlightPlanParser;
