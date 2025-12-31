// ============================================================
// FDPS - 4D Trajectory Predictor
// Predicts aircraft position over time for AMAN/DMAN
// ============================================================

import type { Position, AircraftPerformance, FlightStrip } from '@types/index';
import { calculateDistance, calculateBearing, toRadians, toDegrees } from '@utils/helpers';
import { AircraftDatabase } from '@data/aircraft/AircraftDatabase';

export interface TrajectoryPoint {
  position: Position;
  altitude: number; // feet
  speed: number; // knots
  time: Date;
  phase: FlightPhase;
}

export type FlightPhase =
  | 'GROUND'
  | 'TAKEOFF'
  | 'INITIAL_CLIMB'
  | 'CLIMB'
  | 'CRUISE'
  | 'DESCENT'
  | 'APPROACH'
  | 'FINAL'
  | 'LANDING';

export interface TrajectoryPrediction {
  points: TrajectoryPoint[];
  estimatedDuration: number; // minutes
  totalDistance: number; // nautical miles
}

/**
 * 4D Trajectory Predictor
 * Uses aircraft performance data to predict flight path over time
 */
export class TrajectoryPredictor {
  private static readonly EARTH_RADIUS_NM = 3440.065;

  /**
   * Predict trajectory for a flight strip
   */
  static predict(
    strip: FlightStrip,
    departurePos: Position,
    arrivalPos: Position,
    waypoints: Position[] = []
  ): TrajectoryPrediction {
    const aircraft = AircraftDatabase.get(strip.aircraftType);
    const points: TrajectoryPoint[] = [];

    // Build full route with waypoints
    const routePoints = [departurePos, ...waypoints, arrivalPos];
    let totalDistance = 0;

    for (let i = 0; i < routePoints.length - 1; i++) {
      totalDistance += calculateDistance(
        routePoints[i].latitude,
        routePoints[i].longitude,
        routePoints[i + 1].latitude,
        routePoints[i + 1].longitude
      );
    }

    // Estimate times for each phase
    const cruiseAltitude = strip.altitude || 35000;
    const phases = this.calculatePhases(
      totalDistance,
      cruiseAltitude,
      aircraft
    );

    // Generate trajectory points
    let currentTime = strip.eobt ? new Date(strip.eobt) : new Date();
    let currentAltitude = 0;
    let currentDistanceFlown = 0;

    // Ground phase
    points.push({
      position: departurePos,
      altitude: 0,
      speed: 0,
      time: new Date(currentTime),
      phase: 'GROUND',
    });

    // Takeoff
    currentTime = new Date(currentTime.getTime() + 5 * 60000); // 5 min taxi
    points.push({
      position: departurePos,
      altitude: 0,
      speed: aircraft?.speeds?.v2 || 150,
      time: new Date(currentTime),
      phase: 'TAKEOFF',
    });

    // Initial climb to 1500ft
    currentTime = new Date(currentTime.getTime() + 2 * 60000);
    currentDistanceFlown += 3; // ~3nm in initial climb
    const pos1500 = this.interpolatePosition(
      routePoints,
      currentDistanceFlown,
      totalDistance
    );
    points.push({
      position: pos1500,
      altitude: 1500,
      speed: aircraft?.speeds?.vClimb || 250,
      time: new Date(currentTime),
      phase: 'INITIAL_CLIMB',
    });

    // Climb to cruise altitude
    const climbRate = aircraft?.climb?.rateInitial || 2000; // ft/min
    const climbTime = cruiseAltitude / climbRate; // minutes
    const climbDistance = (climbTime / 60) * (aircraft?.speeds?.vClimb || 280); // nm

    currentTime = new Date(currentTime.getTime() + climbTime * 60000);
    currentDistanceFlown += climbDistance;
    const posTopOfClimb = this.interpolatePosition(
      routePoints,
      currentDistanceFlown,
      totalDistance
    );
    points.push({
      position: posTopOfClimb,
      altitude: cruiseAltitude,
      speed: aircraft?.speeds?.vCruise || 450,
      time: new Date(currentTime),
      phase: 'CLIMB',
    });

    // Cruise
    const cruiseDistance = totalDistance - climbDistance - phases.descentDistance;
    const cruiseTime = (cruiseDistance / (aircraft?.speeds?.vCruise || 450)) * 60; // minutes

    if (cruiseDistance > 0) {
      currentTime = new Date(currentTime.getTime() + cruiseTime * 60000);
      currentDistanceFlown += cruiseDistance;
      const posTopOfDescent = this.interpolatePosition(
        routePoints,
        currentDistanceFlown,
        totalDistance
      );
      points.push({
        position: posTopOfDescent,
        altitude: cruiseAltitude,
        speed: aircraft?.speeds?.vCruise || 450,
        time: new Date(currentTime),
        phase: 'CRUISE',
      });
    }

    // Descent
    const descentRate = aircraft?.descent?.rate || 2000; // ft/min
    const descentTime = cruiseAltitude / descentRate; // minutes

    currentTime = new Date(currentTime.getTime() + descentTime * 60000);
    currentDistanceFlown += phases.descentDistance;
    const posBottomOfDescent = this.interpolatePosition(
      routePoints,
      currentDistanceFlown,
      totalDistance
    );
    points.push({
      position: posBottomOfDescent,
      altitude: 3000,
      speed: aircraft?.speeds?.vApproach || 180,
      time: new Date(currentTime),
      phase: 'DESCENT',
    });

    // Approach
    currentTime = new Date(currentTime.getTime() + 5 * 60000);
    const posFinal = this.interpolatePosition(routePoints, totalDistance - 5, totalDistance);
    points.push({
      position: posFinal,
      altitude: 1500,
      speed: aircraft?.speeds?.vApproach || 140,
      time: new Date(currentTime),
      phase: 'APPROACH',
    });

    // Final
    currentTime = new Date(currentTime.getTime() + 3 * 60000);
    points.push({
      position: arrivalPos,
      altitude: 0,
      speed: aircraft?.speeds?.vLanding || 130,
      time: new Date(currentTime),
      phase: 'LANDING',
    });

    const firstTime = points[0].time.getTime();
    const lastTime = points[points.length - 1].time.getTime();
    const estimatedDuration = (lastTime - firstTime) / 60000;

    return {
      points,
      estimatedDuration,
      totalDistance,
    };
  }

  /**
   * Predict arrival time at a fix
   */
  static predictTimeAtFix(
    strip: FlightStrip,
    currentPos: Position,
    fixPos: Position,
    currentAltitude: number,
    targetAltitude: number
  ): Date {
    const aircraft = AircraftDatabase.get(strip.aircraftType);
    const distance = calculateDistance(
      currentPos.latitude,
      currentPos.longitude,
      fixPos.latitude,
      fixPos.longitude
    );

    // Determine phase and speed
    let speed: number;
    let verticalTime = 0;

    if (targetAltitude > currentAltitude) {
      // Climbing
      speed = aircraft?.speeds?.vClimb || 280;
      const climbRate = aircraft?.climb?.rateInitial || 2000;
      verticalTime = (targetAltitude - currentAltitude) / climbRate;
    } else if (targetAltitude < currentAltitude) {
      // Descending
      speed = aircraft?.speeds?.vDescent || 300;
      const descentRate = aircraft?.descent?.rate || 2000;
      verticalTime = (currentAltitude - targetAltitude) / descentRate;
    } else {
      // Level
      speed = currentAltitude > 10000
        ? aircraft?.speeds?.vCruise || 450
        : aircraft?.speeds?.vApproach || 180;
    }

    const flightTime = (distance / speed) * 60; // minutes
    const totalTime = Math.max(flightTime, verticalTime);

    return new Date(Date.now() + totalTime * 60000);
  }

  /**
   * Calculate descent profile (top of descent, descent rate)
   */
  static calculateDescentProfile(
    strip: FlightStrip,
    currentAltitude: number,
    targetAltitude: number,
    distanceToRunway: number
  ): {
    topOfDescent: number; // nm from runway
    descentRate: number; // ft/min
    descentAngle: number; // degrees
  } {
    const aircraft = AircraftDatabase.get(strip.aircraftType);
    const standardAngle = aircraft?.descent?.angle || 3;

    // Standard 3 degree descent: ~300ft per nm
    const altitudeToLose = currentAltitude - targetAltitude;
    const idealTopOfDescent = altitudeToLose / 300; // nm

    // Calculate required descent rate
    const descentSpeed = aircraft?.speeds?.vDescent || 280;
    const timeToDescend = (idealTopOfDescent / descentSpeed) * 60; // minutes
    const descentRate = altitudeToLose / timeToDescend;

    return {
      topOfDescent: idealTopOfDescent,
      descentRate: Math.round(descentRate),
      descentAngle: standardAngle,
    };
  }

  /**
   * Calculate expected taxi time
   */
  static calculateTaxiTime(
    gatePosition: Position,
    runwayThreshold: Position,
    taxiSpeed: number = 15 // knots
  ): number {
    const distance = calculateDistance(
      gatePosition.latitude,
      gatePosition.longitude,
      runwayThreshold.latitude,
      runwayThreshold.longitude
    );

    // Add 20% for non-direct taxi routes
    const actualDistance = distance * 1.2;

    // Convert to minutes
    return (actualDistance / taxiSpeed) * 60;
  }

  /**
   * Calculate phase distances for trajectory
   */
  private static calculatePhases(
    totalDistance: number,
    cruiseAltitude: number,
    aircraft: AircraftPerformance | undefined
  ): {
    climbDistance: number;
    cruiseDistance: number;
    descentDistance: number;
  } {
    const climbRate = aircraft?.climb?.rateInitial || 2000;
    const climbSpeed = aircraft?.speeds?.vClimb || 280;
    const climbTime = cruiseAltitude / climbRate; // minutes
    const climbDistance = (climbTime / 60) * climbSpeed;

    const descentRate = aircraft?.descent?.rate || 2000;
    const descentSpeed = aircraft?.speeds?.vDescent || 300;
    const descentTime = cruiseAltitude / descentRate; // minutes
    const descentDistance = (descentTime / 60) * descentSpeed;

    const cruiseDistance = Math.max(0, totalDistance - climbDistance - descentDistance);

    return {
      climbDistance,
      cruiseDistance,
      descentDistance,
    };
  }

  /**
   * Interpolate position along route based on distance flown
   */
  private static interpolatePosition(
    routePoints: Position[],
    distanceFlown: number,
    totalDistance: number
  ): Position {
    if (distanceFlown <= 0) return routePoints[0];
    if (distanceFlown >= totalDistance) return routePoints[routePoints.length - 1];

    let accumulated = 0;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const segmentDist = calculateDistance(
        routePoints[i].latitude,
        routePoints[i].longitude,
        routePoints[i + 1].latitude,
        routePoints[i + 1].longitude
      );

      if (accumulated + segmentDist >= distanceFlown) {
        // Interpolate within this segment
        const segmentFraction = (distanceFlown - accumulated) / segmentDist;
        return {
          latitude:
            routePoints[i].latitude +
            (routePoints[i + 1].latitude - routePoints[i].latitude) * segmentFraction,
          longitude:
            routePoints[i].longitude +
            (routePoints[i + 1].longitude - routePoints[i].longitude) * segmentFraction,
        };
      }

      accumulated += segmentDist;
    }

    return routePoints[routePoints.length - 1];
  }
}

export default TrajectoryPredictor;
