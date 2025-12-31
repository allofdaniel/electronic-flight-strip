import { useFlightStore } from '../core/store/flightStore';
import { useSystemStore } from '../core/store/systemStore';
import type { FlightStrip, StripStatus } from '../types/index';

// Status progression for departures
const DEPARTURE_STATUS_FLOW: StripStatus[] = [
  'FILED',
  'CLEARANCE_DELIVERED',
  'PUSH_APPROVED',
  'TAXIING',
  'HOLDING',
  'LINEUP',
  'TAKEOFF_CLEARED',
  'DEPARTED',
];

// Status progression for arrivals
const ARRIVAL_STATUS_FLOW: StripStatus[] = [
  'INITIAL_APPROACH',
  'FINAL_APPROACH',
  'LANDED',
  'TAXI_IN',
  'AT_GATE',
];

// Bay assignments based on status
const STATUS_TO_BAY: Record<StripStatus, string> = {
  FILED: 'clearance',
  ACTIVE: 'clearance',
  CLEARANCE_DELIVERED: 'clearance',
  PUSH_APPROVED: 'ground',
  TAXIING: 'ground',
  HOLDING: 'rwy-33l', // Will be determined by runway
  LINEUP: 'rwy-33l',
  TAKEOFF_CLEARED: 'rwy-33l',
  DEPARTED: 'departure',
  INITIAL_APPROACH: 'approach',
  FINAL_APPROACH: 'rwy-33l',
  LANDED: 'arrival',
  TAXI_IN: 'arrival',
  AT_GATE: 'arrival',
  COMPLETED: 'arrival',
};

// Time intervals for status transitions (in seconds at 1x speed)
const STATUS_DURATIONS: Partial<Record<StripStatus, number>> = {
  FILED: 120,
  CLEARANCE_DELIVERED: 60,
  PUSH_APPROVED: 90,
  TAXIING: 180,
  HOLDING: 60,
  LINEUP: 30,
  TAKEOFF_CLEARED: 20,
  INITIAL_APPROACH: 180,
  FINAL_APPROACH: 120,
  LANDED: 30,
  TAXI_IN: 180,
};

class SimulationEngine {
  private intervalId: number | null = null;
  private stripTimers: Map<string, number> = new Map();
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize timers for all strips
    const strips = useFlightStore.getState().strips;
    strips.forEach((strip) => {
      this.initializeStripTimer(strip);
    });

    // Run simulation tick every second
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 1000);

    console.log('[SimulationEngine] Started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.stripTimers.clear();
    console.log('[SimulationEngine] Stopped');
  }

  private initializeStripTimer(strip: FlightStrip) {
    const duration = STATUS_DURATIONS[strip.status];
    if (duration) {
      // Random offset to make transitions more realistic
      const randomOffset = Math.floor(Math.random() * 30);
      this.stripTimers.set(strip.id, duration + randomOffset);
    }
  }

  private tick() {
    const { strips, updateStrip, moveStripToBay } = useFlightStore.getState();
    const { simulationSpeed } = useSystemStore.getState();

    strips.forEach((strip) => {
      const remainingTime = this.stripTimers.get(strip.id);

      if (remainingTime === undefined) {
        this.initializeStripTimer(strip);
        return;
      }

      // Decrease timer by simulation speed
      const newTime = remainingTime - simulationSpeed;

      if (newTime <= 0) {
        // Time to transition to next status
        this.transitionStrip(strip);
      } else {
        this.stripTimers.set(strip.id, newTime);
      }
    });
  }

  private transitionStrip(strip: FlightStrip) {
    const { updateStripStatus, moveStripToBay } = useFlightStore.getState();

    // Determine if departure or arrival
    const isDeparture = DEPARTURE_STATUS_FLOW.includes(strip.status);
    const statusFlow = isDeparture ? DEPARTURE_STATUS_FLOW : ARRIVAL_STATUS_FLOW;

    const currentIndex = statusFlow.indexOf(strip.status);

    // If at the end of the flow, don't transition
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) {
      this.stripTimers.delete(strip.id);
      return;
    }

    const nextStatus = statusFlow[currentIndex + 1];

    // Update status
    updateStripStatus(strip.id, nextStatus);

    // Determine new bay based on status and runway
    let newBay = STATUS_TO_BAY[nextStatus];

    // Adjust bay for runway-specific statuses
    if (strip.runway) {
      if (['HOLDING', 'LINEUP', 'TAKEOFF_CLEARED', 'FINAL_APPROACH'].includes(nextStatus)) {
        newBay = `rwy-${strip.runway.toLowerCase()}`;
      }
    }

    // Move to new bay if different
    if (newBay && newBay !== strip.bay) {
      moveStripToBay(strip.id, newBay);
    }

    // Reset timer for new status
    const duration = STATUS_DURATIONS[nextStatus];
    if (duration) {
      const randomOffset = Math.floor(Math.random() * 20);
      this.stripTimers.set(strip.id, duration + randomOffset);
    } else {
      this.stripTimers.delete(strip.id);
    }

    console.log(`[SimulationEngine] ${strip.callsign}: ${strip.status} -> ${nextStatus}`);
  }

  isActive() {
    return this.isRunning;
  }
}

// Singleton instance
export const simulationEngine = new SimulationEngine();
