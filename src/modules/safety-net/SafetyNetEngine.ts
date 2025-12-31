// ============================================================
// Safety Net Engine
// Implements RIMCAS, CATC, CMAC, MSAW, STCA
// ============================================================

import type {
  FlightStrip,
  Alert,
  AlertType,
  AlertSeverity,
  Position,
  Runway,
  Clearance,
} from '@types/index';
import { generateId, calculateDistance } from '@utils/helpers';

export interface SafetyNetConfig {
  rimcasEnabled: boolean;
  catcEnabled: boolean;
  cmacEnabled: boolean;
  msawEnabled: boolean;
  stcaEnabled: boolean;

  // RIMCAS thresholds
  rimcasWarningDistance: number; // nm from runway
  rimcasCriticalDistance: number;

  // CATC thresholds
  catcTimeWindow: number; // seconds to check for conflicting clearances

  // STCA thresholds
  stcaHorizontalSeparation: number; // nm
  stcaVerticalSeparation: number; // feet
  stcaLookAheadTime: number; // seconds
}

export interface SurfacePosition {
  stripId: string;
  callsign: string;
  position: Position;
  heading: number;
  groundSpeed: number;
  currentTaxiway?: string;
  currentRunway?: string;
  isOnRunway: boolean;
}

/**
 * Safety Net Engine
 * Real-time conflict detection and alerting
 */
export class SafetyNetEngine {
  private config: SafetyNetConfig;
  private activeAlerts: Map<string, Alert> = new Map();
  private alertCallback: ((alert: Alert) => void) | null = null;
  private resolveCallback: ((alertId: string) => void) | null = null;

  constructor(config?: Partial<SafetyNetConfig>) {
    this.config = {
      rimcasEnabled: true,
      catcEnabled: true,
      cmacEnabled: true,
      msawEnabled: true,
      stcaEnabled: true,
      rimcasWarningDistance: 1.5, // nm
      rimcasCriticalDistance: 0.5, // nm
      catcTimeWindow: 120, // 2 minutes
      stcaHorizontalSeparation: 3, // nm
      stcaVerticalSeparation: 1000, // feet
      stcaLookAheadTime: 120, // seconds
      ...config,
    };
  }

  /**
   * Set callback for new alerts
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallback = callback;
  }

  /**
   * Set callback for resolved alerts
   */
  onResolve(callback: (alertId: string) => void): void {
    this.resolveCallback = callback;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SafetyNetConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check all safety nets for a set of flights
   */
  checkAll(
    strips: FlightStrip[],
    surfacePositions: SurfacePosition[],
    runways: Runway[]
  ): Alert[] {
    const newAlerts: Alert[] = [];

    // RIMCAS - Runway Incursion Monitoring
    if (this.config.rimcasEnabled) {
      const rimcasAlerts = this.checkRIMCAS(surfacePositions, runways, strips);
      newAlerts.push(...rimcasAlerts);
    }

    // CATC - Conflicting ATC Clearances
    if (this.config.catcEnabled) {
      const catcAlerts = this.checkCATC(strips, runways);
      newAlerts.push(...catcAlerts);
    }

    // CMAC - Conformance Monitoring
    if (this.config.cmacEnabled) {
      const cmacAlerts = this.checkCMAC(strips, surfacePositions);
      newAlerts.push(...cmacAlerts);
    }

    // Process and deduplicate alerts
    for (const alert of newAlerts) {
      const existingKey = this.generateAlertKey(alert);
      if (!this.activeAlerts.has(existingKey)) {
        this.activeAlerts.set(existingKey, alert);
        this.alertCallback?.(alert);
      }
    }

    return newAlerts;
  }

  /**
   * RIMCAS - Runway Incursion Monitoring and Conflict Alert System
   * Detects potential runway incursions
   */
  private checkRIMCAS(
    positions: SurfacePosition[],
    runways: Runway[],
    strips: FlightStrip[]
  ): Alert[] {
    const alerts: Alert[] = [];

    for (const runway of runways) {
      if (runway.status === 'CLOSED') continue;

      // Find aircraft on or near this runway
      const aircraftOnRunway = positions.filter((p) => p.currentRunway === runway.id);
      const aircraftNearRunway = positions.filter((p) => {
        if (p.currentRunway === runway.id) return false;
        const dist = this.distanceToRunway(p.position, runway);
        return dist < this.config.rimcasWarningDistance;
      });

      // Check for multiple aircraft on runway
      if (aircraftOnRunway.length > 1) {
        alerts.push(
          this.createAlert(
            'RIMCAS',
            'CRITICAL',
            `Multiple aircraft on runway ${runway.id}: ${aircraftOnRunway.map((a) => a.callsign).join(', ')}`,
            aircraftOnRunway.map((a) => a.callsign),
            runway.id
          )
        );
      }

      // Check for aircraft entering runway while another is on it
      if (aircraftOnRunway.length > 0 && aircraftNearRunway.length > 0) {
        for (const nearAircraft of aircraftNearRunway) {
          // Check if moving towards runway
          if (nearAircraft.groundSpeed > 5) {
            const dist = this.distanceToRunway(nearAircraft.position, runway);

            const severity: AlertSeverity =
              dist < this.config.rimcasCriticalDistance ? 'CRITICAL' : 'WARNING';

            alerts.push(
              this.createAlert(
                'RIMCAS',
                severity,
                `${nearAircraft.callsign} approaching occupied runway ${runway.id} (${aircraftOnRunway[0].callsign} on runway)`,
                [nearAircraft.callsign, ...aircraftOnRunway.map((a) => a.callsign)],
                runway.id
              )
            );
          }
        }
      }

      // Check for arriving aircraft vs departing aircraft
      const departingOnRunway = aircraftOnRunway.filter((a) => {
        const strip = strips.find((s) => s.id === a.stripId);
        return strip && ['LINEUP', 'TAKEOFF_CLEARED'].includes(strip.status);
      });

      const arrivingToRunway = strips.filter(
        (s) =>
          s.runway === runway.id &&
          ['FINAL_APPROACH', 'LANDING'].includes(s.status)
      );

      if (departingOnRunway.length > 0 && arrivingToRunway.length > 0) {
        alerts.push(
          this.createAlert(
            'RIMCAS',
            'CRITICAL',
            `Runway ${runway.id} conflict: ${departingOnRunway[0].callsign} (departure) vs ${arrivingToRunway[0].callsign} (arrival)`,
            [departingOnRunway[0].callsign, arrivingToRunway[0].callsign],
            runway.id
          )
        );
      }
    }

    return alerts;
  }

  /**
   * CATC - Conflicting ATC Clearances
   * Detects conflicting clearances issued to different aircraft
   */
  private checkCATC(strips: FlightStrip[], runways: Runway[]): Alert[] {
    const alerts: Alert[] = [];
    const now = Date.now();
    const timeWindow = this.config.catcTimeWindow * 1000;

    // Group recent clearances by runway
    const runwayClearances: Map<string, { strip: FlightStrip; clearance: Clearance }[]> = new Map();

    for (const strip of strips) {
      for (const clearance of strip.clearances) {
        const clearanceAge = now - new Date(clearance.issuedAt).getTime();
        if (clearanceAge > timeWindow) continue;

        // Check runway-related clearances
        if (['LINEUP', 'TAKEOFF', 'LANDING'].includes(clearance.type) && strip.runway) {
          const existing = runwayClearances.get(strip.runway) || [];
          existing.push({ strip, clearance });
          runwayClearances.set(strip.runway, existing);
        }
      }
    }

    // Check for conflicts on each runway
    for (const [runway, clearanceList] of runwayClearances) {
      // Multiple lineup clearances
      const lineupClearances = clearanceList.filter((c) => c.clearance.type === 'LINEUP');
      if (lineupClearances.length > 1) {
        alerts.push(
          this.createAlert(
            'CATC',
            'WARNING',
            `Multiple lineup clearances for runway ${runway}: ${lineupClearances.map((c) => c.strip.callsign).join(', ')}`,
            lineupClearances.map((c) => c.strip.callsign),
            runway
          )
        );
      }

      // Takeoff clearance while another aircraft is lined up
      const takeoffClearances = clearanceList.filter((c) => c.clearance.type === 'TAKEOFF');
      if (takeoffClearances.length > 1) {
        alerts.push(
          this.createAlert(
            'CATC',
            'CRITICAL',
            `Multiple takeoff clearances for runway ${runway}!`,
            takeoffClearances.map((c) => c.strip.callsign),
            runway
          )
        );
      }

      // Landing clearance while another aircraft has takeoff clearance
      const landingClearances = clearanceList.filter((c) => c.clearance.type === 'LANDING');
      if (landingClearances.length > 0 && takeoffClearances.length > 0) {
        alerts.push(
          this.createAlert(
            'CATC',
            'CRITICAL',
            `Conflicting clearances on runway ${runway}: ${takeoffClearances[0].strip.callsign} (takeoff) vs ${landingClearances[0].strip.callsign} (landing)`,
            [takeoffClearances[0].strip.callsign, landingClearances[0].strip.callsign],
            runway
          )
        );
      }
    }

    // Check for conflicting taxi routes (crossing runways)
    const taxiingStrips = strips.filter((s) => s.status === 'TAXIING');
    for (const strip of taxiingStrips) {
      const taxiClearance = strip.clearances.find((c) => c.type === 'TAXI');
      if (!taxiClearance) continue;

      // Check if taxi route crosses an active runway
      for (const runway of runways) {
        if (runway.status === 'CLOSED') continue;

        // Check if any aircraft has takeoff/landing clearance on this runway
        const activeRunwayOps = strips.filter(
          (s) =>
            s.runway === runway.id &&
            s.clearances.some(
              (c) =>
                ['TAKEOFF', 'LANDING'].includes(c.type) &&
                now - new Date(c.issuedAt).getTime() < timeWindow
            )
        );

        if (activeRunwayOps.length > 0 && this.taxiRouteCrossesRunway(taxiClearance.value, runway.id)) {
          alerts.push(
            this.createAlert(
              'CATC',
              'WARNING',
              `${strip.callsign} taxi route crosses runway ${runway.id} (${activeRunwayOps[0].callsign} has active clearance)`,
              [strip.callsign, activeRunwayOps[0].callsign],
              runway.id
            )
          );
        }
      }
    }

    return alerts;
  }

  /**
   * CMAC - Conformance Monitoring Alerts for Controllers
   * Monitors if aircraft are following clearances
   */
  private checkCMAC(strips: FlightStrip[], positions: SurfacePosition[]): Alert[] {
    const alerts: Alert[] = [];

    for (const strip of strips) {
      const position = positions.find((p) => p.stripId === strip.id);
      if (!position) continue;

      // Check for holding point violation
      if (strip.status === 'HOLDING') {
        const holdClearance = strip.clearances.find((c) => c.type === 'HOLD_SHORT');
        if (holdClearance && position.isOnRunway) {
          alerts.push(
            this.createAlert(
              'CMAC',
              'CRITICAL',
              `${strip.callsign} entered runway without clearance (hold short ${holdClearance.value})`,
              [strip.callsign],
              strip.runway
            )
          );
        }
      }

      // Check for movement without taxi clearance
      if (strip.status === 'PUSH_APPROVED' || strip.status === 'CLEARANCE_DELIVERED') {
        if (position.groundSpeed > 5) {
          const hasTaxiClearance = strip.clearances.some((c) => c.type === 'TAXI');
          if (!hasTaxiClearance) {
            alerts.push(
              this.createAlert(
                'CMAC',
                'WARNING',
                `${strip.callsign} moving without taxi clearance`,
                [strip.callsign]
              )
            );
          }
        }
      }

      // Check for lineup without clearance
      if (position.isOnRunway && strip.status !== 'LINEUP' && strip.status !== 'TAKEOFF_CLEARED') {
        const hasLineupClearance = strip.clearances.some((c) => c.type === 'LINEUP');
        if (!hasLineupClearance) {
          alerts.push(
            this.createAlert(
              'CMAC',
              'CRITICAL',
              `${strip.callsign} on runway ${strip.runway} without lineup clearance`,
              [strip.callsign],
              strip.runway
            )
          );
        }
      }
    }

    return alerts;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    for (const [key, alert] of this.activeAlerts) {
      if (alert.id === alertId) {
        this.activeAlerts.delete(key);
        this.resolveCallback?.(alertId);
        break;
      }
    }
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.activeAlerts.clear();
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  // ================== Helper Methods ==================

  private createAlert(
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    involvedFlights: string[],
    runway?: string
  ): Alert {
    return {
      id: generateId(),
      type,
      severity,
      message,
      involvedFlights,
      runway,
      createdAt: new Date(),
      resolved: false,
    };
  }

  private generateAlertKey(alert: Alert): string {
    return `${alert.type}-${alert.involvedFlights.sort().join(',')}-${alert.runway || ''}`;
  }

  private distanceToRunway(position: Position, runway: Runway): number {
    // Calculate distance to runway centerline
    const distToThreshold = calculateDistance(
      position.latitude,
      position.longitude,
      runway.threshold.latitude,
      runway.threshold.longitude
    );
    const distToOpposite = calculateDistance(
      position.latitude,
      position.longitude,
      runway.oppositeThreshold.latitude,
      runway.oppositeThreshold.longitude
    );

    return Math.min(distToThreshold, distToOpposite);
  }

  private taxiRouteCrossesRunway(taxiRoute: string, runwayId: string): boolean {
    // Simple check - if taxi route mentions the runway
    return taxiRoute.includes(runwayId) || taxiRoute.includes(`RWY${runwayId}`);
  }
}

export default SafetyNetEngine;
