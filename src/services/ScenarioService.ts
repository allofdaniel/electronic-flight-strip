// ============================================================
// Scenario Service
// Loads and manages traffic scenarios
// ============================================================

import type { TrafficScenario, FlightStrip } from '@types/index';
import { StripGenerator } from '@modules/fdps/StripGenerator';
import { DefaultScenario } from '@data/scenarios/DefaultScenario';
import { useFlightStore } from '@core/store/flightStore';
import { useSystemStore } from '@core/store/systemStore';

// Available scenarios
const SCENARIOS: Map<string, TrafficScenario> = new Map([
  ['default', DefaultScenario],
]);

export class ScenarioService {
  private static currentScenario: TrafficScenario | null = null;
  private static simulationTimer: NodeJS.Timeout | null = null;
  private static pendingFlights: { strip: FlightStrip; activateAt: Date }[] = [];

  /**
   * Load a scenario by ID
   */
  static loadScenario(scenarioId: string): boolean {
    const scenario = SCENARIOS.get(scenarioId);
    if (!scenario) {
      console.error(`Scenario not found: ${scenarioId}`);
      return false;
    }

    this.currentScenario = scenario;
    const startTime = new Date();

    // Clear existing strips
    const { clearAllStrips, addStrip } = useFlightStore.getState();
    clearAllStrips();

    // Generate strips from scenario
    const strips = this.generateStripsFromScenario(scenario, startTime);

    // Separate immediate and future flights
    const now = Date.now();
    const immediateFlights: FlightStrip[] = [];
    this.pendingFlights = [];

    for (const strip of strips) {
      const activateTime = strip.eobt || strip.eta;
      if (activateTime) {
        const activateAt = new Date(activateTime);
        const timeUntilActivation = activateAt.getTime() - now;

        if (timeUntilActivation <= 0) {
          immediateFlights.push(strip);
        } else {
          this.pendingFlights.push({ strip, activateAt });
        }
      } else {
        immediateFlights.push(strip);
      }
    }

    // Add immediate flights
    for (const strip of immediateFlights) {
      addStrip(strip);
    }

    // Sort pending flights by activation time
    this.pendingFlights.sort(
      (a, b) => a.activateAt.getTime() - b.activateAt.getTime()
    );

    console.log(`Loaded scenario: ${scenario.name}`);
    console.log(`Immediate flights: ${immediateFlights.length}`);
    console.log(`Pending flights: ${this.pendingFlights.length}`);

    return true;
  }

  /**
   * Generate flight strips from scenario data
   */
  private static generateStripsFromScenario(
    scenario: TrafficScenario,
    startTime: Date
  ): FlightStrip[] {
    const strips: FlightStrip[] = [];

    for (const flight of scenario.flights) {
      const scheduledTime = this.parseScheduledTime(flight.scheduledTime, startTime);

      if (flight.type === 'DEPARTURE') {
        strips.push(
          StripGenerator.createDeparture({
            callsign: flight.callsign,
            aircraftType: flight.aircraftType,
            departure: flight.origin || scenario.airport,
            destination: flight.destination || 'ZZZZ',
            runway: flight.runway,
            gate: flight.gate,
            route: flight.route,
            eobt: scheduledTime,
          })
        );
      } else {
        strips.push(
          StripGenerator.createArrival({
            callsign: flight.callsign,
            aircraftType: flight.aircraftType,
            departure: flight.origin || 'ZZZZ',
            destination: flight.destination || scenario.airport,
            runway: flight.runway,
            gate: flight.gate,
            route: flight.route,
            eta: scheduledTime,
          })
        );
      }
    }

    return strips;
  }

  /**
   * Parse scheduled time from scenario format
   */
  private static parseScheduledTime(timeStr: string, baseTime: Date): Date {
    if (timeStr.startsWith('+')) {
      const minutes = parseInt(timeStr.slice(1));
      return new Date(baseTime.getTime() + minutes * 60000);
    } else {
      // Absolute HHMM format
      const hours = parseInt(timeStr.slice(0, 2));
      const minutes = parseInt(timeStr.slice(2, 4));
      const result = new Date(baseTime);
      result.setUTCHours(hours, minutes, 0, 0);
      return result;
    }
  }

  /**
   * Start simulation timer
   */
  static startSimulation(): void {
    if (this.simulationTimer) return;

    const { simulationSpeed } = useSystemStore.getState();
    const interval = 1000 / simulationSpeed; // Adjust interval based on speed

    this.simulationTimer = setInterval(() => {
      this.tickSimulation();
    }, interval);

    useSystemStore.getState().startSimulation();
  }

  /**
   * Stop simulation timer
   */
  static stopSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    useSystemStore.getState().pauseSimulation();
  }

  /**
   * Process one simulation tick
   */
  private static tickSimulation(): void {
    const { simulationTime, simulationSpeed, updateSimulationTime } = useSystemStore.getState();
    const { addStrip, strips, updateStripStatus } = useFlightStore.getState();

    // Advance simulation time
    const newTime = new Date(simulationTime.getTime() + 1000 * simulationSpeed);
    updateSimulationTime(newTime);

    // Activate pending flights
    while (
      this.pendingFlights.length > 0 &&
      this.pendingFlights[0].activateAt.getTime() <= newTime.getTime()
    ) {
      const { strip } = this.pendingFlights.shift()!;
      addStrip(strip);
    }

    // Auto-progress flight statuses based on time
    for (const [stripId, strip] of strips) {
      this.progressFlightStatus(stripId, strip, newTime);
    }
  }

  /**
   * Progress flight status based on simulation time
   */
  private static progressFlightStatus(
    stripId: string,
    strip: FlightStrip,
    currentTime: Date
  ): void {
    const { updateStripStatus, moveStripToBay } = useFlightStore.getState();

    // Departure progression
    if (strip.eobt) {
      const eobtTime = new Date(strip.eobt).getTime();
      const timeDiff = currentTime.getTime() - eobtTime;

      if (strip.status === 'FILED' && timeDiff > -30 * 60000) {
        // 30 min before EOBT -> Start clearance
        updateStripStatus(stripId, 'CLEARANCE_DELIVERED');
      } else if (strip.status === 'CLEARANCE_DELIVERED' && timeDiff > -15 * 60000) {
        // 15 min before -> Push approved
        updateStripStatus(stripId, 'PUSH_APPROVED');
      } else if (strip.status === 'PUSH_APPROVED' && timeDiff > -10 * 60000) {
        // 10 min before -> Taxiing
        updateStripStatus(stripId, 'TAXIING');
        moveStripToBay(stripId, 'ground');
      } else if (strip.status === 'TAXIING' && timeDiff > -5 * 60000) {
        // 5 min before -> Holding
        updateStripStatus(stripId, 'HOLDING');
        moveStripToBay(stripId, strip.runway ? `rwy-${strip.runway.toLowerCase()}` : 'ground');
      } else if (strip.status === 'HOLDING' && timeDiff > -2 * 60000) {
        // 2 min before -> Lineup
        updateStripStatus(stripId, 'LINEUP');
      } else if (strip.status === 'LINEUP' && timeDiff > -1 * 60000) {
        // 1 min before -> Takeoff cleared
        updateStripStatus(stripId, 'TAKEOFF_CLEARED');
      } else if (strip.status === 'TAKEOFF_CLEARED' && timeDiff > 0) {
        // EOBT reached -> Departed
        updateStripStatus(stripId, 'DEPARTED');
        moveStripToBay(stripId, 'departure');
      } else if (strip.status === 'DEPARTED' && timeDiff > 5 * 60000) {
        // 5 min after -> Completed
        updateStripStatus(stripId, 'COMPLETED');
      }
    }

    // Arrival progression
    if (strip.eta) {
      const etaTime = new Date(strip.eta).getTime();
      const timeDiff = currentTime.getTime() - etaTime;

      if (strip.status === 'INITIAL_APPROACH' && timeDiff > -10 * 60000) {
        // 10 min before ETA -> Final approach
        updateStripStatus(stripId, 'FINAL_APPROACH');
        moveStripToBay(stripId, strip.runway ? `rwy-${strip.runway.toLowerCase()}` : 'approach');
      } else if (strip.status === 'FINAL_APPROACH' && timeDiff > 0) {
        // ETA reached -> Landed
        updateStripStatus(stripId, 'LANDED');
      } else if (strip.status === 'LANDED' && timeDiff > 2 * 60000) {
        // 2 min after -> Taxi in
        updateStripStatus(stripId, 'TAXI_IN');
        moveStripToBay(stripId, 'arrival');
      } else if (strip.status === 'TAXI_IN' && timeDiff > 10 * 60000) {
        // 10 min after -> At gate
        updateStripStatus(stripId, 'AT_GATE');
      } else if (strip.status === 'AT_GATE' && timeDiff > 15 * 60000) {
        // 15 min after -> Completed
        updateStripStatus(stripId, 'COMPLETED');
      }
    }
  }

  /**
   * Get available scenarios
   */
  static getAvailableScenarios(): { id: string; name: string; description?: string }[] {
    return Array.from(SCENARIOS.entries()).map(([id, scenario]) => ({
      id,
      name: scenario.name,
      description: scenario.description,
    }));
  }

  /**
   * Add a custom scenario
   */
  static addScenario(scenario: TrafficScenario): void {
    SCENARIOS.set(scenario.id, scenario);
  }

  /**
   * Get current scenario
   */
  static getCurrentScenario(): TrafficScenario | null {
    return this.currentScenario;
  }

  /**
   * Reset scenario to initial state
   */
  static resetScenario(): void {
    if (this.currentScenario) {
      this.stopSimulation();
      this.loadScenario(this.currentScenario.id);
    }
  }
}

export default ScenarioService;
