import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlightStore } from '../../core/store/flightStore';
import type { FlightStrip, ClearanceType } from '../../types/index';

interface ClearanceModalProps {
  strip: FlightStrip;
  onClose: () => void;
}

const CLEARANCE_OPTIONS: { type: ClearanceType; label: string; color: string }[] = [
  { type: 'STARTUP', label: 'Startup Approved', color: 'bg-blue-600' },
  { type: 'PUSHBACK', label: 'Pushback Approved', color: 'bg-blue-600' },
  { type: 'TAXI', label: 'Taxi Clearance', color: 'bg-green-600' },
  { type: 'HOLD_SHORT', label: 'Hold Short', color: 'bg-yellow-600' },
  { type: 'LINEUP', label: 'Line Up & Wait', color: 'bg-orange-600' },
  { type: 'TAKEOFF', label: 'Cleared for Takeoff', color: 'bg-green-600' },
  { type: 'LANDING', label: 'Cleared to Land', color: 'bg-green-600' },
  { type: 'GO_AROUND', label: 'Go Around', color: 'bg-red-600' },
  { type: 'ALTITUDE', label: 'Altitude Change', color: 'bg-purple-600' },
  { type: 'HEADING', label: 'Heading Assignment', color: 'bg-purple-600' },
  { type: 'SPEED', label: 'Speed Assignment', color: 'bg-purple-600' },
  { type: 'DIRECT', label: 'Direct To', color: 'bg-cyan-600' },
  { type: 'HOLD', label: 'Hold Instructions', color: 'bg-yellow-600' },
];

const STATUS_QUICK_ACTIONS = [
  { status: 'CLEARANCE_DELIVERED', label: 'CLR Delivered', color: 'bg-blue-500' },
  { status: 'PUSH_APPROVED', label: 'Push Approved', color: 'bg-green-500' },
  { status: 'TAXIING', label: 'Taxiing', color: 'bg-yellow-500' },
  { status: 'HOLDING', label: 'Holding', color: 'bg-orange-500' },
  { status: 'LINEUP', label: 'Lineup', color: 'bg-orange-600' },
  { status: 'TAKEOFF_CLEARED', label: 'T/O Cleared', color: 'bg-green-600' },
  { status: 'DEPARTED', label: 'Departed', color: 'bg-blue-600' },
  { status: 'LANDED', label: 'Landed', color: 'bg-green-700' },
];

export default function ClearanceModal({ strip, onClose }: ClearanceModalProps) {
  const { addClearance, updateStripStatus, addAnnotation } = useFlightStore();
  const [clearanceValue, setClearanceValue] = useState('');
  const [selectedClearanceType, setSelectedClearanceType] = useState<ClearanceType | null>(null);
  const [annotationText, setAnnotationText] = useState('');

  const handleIssueClearance = useCallback((type: ClearanceType) => {
    const value = clearanceValue || getDefaultClearanceValue(type, strip);
    addClearance(strip.id, type, value);
    setClearanceValue('');
    setSelectedClearanceType(null);
  }, [strip, clearanceValue, addClearance]);

  const handleStatusChange = useCallback((status: string) => {
    updateStripStatus(strip.id, status as any);
  }, [strip.id, updateStripStatus]);

  const handleAddAnnotation = useCallback(() => {
    if (annotationText.trim()) {
      addAnnotation(strip.id, annotationText.trim());
      setAnnotationText('');
    }
  }, [strip.id, annotationText, addAnnotation]);

  const getDefaultClearanceValue = (type: ClearanceType, strip: FlightStrip): string => {
    switch (type) {
      case 'TAXI':
        return `VIA ${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}, RWY ${strip.runway || '33L'}`;
      case 'ALTITUDE':
        return `FL${Math.floor(strip.altitude / 100)}`;
      case 'HEADING':
        return `HDG ${Math.floor(Math.random() * 36) * 10}`;
      case 'SPEED':
        return `250 KTS`;
      case 'TAKEOFF':
        return `RWY ${strip.runway || '33L'}, WIND 280/10`;
      case 'LANDING':
        return `RWY ${strip.runway || '33L'}, WIND 280/10`;
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-atc-panel border border-atc-surface rounded-lg w-[600px] max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-atc-surface px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-atc-accent">{strip.callsign}</span>
              <span className="text-sm text-gray-400">{strip.aircraftType}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                strip.wakeTurbulenceCategory === 'J' ? 'bg-red-600' :
                strip.wakeTurbulenceCategory === 'H' ? 'bg-orange-600' :
                'bg-green-600'
              }`}>
                {strip.wakeTurbulenceCategory}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              x
            </button>
          </div>

          {/* Flight Info */}
          <div className="px-4 py-3 border-b border-atc-surface">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400 font-bold">{strip.departure}</span>
              <span className="text-gray-500">→</span>
              <span className="text-blue-400 font-bold">{strip.destination}</span>
              {strip.runway && (
                <span className="bg-atc-bg px-2 py-0.5 rounded">RWY {strip.runway}</span>
              )}
              {strip.sid && <span className="text-gray-400">SID: {strip.sid}</span>}
              {strip.star && <span className="text-gray-400">STAR: {strip.star}</span>}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
            {/* Quick Status Change */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Status Change</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusChange(action.status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      strip.status === action.status
                        ? `${action.color} text-white`
                        : 'bg-atc-surface text-gray-300 hover:bg-atc-bg'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Clearance */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Issue Clearance</h3>
              <div className="grid grid-cols-3 gap-2">
                {CLEARANCE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      if (selectedClearanceType === option.type) {
                        handleIssueClearance(option.type);
                      } else {
                        setSelectedClearanceType(option.type);
                      }
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                      selectedClearanceType === option.type
                        ? `${option.color} text-white ring-2 ring-white`
                        : 'bg-atc-surface text-gray-300 hover:bg-atc-bg'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedClearanceType && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={clearanceValue}
                    onChange={(e) => setClearanceValue(e.target.value)}
                    placeholder="Clearance details (optional)"
                    className="flex-1 bg-atc-bg border border-atc-surface rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-atc-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleIssueClearance(selectedClearanceType);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleIssueClearance(selectedClearanceType)}
                    className="bg-atc-accent text-black px-4 py-2 rounded font-medium hover:bg-yellow-400 transition-colors"
                  >
                    Issue
                  </button>
                </div>
              )}
            </div>

            {/* Add Annotation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Add Annotation</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Note or annotation..."
                  className="flex-1 bg-atc-bg border border-atc-surface rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-atc-accent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddAnnotation();
                    }
                  }}
                />
                <button
                  onClick={handleAddAnnotation}
                  className="bg-atc-surface text-white px-4 py-2 rounded font-medium hover:bg-atc-bg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Clearance History */}
            {strip.clearances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Clearance History</h3>
                <div className="space-y-1">
                  {strip.clearances.slice().reverse().map((clr) => (
                    <div
                      key={clr.id}
                      className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                        clr.readbackReceived ? 'bg-green-900/30' : 'bg-yellow-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{clr.type}</span>
                        <span className="text-gray-400">{clr.value}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {new Date(clr.issuedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}Z
                        </span>
                        {clr.readbackReceived ? (
                          <span className="text-green-400">RB</span>
                        ) : (
                          <span className="text-yellow-400">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Annotations */}
            {strip.annotations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Annotations</h3>
                <div className="space-y-1">
                  {strip.annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="flex items-center justify-between px-3 py-2 rounded bg-atc-bg text-xs"
                    >
                      <span>{ann.content}</span>
                      <span className="text-gray-500">
                        {new Date(ann.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}Z
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-atc-surface flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-atc-bg text-white rounded hover:bg-atc-panel transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
