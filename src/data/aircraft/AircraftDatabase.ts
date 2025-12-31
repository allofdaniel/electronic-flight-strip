// ============================================================
// Aircraft Performance Database
// Based on EUROCONTROL BADA (Base of Aircraft Data)
// ============================================================

import type { AircraftPerformance, WakeTurbulenceCategory } from '@types/index';

/**
 * Aircraft Performance Database
 * Contains performance data for common aircraft types
 */
export class AircraftDatabase {
  private static database: Map<string, AircraftPerformance> = new Map();
  private static initialized = false;

  /**
   * Initialize the database with default aircraft
   */
  static initialize(): void {
    if (this.initialized) return;

    // Wide-body Jets (Heavy/Super)
    this.add({
      icaoType: 'A388',
      manufacturer: 'Airbus',
      model: 'A380-800',
      wakeTurbulence: 'J',
      mass: { min: 276800, max: 560000, reference: 510000 },
      speeds: { v2: 155, vClimb: 310, vCruise: 490, vDescent: 330, vApproach: 145, vLanding: 140, mmo: 0.89 },
      altitudes: { maxOperational: 43000, optimalCruise: 39000 },
      climb: { rateInitial: 2000, rateCruise: 1200 },
      descent: { rate: 2000, angle: 3 },
    });

    this.add({
      icaoType: 'B77W',
      manufacturer: 'Boeing',
      model: '777-300ER',
      wakeTurbulence: 'H',
      mass: { min: 167800, max: 351500, reference: 299400 },
      speeds: { v2: 155, vClimb: 300, vCruise: 490, vDescent: 320, vApproach: 145, vLanding: 140, mmo: 0.89 },
      altitudes: { maxOperational: 43100, optimalCruise: 39000 },
      climb: { rateInitial: 2200, rateCruise: 1400 },
      descent: { rate: 2200, angle: 3 },
    });

    this.add({
      icaoType: 'B789',
      manufacturer: 'Boeing',
      model: '787-9',
      wakeTurbulence: 'H',
      mass: { min: 128850, max: 254000, reference: 227900 },
      speeds: { v2: 145, vClimb: 290, vCruise: 488, vDescent: 310, vApproach: 140, vLanding: 135, mmo: 0.90 },
      altitudes: { maxOperational: 43000, optimalCruise: 40000 },
      climb: { rateInitial: 2500, rateCruise: 1600 },
      descent: { rate: 2300, angle: 3 },
    });

    this.add({
      icaoType: 'A359',
      manufacturer: 'Airbus',
      model: 'A350-900',
      wakeTurbulence: 'H',
      mass: { min: 142400, max: 280000, reference: 259000 },
      speeds: { v2: 145, vClimb: 300, vCruise: 490, vDescent: 320, vApproach: 140, vLanding: 135, mmo: 0.89 },
      altitudes: { maxOperational: 43000, optimalCruise: 41000 },
      climb: { rateInitial: 2400, rateCruise: 1500 },
      descent: { rate: 2200, angle: 3 },
    });

    this.add({
      icaoType: 'A333',
      manufacturer: 'Airbus',
      model: 'A330-300',
      wakeTurbulence: 'H',
      mass: { min: 124500, max: 242000, reference: 212000 },
      speeds: { v2: 150, vClimb: 290, vCruise: 470, vDescent: 300, vApproach: 140, vLanding: 135, mmo: 0.86 },
      altitudes: { maxOperational: 41000, optimalCruise: 38000 },
      climb: { rateInitial: 2100, rateCruise: 1300 },
      descent: { rate: 2000, angle: 3 },
    });

    // Narrow-body Jets (Medium)
    this.add({
      icaoType: 'A321',
      manufacturer: 'Airbus',
      model: 'A321-200',
      wakeTurbulence: 'M',
      mass: { min: 48500, max: 93500, reference: 82000 },
      speeds: { v2: 145, vClimb: 280, vCruise: 450, vDescent: 290, vApproach: 135, vLanding: 130, mmo: 0.82 },
      altitudes: { maxOperational: 39800, optimalCruise: 37000 },
      climb: { rateInitial: 2500, rateCruise: 1500 },
      descent: { rate: 2000, angle: 3 },
    });

    this.add({
      icaoType: 'A320',
      manufacturer: 'Airbus',
      model: 'A320-200',
      wakeTurbulence: 'M',
      mass: { min: 42600, max: 78000, reference: 70000 },
      speeds: { v2: 140, vClimb: 280, vCruise: 450, vDescent: 290, vApproach: 130, vLanding: 125, mmo: 0.82 },
      altitudes: { maxOperational: 39800, optimalCruise: 37000 },
      climb: { rateInitial: 2600, rateCruise: 1600 },
      descent: { rate: 2100, angle: 3 },
    });

    this.add({
      icaoType: 'B738',
      manufacturer: 'Boeing',
      model: '737-800',
      wakeTurbulence: 'M',
      mass: { min: 41413, max: 79016, reference: 70534 },
      speeds: { v2: 140, vClimb: 280, vCruise: 450, vDescent: 290, vApproach: 130, vLanding: 125, mmo: 0.82 },
      altitudes: { maxOperational: 41000, optimalCruise: 37000 },
      climb: { rateInitial: 2500, rateCruise: 1500 },
      descent: { rate: 2000, angle: 3 },
    });

    this.add({
      icaoType: 'B39M',
      manufacturer: 'Boeing',
      model: '737 MAX 9',
      wakeTurbulence: 'M',
      mass: { min: 45722, max: 88314, reference: 79000 },
      speeds: { v2: 142, vClimb: 285, vCruise: 455, vDescent: 295, vApproach: 132, vLanding: 127, mmo: 0.82 },
      altitudes: { maxOperational: 41000, optimalCruise: 38000 },
      climb: { rateInitial: 2600, rateCruise: 1600 },
      descent: { rate: 2100, angle: 3 },
    });

    // Regional Jets (Medium/Light)
    this.add({
      icaoType: 'E190',
      manufacturer: 'Embraer',
      model: 'E190',
      wakeTurbulence: 'M',
      mass: { min: 28080, max: 51800, reference: 46000 },
      speeds: { v2: 130, vClimb: 270, vCruise: 430, vDescent: 280, vApproach: 125, vLanding: 120, mmo: 0.82 },
      altitudes: { maxOperational: 41000, optimalCruise: 37000 },
      climb: { rateInitial: 2800, rateCruise: 1700 },
      descent: { rate: 2200, angle: 3 },
    });

    this.add({
      icaoType: 'CRJ9',
      manufacturer: 'Bombardier',
      model: 'CRJ-900',
      wakeTurbulence: 'M',
      mass: { min: 21523, max: 38329, reference: 34000 },
      speeds: { v2: 125, vClimb: 260, vCruise: 440, vDescent: 270, vApproach: 125, vLanding: 120, mmo: 0.85 },
      altitudes: { maxOperational: 41000, optimalCruise: 37000 },
      climb: { rateInitial: 2800, rateCruise: 1800 },
      descent: { rate: 2200, angle: 3 },
    });

    // Turboprops (Light/Medium)
    this.add({
      icaoType: 'AT76',
      manufacturer: 'ATR',
      model: 'ATR 72-600',
      wakeTurbulence: 'M',
      mass: { min: 13500, max: 23000, reference: 21500 },
      speeds: { v2: 105, vClimb: 180, vCruise: 275, vDescent: 200, vApproach: 105, vLanding: 100, mmo: 0 },
      altitudes: { maxOperational: 25000, optimalCruise: 23000 },
      climb: { rateInitial: 1800, rateCruise: 1000 },
      descent: { rate: 1500, angle: 3 },
    });

    this.add({
      icaoType: 'DH8D',
      manufacturer: 'De Havilland',
      model: 'Dash 8-400',
      wakeTurbulence: 'M',
      mass: { min: 17185, max: 30481, reference: 28000 },
      speeds: { v2: 110, vClimb: 190, vCruise: 310, vDescent: 220, vApproach: 110, vLanding: 105, mmo: 0 },
      altitudes: { maxOperational: 27000, optimalCruise: 25000 },
      climb: { rateInitial: 2000, rateCruise: 1200 },
      descent: { rate: 1600, angle: 3 },
    });

    // Cargo Aircraft
    this.add({
      icaoType: 'B748',
      manufacturer: 'Boeing',
      model: '747-8F',
      wakeTurbulence: 'H',
      mass: { min: 197131, max: 447696, reference: 400000 },
      speeds: { v2: 165, vClimb: 310, vCruise: 490, vDescent: 330, vApproach: 150, vLanding: 145, mmo: 0.90 },
      altitudes: { maxOperational: 43100, optimalCruise: 39000 },
      climb: { rateInitial: 1800, rateCruise: 1100 },
      descent: { rate: 2000, angle: 3 },
    });

    this.add({
      icaoType: 'B77L',
      manufacturer: 'Boeing',
      model: '777F',
      wakeTurbulence: 'H',
      mass: { min: 145150, max: 347450, reference: 310000 },
      speeds: { v2: 160, vClimb: 300, vCruise: 490, vDescent: 320, vApproach: 145, vLanding: 140, mmo: 0.89 },
      altitudes: { maxOperational: 43100, optimalCruise: 39000 },
      climb: { rateInitial: 2000, rateCruise: 1200 },
      descent: { rate: 2100, angle: 3 },
    });

    // Business Jets (Light)
    this.add({
      icaoType: 'GLF6',
      manufacturer: 'Gulfstream',
      model: 'G650',
      wakeTurbulence: 'M',
      mass: { min: 24721, max: 45178, reference: 40000 },
      speeds: { v2: 130, vClimb: 280, vCruise: 490, vDescent: 290, vApproach: 120, vLanding: 115, mmo: 0.925 },
      altitudes: { maxOperational: 51000, optimalCruise: 45000 },
      climb: { rateInitial: 4000, rateCruise: 2500 },
      descent: { rate: 3000, angle: 3 },
    });

    this.add({
      icaoType: 'C680',
      manufacturer: 'Cessna',
      model: 'Citation Sovereign',
      wakeTurbulence: 'L',
      mass: { min: 8618, max: 13744, reference: 12500 },
      speeds: { v2: 115, vClimb: 250, vCruise: 430, vDescent: 250, vApproach: 110, vLanding: 105, mmo: 0.80 },
      altitudes: { maxOperational: 47000, optimalCruise: 43000 },
      climb: { rateInitial: 3500, rateCruise: 2000 },
      descent: { rate: 2500, angle: 3 },
    });

    this.initialized = true;
  }

  /**
   * Add aircraft to database
   */
  static add(aircraft: AircraftPerformance): void {
    this.database.set(aircraft.icaoType, aircraft);
  }

  /**
   * Get aircraft performance data
   */
  static get(icaoType: string): AircraftPerformance | undefined {
    if (!this.initialized) this.initialize();
    return this.database.get(icaoType);
  }

  /**
   * Get all aircraft types
   */
  static getAllTypes(): string[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.database.keys());
  }

  /**
   * Get aircraft by wake turbulence category
   */
  static getByWakeCategory(category: WakeTurbulenceCategory): AircraftPerformance[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.database.values()).filter(
      (a) => a.wakeTurbulence === category
    );
  }

  /**
   * Search aircraft by manufacturer or model
   */
  static search(query: string): AircraftPerformance[] {
    if (!this.initialized) this.initialize();
    const lowerQuery = query.toLowerCase();
    return Array.from(this.database.values()).filter(
      (a) =>
        a.icaoType.toLowerCase().includes(lowerQuery) ||
        a.manufacturer.toLowerCase().includes(lowerQuery) ||
        a.model.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get wake turbulence category from type
   */
  static getWakeCategory(icaoType: string): WakeTurbulenceCategory {
    const aircraft = this.get(icaoType);
    return aircraft?.wakeTurbulence || 'M';
  }
}

// Initialize on load
AircraftDatabase.initialize();

export default AircraftDatabase;
