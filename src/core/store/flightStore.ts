import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  FlightStrip,
  StripStatus,
  Annotation,
  Clearance,
  ClearanceType,
} from '../../types/index';
import { generateId } from '../../utils/helpers';

interface FlightState {
  // Strips
  strips: Map<string, FlightStrip>;
  stripsByBay: Map<string, string[]>; // bayId -> stripIds
  selectedStripId: string | null;
  highlightedStripIds: Set<string>;

  // Filters
  searchQuery: string;
  statusFilter: StripStatus | null;
  typeFilter: 'DEPARTURE' | 'ARRIVAL' | null;

  // Drag & Drop
  draggingStripId: string | null;
  dropTargetBayId: string | null;

  // Actions - Strip CRUD
  addStrip: (strip: FlightStrip) => void;
  updateStrip: (stripId: string, updates: Partial<FlightStrip>) => void;
  removeStrip: (stripId: string) => void;

  // Actions - Strip Selection
  selectStrip: (stripId: string | null) => void;
  highlightStrip: (stripId: string) => void;
  clearHighlights: () => void;

  // Actions - Strip Movement
  moveStripToBay: (stripId: string, toBayId: string, position?: number) => void;
  reorderStripInBay: (bayId: string, fromIndex: number, toIndex: number) => void;

  // Actions - Status & Clearances
  updateStripStatus: (stripId: string, status: StripStatus) => void;
  addClearance: (stripId: string, type: ClearanceType, value: string) => void;
  confirmReadback: (stripId: string, clearanceId: string) => void;

  // Actions - Annotations
  addAnnotation: (stripId: string, content: string, symbol?: string) => void;
  removeAnnotation: (stripId: string, annotationId: string) => void;

  // Actions - Drag & Drop
  startDragging: (stripId: string) => void;
  setDropTarget: (bayId: string | null) => void;
  endDragging: () => void;

  // Actions - Filters
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: StripStatus | null) => void;
  setTypeFilter: (type: 'DEPARTURE' | 'ARRIVAL' | null) => void;
  clearFilters: () => void;

  // Actions - Scenario
  loadScenario: (scenarioId: string) => void;
  loadSampleData: () => void;
  clearAllStrips: () => void;

  // Getters
  getStrip: (stripId: string) => FlightStrip | undefined;
  getStripsByBay: (bayId: string) => FlightStrip[];
  getFilteredStrips: () => FlightStrip[];
  getStripByCallsign: (callsign: string) => FlightStrip | undefined;
}

export const useFlightStore = create<FlightState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      strips: new Map(),
      stripsByBay: new Map(),
      selectedStripId: null,
      highlightedStripIds: new Set(),
      searchQuery: '',
      statusFilter: null,
      typeFilter: null,
      draggingStripId: null,
      dropTargetBayId: null,

      // Strip CRUD
      addStrip: (strip) => set((state) => {
        const newStrips = new Map(state.strips);
        newStrips.set(strip.id, strip);

        const newStripsByBay = new Map(state.stripsByBay);
        const bayStrips = newStripsByBay.get(strip.bay) || [];
        newStripsByBay.set(strip.bay, [...bayStrips, strip.id]);

        return { strips: newStrips, stripsByBay: newStripsByBay };
      }),

      updateStrip: (stripId, updates) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const newStrips = new Map(state.strips);
        newStrips.set(stripId, {
          ...strip,
          ...updates,
          updatedAt: new Date(),
        });

        return { strips: newStrips };
      }),

      removeStrip: (stripId) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const newStrips = new Map(state.strips);
        newStrips.delete(stripId);

        const newStripsByBay = new Map(state.stripsByBay);
        const bayStrips = newStripsByBay.get(strip.bay) || [];
        newStripsByBay.set(strip.bay, bayStrips.filter((id) => id !== stripId));

        return {
          strips: newStrips,
          stripsByBay: newStripsByBay,
          selectedStripId: state.selectedStripId === stripId ? null : state.selectedStripId,
        };
      }),

      // Selection
      selectStrip: (stripId) => set({ selectedStripId: stripId }),

      highlightStrip: (stripId) => set((state) => {
        const newHighlighted = new Set(state.highlightedStripIds);
        newHighlighted.add(stripId);
        return { highlightedStripIds: newHighlighted };
      }),

      clearHighlights: () => set({ highlightedStripIds: new Set() }),

      // Strip Movement
      moveStripToBay: (stripId, toBayId, position) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const fromBayId = strip.bay;

        // Update strip's bay
        const newStrips = new Map(state.strips);
        newStrips.set(stripId, { ...strip, bay: toBayId, updatedAt: new Date() });

        // Update bay mappings
        const newStripsByBay = new Map(state.stripsByBay);

        // Remove from old bay
        const fromBayStrips = newStripsByBay.get(fromBayId) || [];
        newStripsByBay.set(fromBayId, fromBayStrips.filter((id) => id !== stripId));

        // Add to new bay
        const toBayStrips = newStripsByBay.get(toBayId) || [];
        if (position !== undefined) {
          toBayStrips.splice(position, 0, stripId);
          newStripsByBay.set(toBayId, toBayStrips);
        } else {
          newStripsByBay.set(toBayId, [...toBayStrips, stripId]);
        }

        return { strips: newStrips, stripsByBay: newStripsByBay };
      }),

      reorderStripInBay: (bayId, fromIndex, toIndex) => set((state) => {
        const newStripsByBay = new Map(state.stripsByBay);
        const bayStrips = [...(newStripsByBay.get(bayId) || [])];

        const [removed] = bayStrips.splice(fromIndex, 1);
        bayStrips.splice(toIndex, 0, removed);

        newStripsByBay.set(bayId, bayStrips);
        return { stripsByBay: newStripsByBay };
      }),

      // Status & Clearances
      updateStripStatus: (stripId, status) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const newStrips = new Map(state.strips);
        newStrips.set(stripId, { ...strip, status, updatedAt: new Date() });

        return { strips: newStrips };
      }),

      addClearance: (stripId, type, value) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const clearance: Clearance = {
          id: generateId(),
          stripId,
          type,
          value,
          issuedBy: 'Controller', // TODO: Get from system store
          issuedAt: new Date(),
          readbackReceived: false,
        };

        const newStrips = new Map(state.strips);
        newStrips.set(stripId, {
          ...strip,
          clearances: [...strip.clearances, clearance],
          updatedAt: new Date(),
        });

        return { strips: newStrips };
      }),

      confirmReadback: (stripId, clearanceId) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const newStrips = new Map(state.strips);
        newStrips.set(stripId, {
          ...strip,
          clearances: strip.clearances.map((c) =>
            c.id === clearanceId ? { ...c, readbackReceived: true } : c
          ),
          updatedAt: new Date(),
        });

        return { strips: newStrips };
      }),

      // Annotations
      addAnnotation: (stripId, content, symbol) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const annotation: Annotation = {
          id: generateId(),
          stripId,
          content,
          symbol,
          createdBy: 'Controller',
          createdAt: new Date(),
        };

        const newStrips = new Map(state.strips);
        newStrips.set(stripId, {
          ...strip,
          annotations: [...strip.annotations, annotation],
          updatedAt: new Date(),
        });

        return { strips: newStrips };
      }),

      removeAnnotation: (stripId, annotationId) => set((state) => {
        const strip = state.strips.get(stripId);
        if (!strip) return state;

        const newStrips = new Map(state.strips);
        newStrips.set(stripId, {
          ...strip,
          annotations: strip.annotations.filter((a) => a.id !== annotationId),
          updatedAt: new Date(),
        });

        return { strips: newStrips };
      }),

      // Drag & Drop
      startDragging: (stripId) => set({ draggingStripId: stripId }),
      setDropTarget: (bayId) => set({ dropTargetBayId: bayId }),
      endDragging: () => set({ draggingStripId: null, dropTargetBayId: null }),

      // Filters
      setSearchQuery: (query) => set({ searchQuery: query }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setTypeFilter: (type) => set({ typeFilter: type }),
      clearFilters: () => set({
        searchQuery: '',
        statusFilter: null,
        typeFilter: null,
      }),

      // Scenario
      loadScenario: (scenarioId) => {
        console.log('Loading scenario:', scenarioId);
      },

      loadSampleData: () => {
        const { addStrip } = get();
        const now = new Date();

        // Sample departures
        const sampleDepartures: FlightStrip[] = [
          {
            id: generateId(),
            callsign: 'KAL001',
            aircraftType: 'B77W',
            wakeTurbulenceCategory: 'H',
            ssrCode: '1234',
            departure: 'RKSI',
            destination: 'KJFK',
            altitude: 35000,
            route: 'BOPTA Y711 NIRAT',
            sid: 'BOPTA1A',
            runway: '33L',
            gate: '101',
            status: 'FILED',
            bay: 'clearance',
            position: 0,
            flightRules: 'I',
            flightType: 'S',
            eobt: new Date(now.getTime() + 30 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'AAR201',
            aircraftType: 'A321',
            wakeTurbulenceCategory: 'M',
            ssrCode: '2345',
            departure: 'RKSI',
            destination: 'RJTT',
            altitude: 38000,
            route: 'KARBU Y52 KEOJE',
            sid: 'KARBU1A',
            runway: '33R',
            gate: '106',
            status: 'CLEARANCE_DELIVERED',
            bay: 'clearance',
            position: 1,
            flightRules: 'I',
            flightType: 'S',
            eobt: new Date(now.getTime() + 20 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'OZ101',
            aircraftType: 'A359',
            wakeTurbulenceCategory: 'H',
            ssrCode: '3456',
            departure: 'RKSI',
            destination: 'KLAX',
            altitude: 41000,
            route: 'BOPTA Y711 NIRAT R220',
            sid: 'BOPTA1A',
            runway: '33L',
            gate: '230',
            status: 'PUSH_APPROVED',
            bay: 'ground',
            position: 0,
            flightRules: 'I',
            flightType: 'S',
            eobt: new Date(now.getTime() + 15 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'JJA501',
            aircraftType: 'B738',
            wakeTurbulenceCategory: 'M',
            ssrCode: '4567',
            departure: 'RKSI',
            destination: 'RJGG',
            altitude: 37000,
            route: 'KARBU Y52',
            sid: 'KARBU1A',
            runway: '33R',
            gate: '107',
            status: 'TAXIING',
            bay: 'ground',
            position: 1,
            flightRules: 'I',
            flightType: 'S',
            eobt: new Date(now.getTime() + 10 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'KAL031',
            aircraftType: 'A388',
            wakeTurbulenceCategory: 'J',
            ssrCode: '5678',
            departure: 'RKSI',
            destination: 'EGLL',
            altitude: 39000,
            route: 'OLMEN B321 NODIS',
            sid: 'OLMEN1A',
            runway: '33L',
            gate: '231',
            status: 'HOLDING',
            bay: 'rwy-33l',
            position: 0,
            flightRules: 'I',
            flightType: 'S',
            eobt: new Date(now.getTime() + 5 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'TWB721',
            aircraftType: 'A320',
            wakeTurbulenceCategory: 'M',
            ssrCode: '6712',
            departure: 'RKSI',
            destination: 'RCTP',
            altitude: 36000,
            route: 'KARBU G597',
            sid: 'KARBU1A',
            runway: '33R',
            gate: '108',
            status: 'LINEUP',
            bay: 'rwy-33r',
            position: 0,
            flightRules: 'I',
            flightType: 'S',
            eobt: new Date(now.getTime() + 2 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
        ];

        // Sample arrivals
        const sampleArrivals: FlightStrip[] = [
          {
            id: generateId(),
            callsign: 'KAL002',
            aircraftType: 'B77W',
            wakeTurbulenceCategory: 'H',
            ssrCode: '7123',
            departure: 'KJFK',
            destination: 'RKSI',
            altitude: 3000,
            route: 'GUKDO1B',
            star: 'GUKDO1B',
            runway: '33L',
            gate: '101',
            status: 'INITIAL_APPROACH',
            bay: 'approach',
            position: 0,
            flightRules: 'I',
            flightType: 'S',
            eta: new Date(now.getTime() + 15 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'SIA621',
            aircraftType: 'A359',
            wakeTurbulenceCategory: 'H',
            ssrCode: '7234',
            departure: 'WSSS',
            destination: 'RKSI',
            altitude: 2500,
            route: 'GUKDO1B',
            star: 'GUKDO1B',
            runway: '33L',
            gate: '232',
            status: 'FINAL_APPROACH',
            bay: 'rwy-33l',
            position: 1,
            flightRules: 'I',
            flightType: 'S',
            eta: new Date(now.getTime() + 5 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'AAR202',
            aircraftType: 'A321',
            wakeTurbulenceCategory: 'M',
            ssrCode: '7345',
            departure: 'RJTT',
            destination: 'RKSI',
            altitude: 0,
            route: 'REBIT1B',
            star: 'REBIT1B',
            runway: '33R',
            gate: '106',
            status: 'LANDED',
            bay: 'arrival',
            position: 0,
            flightRules: 'I',
            flightType: 'S',
            eta: new Date(now.getTime() - 5 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
          {
            id: generateId(),
            callsign: 'UAE501',
            aircraftType: 'A388',
            wakeTurbulenceCategory: 'J',
            ssrCode: '7456',
            departure: 'OMDB',
            destination: 'RKSI',
            altitude: 0,
            route: 'GUKDO1B',
            star: 'GUKDO1B',
            runway: '33L',
            gate: '231',
            status: 'TAXI_IN',
            bay: 'arrival',
            position: 1,
            flightRules: 'I',
            flightType: 'S',
            eta: new Date(now.getTime() - 10 * 60000),
            createdAt: now,
            updatedAt: now,
            annotations: [],
            clearances: [],
          },
        ];

        // Add all sample strips
        [...sampleDepartures, ...sampleArrivals].forEach(addStrip);
      },

      clearAllStrips: () => set({
        strips: new Map(),
        stripsByBay: new Map(),
        selectedStripId: null,
        highlightedStripIds: new Set(),
      }),

      // Getters
      getStrip: (stripId) => get().strips.get(stripId),

      getStripsByBay: (bayId) => {
        const state = get();
        const stripIds = state.stripsByBay.get(bayId) || [];
        return stripIds
          .map((id) => state.strips.get(id))
          .filter((s): s is FlightStrip => s !== undefined);
      },

      getFilteredStrips: () => {
        const state = get();
        const { searchQuery, statusFilter, typeFilter } = state;

        let result = Array.from(state.strips.values());

        if (searchQuery) {
          const query = searchQuery.toUpperCase();
          result = result.filter(
            (s) =>
              s.callsign.includes(query) ||
              s.departure.includes(query) ||
              s.destination.includes(query) ||
              s.aircraftType.includes(query)
          );
        }

        if (statusFilter) {
          result = result.filter((s) => s.status === statusFilter);
        }

        if (typeFilter) {
          // Determine type based on status
          result = result.filter((s) => {
            const isDeparture = [
              'FILED', 'CLEARANCE_DELIVERED', 'PUSH_APPROVED',
              'TAXIING', 'HOLDING', 'LINEUP', 'TAKEOFF_CLEARED', 'DEPARTED'
            ].includes(s.status);
            return typeFilter === 'DEPARTURE' ? isDeparture : !isDeparture;
          });
        }

        return result;
      },

      getStripByCallsign: (callsign) => {
        const strips = get().strips;
        for (const strip of strips.values()) {
          if (strip.callsign === callsign) return strip;
        }
        return undefined;
      },
    })),
    { name: 'FlightStore' }
  )
);
