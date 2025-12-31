import { useMemo } from 'react';
import { useFlightStore } from '../../core/store/flightStore';
import type { FlightStrip } from '../../types/index';
import { formatZuluTime, formatFlightLevel } from '../../utils/helpers';

interface FlightStripCardProps {
  strip: FlightStrip;
  index: number;
}

export default function FlightStripCard({ strip, index }: FlightStripCardProps) {
  const { selectedStripId, selectStrip, startDragging, endDragging, highlightedStripIds } = useFlightStore();

  const isSelected = selectedStripId === strip.id;
  const isHighlighted = highlightedStripIds.has(strip.id);

  // Determine strip type based on status
  const isDeparture = useMemo(() => {
    return ['FILED', 'CLEARANCE_DELIVERED', 'PUSH_APPROVED', 'TAXIING', 'HOLDING', 'LINEUP', 'TAKEOFF_CLEARED', 'DEPARTED'].includes(strip.status);
  }, [strip.status]);

  const stripTypeClass = isDeparture ? 'strip-departure' : 'strip-arrival';

  // Status display
  const statusClass = useMemo(() => {
    switch (strip.status) {
      case 'FILED':
        return 'strip-status-filed';
      case 'ACTIVE':
      case 'CLEARANCE_DELIVERED':
        return 'strip-status-clearance';
      case 'TAXIING':
      case 'TAXI_IN':
        return 'strip-status-taxiing';
      case 'HOLDING':
      case 'LINEUP':
        return 'strip-status-holding';
      case 'DEPARTED':
        return 'strip-status-departed';
      case 'LANDED':
      case 'AT_GATE':
        return 'strip-status-landed';
      default:
        return 'strip-status-active';
    }
  }, [strip.status]);

  // Wake turbulence category styling
  const wtcClass = useMemo(() => {
    switch (strip.wakeTurbulenceCategory) {
      case 'J':
        return 'wtc-super';
      case 'H':
        return 'wtc-heavy';
      case 'M':
        return 'wtc-medium';
      case 'L':
        return 'wtc-light';
      default:
        return 'wtc-medium';
    }
  }, [strip.wakeTurbulenceCategory]);

  const handleClick = () => {
    selectStrip(isSelected ? null : strip.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    startDragging(strip.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    endDragging();
  };

  return (
    <div
      className={`strip ${stripTypeClass} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${strip.isGhost ? 'ghost' : ''}`}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Left Section - Callsign & WTC */}
      <div className="w-24 flex flex-col justify-center items-center border-r border-atc-surface px-2">
        <span className="callsign text-lg">{strip.callsign}</span>
        <div className="flex items-center gap-1 mt-1">
          <span className={`wtc-badge ${wtcClass}`}>{strip.wakeTurbulenceCategory}</span>
          <span className="text-xs text-gray-400">{strip.aircraftType}</span>
        </div>
      </div>

      {/* Center Section - Route Info */}
      <div className="flex-1 flex flex-col justify-center px-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-green-400">{strip.departure}</span>
          <span className="text-gray-500">→</span>
          <span className="font-bold text-blue-400">{strip.destination}</span>
          {strip.runway && (
            <span className="text-xs bg-atc-surface px-1.5 py-0.5 rounded">
              RWY {strip.runway}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          {strip.sid && <span>SID: {strip.sid}</span>}
          {strip.star && <span>STAR: {strip.star}</span>}
          <span className="altitude">{formatFlightLevel(strip.altitude)}</span>
          <span className="squawk">{strip.ssrCode}</span>
        </div>

        {/* Clearances */}
        {strip.clearances.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {strip.clearances.slice(-3).map((clr) => (
              <span
                key={clr.id}
                className={`text-xs px-1 py-0.5 rounded ${
                  clr.readbackReceived ? 'bg-green-800 text-green-200' : 'bg-yellow-800 text-yellow-200'
                }`}
              >
                {clr.type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Section - Times & Status */}
      <div className="w-28 flex flex-col justify-center items-end px-2 border-l border-atc-surface">
        <span className={`strip-status ${statusClass}`}>
          {strip.status.replace('_', ' ')}
        </span>

        <div className="flex flex-col items-end text-xs text-gray-400 mt-1">
          {strip.eobt && (
            <span>EOBT: {formatZuluTime(new Date(strip.eobt))}</span>
          )}
          {strip.eta && (
            <span>ETA: {formatZuluTime(new Date(strip.eta))}</span>
          )}
          {strip.gate && (
            <span>Gate: {strip.gate}</span>
          )}
        </div>
      </div>

      {/* Annotations Indicator */}
      {strip.annotations.length > 0 && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-black font-bold">
          {strip.annotations.length}
        </div>
      )}
    </div>
  );
}
