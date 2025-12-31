// ============================================================
// Wake Turbulence Separation Calculator
// Based on ICAO Doc 4444 and RECAT-EU
// ============================================================

import type { WakeTurbulenceCategory, FlightStrip } from '@types/index';

/**
 * Separation matrix in nautical miles (NM)
 * Row: Leading aircraft, Column: Following aircraft
 */
const ICAO_SEPARATION_MATRIX: Record<WakeTurbulenceCategory, Record<WakeTurbulenceCategory, number>> = {
  // SUPER (J) leading
  J: {
    J: 0, // No wake separation between Super aircraft
    H: 6,
    M: 7,
    L: 8,
  },
  // HEAVY (H) leading
  H: {
    J: 0,
    H: 4,
    M: 5,
    L: 6,
  },
  // MEDIUM (M) leading
  M: {
    J: 0,
    H: 0,
    M: 0,
    L: 5,
  },
  // LIGHT (L) leading
  L: {
    J: 0,
    H: 0,
    M: 0,
    L: 0,
  },
};

/**
 * Time-based separation in seconds for departures
 */
const DEPARTURE_TIME_SEPARATION: Record<WakeTurbulenceCategory, Record<WakeTurbulenceCategory, number>> = {
  J: { J: 0, H: 180, M: 180, L: 180 },
  H: { J: 0, H: 120, M: 120, L: 180 },
  M: { J: 0, H: 0, M: 0, L: 120 },
  L: { J: 0, H: 0, M: 0, L: 0 },
};

/**
 * RECAT-EU categories (more refined than ICAO)
 */
export type RECATCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const RECAT_EU_MATRIX: Record<RECATCategory, Record<RECATCategory, number>> = {
  A: { A: 3, B: 4, C: 5, D: 5, E: 6, F: 8 },
  B: { A: 0, B: 3, C: 4, D: 4, E: 5, F: 7 },
  C: { A: 0, B: 0, C: 3, D: 3, E: 4, F: 6 },
  D: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 5 },
  E: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 4 },
  F: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 3 },
};

/**
 * Map ICAO WTC to RECAT category
 * Note: This is simplified - actual RECAT is based on aircraft type
 */
const WTC_TO_RECAT: Record<WakeTurbulenceCategory, RECATCategory> = {
  J: 'A', // Super -> A (A380 etc)
  H: 'B', // Heavy -> B (most heavies)
  M: 'D', // Medium -> D (most mediums)
  L: 'F', // Light -> F
};

export class WakeTurbulenceSeparation {
  /**
   * Get required wake turbulence separation in NM (ICAO standard)
   */
  static getICAOSeparation(
    leadingWTC: WakeTurbulenceCategory,
    followingWTC: WakeTurbulenceCategory
  ): number {
    return ICAO_SEPARATION_MATRIX[leadingWTC][followingWTC];
  }

  /**
   * Get required time separation in seconds for departures
   */
  static getDepartureTimeSeparation(
    leadingWTC: WakeTurbulenceCategory,
    followingWTC: WakeTurbulenceCategory
  ): number {
    return DEPARTURE_TIME_SEPARATION[leadingWTC][followingWTC];
  }

  /**
   * Get RECAT-EU separation in NM
   */
  static getRECATSeparation(
    leadingCategory: RECATCategory,
    followingCategory: RECATCategory
  ): number {
    return RECAT_EU_MATRIX[leadingCategory][followingCategory];
  }

  /**
   * Get separation using RECAT-EU based on WTC
   */
  static getRECATFromWTC(
    leadingWTC: WakeTurbulenceCategory,
    followingWTC: WakeTurbulenceCategory
  ): number {
    const leadingRecat = WTC_TO_RECAT[leadingWTC];
    const followingRecat = WTC_TO_RECAT[followingWTC];
    return RECAT_EU_MATRIX[leadingRecat][followingRecat];
  }

  /**
   * Calculate minimum separation between two aircraft
   */
  static calculateSeparation(
    leading: FlightStrip,
    following: FlightStrip,
    useRECAT: boolean = false
  ): {
    distance: number; // NM
    time: number; // seconds
    reason: string;
  } {
    const leadWTC = leading.wakeTurbulenceCategory;
    const followWTC = following.wakeTurbulenceCategory;

    let distance: number;
    let reason: string;

    if (useRECAT) {
      distance = this.getRECATFromWTC(leadWTC, followWTC);
      reason = `RECAT-EU: ${WTC_TO_RECAT[leadWTC]} → ${WTC_TO_RECAT[followWTC]}`;
    } else {
      distance = this.getICAOSeparation(leadWTC, followWTC);
      reason = `ICAO WTC: ${leadWTC} → ${followWTC}`;
    }

    const time = this.getDepartureTimeSeparation(leadWTC, followWTC);

    // Apply minimum radar separation if no wake separation required
    if (distance === 0) {
      distance = 3; // Standard radar separation
      reason = 'Standard radar separation (no wake requirement)';
    }

    return { distance, time, reason };
  }

  /**
   * Check if separation is adequate
   */
  static isSeparationAdequate(
    leading: FlightStrip,
    following: FlightStrip,
    actualDistance: number,
    actualTimeDiff: number,
    useRECAT: boolean = false
  ): {
    adequate: boolean;
    requiredDistance: number;
    requiredTime: number;
    shortfall: { distance: number; time: number };
  } {
    const { distance, time } = this.calculateSeparation(leading, following, useRECAT);

    const distanceAdequate = actualDistance >= distance;
    const timeAdequate = actualTimeDiff >= time;

    return {
      adequate: distanceAdequate || timeAdequate,
      requiredDistance: distance,
      requiredTime: time,
      shortfall: {
        distance: distanceAdequate ? 0 : distance - actualDistance,
        time: timeAdequate ? 0 : time - actualTimeDiff,
      },
    };
  }

  /**
   * Get sequence order optimized for wake turbulence
   * Smaller aircraft should go before larger to minimize delays
   */
  static optimizeSequence(strips: FlightStrip[]): FlightStrip[] {
    const wtcOrder: Record<WakeTurbulenceCategory, number> = {
      L: 0,
      M: 1,
      H: 2,
      J: 3,
    };

    return [...strips].sort((a, b) => {
      // First by scheduled time, then by WTC (lighter first)
      const timeA = a.eobt || a.tsat || a.ttot;
      const timeB = b.eobt || b.tsat || b.ttot;

      if (timeA && timeB) {
        const timeDiff = new Date(timeA).getTime() - new Date(timeB).getTime();
        if (Math.abs(timeDiff) > 5 * 60000) {
          // More than 5 minutes apart, use time
          return timeDiff;
        }
      }

      // Within 5 minutes, lighter goes first
      return wtcOrder[a.wakeTurbulenceCategory] - wtcOrder[b.wakeTurbulenceCategory];
    });
  }

  /**
   * Calculate total delay introduced by wake turbulence in a sequence
   */
  static calculateSequenceDelay(sequence: FlightStrip[], baseInterval: number = 90): number {
    let totalDelay = 0;

    for (let i = 1; i < sequence.length; i++) {
      const { time } = this.calculateSeparation(sequence[i - 1], sequence[i], true);
      const additionalDelay = Math.max(0, time - baseInterval);
      totalDelay += additionalDelay;
    }

    return totalDelay; // seconds
  }

  /**
   * Get wake turbulence category label
   */
  static getWTCLabel(wtc: WakeTurbulenceCategory): string {
    const labels: Record<WakeTurbulenceCategory, string> = {
      J: 'Super',
      H: 'Heavy',
      M: 'Medium',
      L: 'Light',
    };
    return labels[wtc];
  }

  /**
   * Get RECAT category for aircraft type
   * Note: This should be expanded with actual aircraft type database
   */
  static getRECATForType(aircraftType: string): RECATCategory {
    // Super aircraft
    if (['A388', 'A38F'].includes(aircraftType)) return 'A';

    // Upper Heavy
    if (['B744', 'B748', 'B77W', 'B77L', 'A333', 'A339', 'A359', 'A35K'].includes(aircraftType)) return 'B';

    // Lower Heavy
    if (['B763', 'B764', 'B772', 'A306', 'A310', 'A343', 'A346'].includes(aircraftType)) return 'C';

    // Upper Medium
    if (['B738', 'B739', 'B39M', 'A320', 'A321', 'A20N', 'A21N'].includes(aircraftType)) return 'D';

    // Lower Medium
    if (['E190', 'E195', 'CRJ9', 'AT76', 'DH8D'].includes(aircraftType)) return 'E';

    // Light
    return 'F';
  }
}

export default WakeTurbulenceSeparation;
