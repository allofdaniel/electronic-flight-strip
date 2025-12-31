import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '../../core/store/systemStore';
import type { Alert } from '../../types/index';

export default function AlertPanel() {
  const { alerts, acknowledgeAlert, resolveAlert, clearResolvedAlerts } = useSystemStore();

  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => !a.resolved);
  }, [alerts]);

  const resolvedAlerts = useMemo(() => {
    return alerts.filter((a) => a.resolved).slice(0, 10);
  }, [alerts]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-10 bg-atc-surface border-b border-atc-bg flex items-center justify-between px-3">
        <span className="font-bold text-sm">Alerts</span>
        <span className="text-xs text-gray-400">
          {activeAlerts.length} active
        </span>
      </div>

      {/* Active Alerts */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <AnimatePresence>
          {activeAlerts.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No active alerts
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AlertCard
                  alert={alert}
                  onAcknowledge={() => acknowledgeAlert(alert.id)}
                  onResolve={() => resolveAlert(alert.id)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Resolved Alerts Section */}
      {resolvedAlerts.length > 0 && (
        <div className="border-t border-atc-surface">
          <div className="flex items-center justify-between px-3 py-2 bg-atc-surface">
            <span className="text-xs text-gray-400">Recent Resolved</span>
            <button
              className="text-xs text-gray-500 hover:text-white"
              onClick={clearResolvedAlerts}
            >
              Clear
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto p-2 space-y-1">
            {resolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="text-xs text-gray-500 px-2 py-1 bg-atc-bg rounded"
              >
                <span className="text-gray-400">[{alert.type}]</span> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: () => void;
}

function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const severityClass = useMemo(() => {
    switch (alert.severity) {
      case 'INFO':
        return 'alert-info';
      case 'CAUTION':
        return 'alert-caution';
      case 'WARNING':
        return 'alert-warning';
      case 'CRITICAL':
        return 'alert-critical';
      default:
        return 'alert-info';
    }
  }, [alert.severity]);

  const typeLabels: Record<string, string> = {
    RIMCAS: 'Runway Incursion',
    CATC: 'Conflicting Clearance',
    CMAC: 'Conformance Alert',
    MSAW: 'Min Safe Altitude',
    STCA: 'Conflict Alert',
  };

  const isAcknowledged = !!alert.acknowledgedAt;

  return (
    <div className={`alert ${severityClass} ${isAcknowledged ? '!animate-none opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm">
          [{alert.type}] {typeLabels[alert.type] || alert.type}
        </span>
        <span className="text-xs opacity-75">
          {new Date(alert.createdAt).toISOString().slice(11, 19)}Z
        </span>
      </div>

      {/* Message */}
      <p className="text-sm mb-2">{alert.message}</p>

      {/* Involved Flights */}
      {alert.involvedFlights.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs opacity-75">Flights:</span>
          {alert.involvedFlights.map((callsign) => (
            <span
              key={callsign}
              className="text-xs bg-black/30 px-1.5 py-0.5 rounded font-mono"
            >
              {callsign}
            </span>
          ))}
        </div>
      )}

      {/* Runway */}
      {alert.runway && (
        <div className="text-xs opacity-75 mb-2">Runway: {alert.runway}</div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isAcknowledged && (
          <button
            className="btn btn-secondary text-xs py-1"
            onClick={onAcknowledge}
          >
            Acknowledge
          </button>
        )}
        <button
          className="btn btn-ghost text-xs py-1"
          onClick={onResolve}
        >
          Resolve
        </button>
      </div>

      {/* Acknowledged Info */}
      {isAcknowledged && (
        <div className="text-xs opacity-50 mt-2">
          Acknowledged by {alert.acknowledgedBy} at{' '}
          {new Date(alert.acknowledgedAt!).toISOString().slice(11, 19)}Z
        </div>
      )}
    </div>
  );
}
