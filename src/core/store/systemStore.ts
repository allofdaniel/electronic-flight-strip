import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SystemConfig, Bay, RunwayConfiguration, Alert } from '../../types/index';

interface SystemState {
  // Configuration
  config: SystemConfig | null;
  operationalMode: 'LIVE' | 'SIMULATION' | 'TRAINING';
  simulationSpeed: number;
  simulationTime: Date;
  simulationRunning: boolean;

  // Runway Configuration
  runwayConfigs: RunwayConfiguration[];

  // Bays
  bays: Bay[];

  // Alerts
  alerts: Alert[];
  unacknowledgedAlertCount: number;

  // User
  currentUser: string;
  currentPosition: string;

  // Actions
  initializeSystem: (config: SystemConfig) => void;
  setOperationalMode: (mode: 'LIVE' | 'SIMULATION' | 'TRAINING') => void;
  setSimulationSpeed: (speed: number) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  updateSimulationTime: (time: Date) => void;

  // Runway Actions
  updateRunwayConfig: (runway: string, config: Partial<RunwayConfiguration>) => void;
  setActiveRunway: (runway: string, active: boolean) => void;

  // Bay Actions
  addBay: (bay: Bay) => void;
  removeBay: (bayId: string) => void;
  updateBay: (bayId: string, updates: Partial<Bay>) => void;
  reorderBays: (startIndex: number, endIndex: number) => void;

  // Alert Actions
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  clearResolvedAlerts: () => void;
}

export const useSystemStore = create<SystemState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        config: null,
        operationalMode: 'SIMULATION',
        simulationSpeed: 1,
        simulationTime: new Date(),
        simulationRunning: false,
        runwayConfigs: [],
        bays: [],
        alerts: [],
        unacknowledgedAlertCount: 0,
        currentUser: 'Controller',
        currentPosition: 'TWR',

        // Initialize System
        initializeSystem: (config) => {
          set({
            config,
            operationalMode: config.operationalMode,
            simulationSpeed: config.simulationSpeed,
            runwayConfigs: config.runwayConfiguration,
            bays: config.bays,
            simulationTime: new Date(),
          });
        },

        // Mode Actions
        setOperationalMode: (mode) => set({ operationalMode: mode }),

        setSimulationSpeed: (speed) => set({ simulationSpeed: Math.max(0.1, Math.min(10, speed)) }),

        startSimulation: () => set({ simulationRunning: true }),

        pauseSimulation: () => set({ simulationRunning: false }),

        resetSimulation: () => set({
          simulationTime: new Date(),
          simulationRunning: false,
        }),

        updateSimulationTime: (time) => set({ simulationTime: time }),

        // Runway Actions
        updateRunwayConfig: (runway, config) => set((state) => ({
          runwayConfigs: state.runwayConfigs.map((r) =>
            r.runway === runway ? { ...r, ...config } : r
          ),
        })),

        setActiveRunway: (runway, active) => set((state) => ({
          runwayConfigs: state.runwayConfigs.map((r) =>
            r.runway === runway ? { ...r, active } : r
          ),
        })),

        // Bay Actions
        addBay: (bay) => set((state) => ({
          bays: [...state.bays, bay],
        })),

        removeBay: (bayId) => set((state) => ({
          bays: state.bays.filter((b) => b.id !== bayId),
        })),

        updateBay: (bayId, updates) => set((state) => ({
          bays: state.bays.map((b) =>
            b.id === bayId ? { ...b, ...updates } : b
          ),
        })),

        reorderBays: (startIndex, endIndex) => set((state) => {
          const newBays = [...state.bays];
          const [removed] = newBays.splice(startIndex, 1);
          newBays.splice(endIndex, 0, removed);
          return { bays: newBays };
        }),

        // Alert Actions
        addAlert: (alert) => set((state) => ({
          alerts: [alert, ...state.alerts],
          unacknowledgedAlertCount: state.unacknowledgedAlertCount + 1,
        })),

        acknowledgeAlert: (alertId) => set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, acknowledgedAt: new Date(), acknowledgedBy: state.currentUser }
              : a
          ),
          unacknowledgedAlertCount: Math.max(0, state.unacknowledgedAlertCount - 1),
        })),

        resolveAlert: (alertId) => set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? { ...a, resolved: true, resolvedAt: new Date() }
              : a
          ),
        })),

        clearResolvedAlerts: () => set((state) => ({
          alerts: state.alerts.filter((a) => !a.resolved),
        })),
      }),
      {
        name: 'efs-system-store',
        partialize: (state) => ({
          operationalMode: state.operationalMode,
          currentUser: state.currentUser,
          currentPosition: state.currentPosition,
        }),
      }
    ),
    { name: 'SystemStore' }
  )
);
