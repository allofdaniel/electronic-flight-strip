// ============================================================
// Electronic Flight Strip - Core Type Definitions
// ============================================================

// ===================== Enums =====================

export enum StripStatus {
  FILED = 'FILED',
  ACTIVE = 'ACTIVE',
  CLEARANCE_DELIVERED = 'CLEARANCE_DELIVERED',
  PUSH_APPROVED = 'PUSH_APPROVED',
  TAXIING = 'TAXIING',
  HOLDING = 'HOLDING',
  LINEUP = 'LINEUP',
  TAKEOFF_CLEARED = 'TAKEOFF_CLEARED',
  DEPARTED = 'DEPARTED',
  INITIAL_APPROACH = 'INITIAL_APPROACH',
  FINAL_APPROACH = 'FINAL_APPROACH',
  LANDED = 'LANDED',
  TAXI_IN = 'TAXI_IN',
  AT_GATE = 'AT_GATE',
  COMPLETED = 'COMPLETED',
}

export enum WakeTurbulenceCategory {
  SUPER = 'J',
  HEAVY = 'H',
  MEDIUM = 'M',
  LIGHT = 'L',
}

export enum FlightRules {
  IFR = 'I',
  VFR = 'V',
  IFR_THEN_VFR = 'Y',
  VFR_THEN_IFR = 'Z',
}

export enum FlightType {
  SCHEDULED = 'S',
  NON_SCHEDULED = 'N',
  GENERAL_AVIATION = 'G',
  MILITARY = 'M',
  OTHER = 'X',
}

export enum ClearanceType {
  STARTUP = 'STARTUP',
  PUSHBACK = 'PUSHBACK',
  TAXI = 'TAXI',
  HOLD_SHORT = 'HOLD_SHORT',
  LINEUP = 'LINEUP',
  TAKEOFF = 'TAKEOFF',
  LANDING = 'LANDING',
  GO_AROUND = 'GO_AROUND',
  ALTITUDE = 'ALTITUDE',
  HEADING = 'HEADING',
  SPEED = 'SPEED',
  DIRECT = 'DIRECT',
  HOLD = 'HOLD',
}

export enum BayType {
  DEPARTURE = 'DEPARTURE',
  ARRIVAL = 'ARRIVAL',
  RUNWAY = 'RUNWAY',
  GROUND = 'GROUND',
  APPROACH = 'APPROACH',
}

export enum AlertSeverity {
  INFO = 'INFO',
  CAUTION = 'CAUTION',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum AlertType {
  RIMCAS = 'RIMCAS',           // Runway Incursion
  CATC = 'CATC',               // Conflicting ATC Clearances
  CMAC = 'CMAC',               // Conformance Monitoring
  MSAW = 'MSAW',               // Minimum Safe Altitude Warning
  STCA = 'STCA',               // Short Term Conflict Alert
}

// ===================== Core Interfaces =====================

export interface Position {
  latitude: number;
  longitude: number;
}

export interface FlightStrip {
  id: string;
  callsign: string;
  aircraftType: string;
  wakeTurbulenceCategory: WakeTurbulenceCategory;
  ssrCode: string;
  departure: string;
  destination: string;
  altitude: number;
  route: string;
  sid?: string;
  star?: string;
  runway?: string;
  gate?: string;
  status: StripStatus;
  bay: string;
  position: number;
  flightRules: FlightRules;
  flightType: FlightType;
  eobt?: Date;              // Estimated Off-Block Time
  eta?: Date;               // Estimated Time of Arrival
  tobt?: Date;              // Target Off-Block Time
  tsat?: Date;              // Target Start-up Approval Time
  ttot?: Date;              // Target Take-Off Time
  ctot?: Date;              // Calculated Take-Off Time (ATFM slot)
  createdAt: Date;
  updatedAt: Date;
  annotations: Annotation[];
  clearances: Clearance[];
  isGhost?: boolean;
  ghostSourceBay?: string;
}

export interface Annotation {
  id: string;
  stripId: string;
  content: string;
  symbol?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Clearance {
  id: string;
  stripId: string;
  type: ClearanceType;
  value: string;
  issuedBy: string;
  issuedAt: Date;
  readbackReceived: boolean;
  expiresAt?: Date;
}

export interface Bay {
  id: string;
  name: string;
  type: BayType;
  position: number;
  controllerRole: string;
  strips: FlightStrip[];
  maxStrips?: number;
  runway?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  involvedFlights: string[];
  runway?: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

// ===================== Airport Data =====================

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  location: Position;
  elevation: number;
  timezone: string;
  runways: Runway[];
  taxiways: Taxiway[];
  gates: Gate[];
  sids: Procedure[];
  stars: Procedure[];
  holdingPatterns: HoldingPattern[];
}

export interface Runway {
  id: string;
  heading: number;
  length: number;
  width: number;
  threshold: Position;
  oppositeThreshold: Position;
  ils?: ILSData;
  status: 'OPEN' | 'CLOSED' | 'LIMITED';
}

export interface ILSData {
  frequency: number;
  course: number;
  glideslope: number;
  category: 'CAT_I' | 'CAT_II' | 'CAT_IIIA' | 'CAT_IIIB' | 'CAT_IIIC';
}

export interface Taxiway {
  id: string;
  name: string;
  path: Position[];
  width: number;
  holdingPoints: HoldingPoint[];
}

export interface HoldingPoint {
  id: string;
  name: string;
  position: Position;
  runway: string;
  catIII: boolean;
}

export interface Gate {
  id: string;
  terminal: string;
  position: Position;
  heading: number;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'HEAVY';
}

export interface Procedure {
  id: string;
  name: string;
  type: 'SID' | 'STAR';
  runway: string;
  waypoints: ProcedureWaypoint[];
  transitions?: ProcedureTransition[];
}

export interface ProcedureWaypoint {
  name: string;
  position: Position;
  altitude?: AltitudeConstraint;
  speed?: SpeedConstraint;
  flyover: boolean;
}

export interface AltitudeConstraint {
  type: 'AT' | 'ABOVE' | 'BELOW' | 'BETWEEN';
  value: number;
  upperValue?: number;
}

export interface SpeedConstraint {
  type: 'AT' | 'MAX' | 'MIN';
  value: number;
}

export interface ProcedureTransition {
  name: string;
  waypoints: ProcedureWaypoint[];
}

export interface HoldingPattern {
  fix: string;
  position: Position;
  altitude: number;
  direction: 'LEFT' | 'RIGHT';
  legTime: number;
  inboundCourse: number;
}

// ===================== Aircraft Data =====================

export interface AircraftPerformance {
  icaoType: string;
  manufacturer: string;
  model: string;
  wakeTurbulence: WakeTurbulenceCategory;
  mass: {
    min: number;
    max: number;
    reference: number;
  };
  speeds: {
    v2: number;
    vClimb: number;
    vCruise: number;
    vDescent: number;
    vApproach: number;
    vLanding: number;
    mmo: number;
  };
  altitudes: {
    maxOperational: number;
    optimalCruise: number;
  };
  climb: {
    rateInitial: number;
    rateCruise: number;
  };
  descent: {
    rate: number;
    angle: number;
  };
}

// ===================== Surface Movement =====================

export interface SurfaceTarget {
  id: string;
  type: 'AIRCRAFT' | 'VEHICLE' | 'UNKNOWN';
  callsign?: string;
  icaoAddress?: string;
  position: Position;
  groundSpeed: number;
  heading: number;
  state: SurfaceState;
  currentLocation: {
    type: 'GATE' | 'TAXIWAY' | 'RUNWAY' | 'APRON' | 'HOLDING_POINT';
    id: string;
  };
  route?: TaxiRoute;
  lastUpdate: Date;
}

export type SurfaceState =
  | 'PARKED'
  | 'PUSHBACK'
  | 'TAXI'
  | 'HOLDING'
  | 'LINEUP'
  | 'TAKEOFF_ROLL'
  | 'LANDING_ROLL'
  | 'STOPPED';

export interface TaxiRoute {
  waypoints: TaxiWaypoint[];
  currentIndex: number;
  estimatedTime: number;
}

export interface TaxiWaypoint {
  type: 'GATE' | 'TAXIWAY' | 'INTERSECTION' | 'HOLDING_POINT' | 'RUNWAY';
  id: string;
  position: Position;
  expectedSpeed: number;
}

// ===================== AMAN/DMAN =====================

export interface ArrivalSequence {
  flights: SequencedArrival[];
  runway: string;
  calculatedAt: Date;
}

export interface SequencedArrival {
  callsign: string;
  stripId: string;
  originalETA: Date;
  scheduledTime: Date;
  delay: number;
  sequencePosition: number;
  meterFix: string;
  advisedSpeed?: number;
  advisedDelay?: number;
}

export interface DepartureSequence {
  flights: SequencedDeparture[];
  runway: string;
  calculatedAt: Date;
}

export interface SequencedDeparture {
  callsign: string;
  stripId: string;
  tobt: Date;
  tsat: Date;
  ttot: Date;
  ctot?: Date;
  taxiTime: number;
  sequencePosition: number;
  gate: string;
  runway: string;
}

// ===================== Flight Plan =====================

export interface ParsedFlightPlan {
  messageType: 'FPL' | 'CHG' | 'CNL' | 'DEP' | 'ARR';
  callsign: string;
  flightRules: FlightRules;
  flightType: FlightType;
  aircraftCount: number;
  aircraftType: string;
  wakeTurbulence: WakeTurbulenceCategory;
  equipment: string;
  surveillance: string;
  departureAirport: string;
  eobt: string;
  cruiseSpeed: string;
  cruiseLevel: string;
  route: string;
  destinationAirport: string;
  eet: string;
  alternateAirports: string[];
  otherInfo: Record<string, string>;
}

// ===================== Scenario =====================

export interface TrafficScenario {
  id: string;
  name: string;
  description?: string;
  airport: string;
  duration: number;
  flights: ScenarioFlight[];
  startTime?: Date;
}

export interface ScenarioFlight {
  callsign: string;
  type: 'DEPARTURE' | 'ARRIVAL';
  aircraftType: string;
  scheduledTime: string;
  origin?: string;
  destination?: string;
  runway: string;
  gate: string;
  route?: string;
  remarks?: string;
}

// ===================== User/Role =====================

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: ControllerRole;
  position?: string;
  activeAt?: Date;
}

export type ControllerRole =
  | 'SUPERVISOR'
  | 'GROUND'
  | 'TOWER'
  | 'APPROACH'
  | 'DEPARTURE'
  | 'CLEARANCE'
  | 'OBSERVER';

// ===================== System Config =====================

export interface SystemConfig {
  airport: string;
  operationalMode: 'LIVE' | 'SIMULATION' | 'TRAINING';
  runwayConfiguration: RunwayConfiguration[];
  bays: Bay[];
  simulationSpeed: number;
  safetyNetsEnabled: boolean;
}

export interface RunwayConfiguration {
  runway: string;
  mode: 'DEPARTURE' | 'ARRIVAL' | 'MIXED';
  arrivalRate: number;
  departureRate: number;
  active: boolean;
}
