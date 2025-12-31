import { useMemo, useState } from 'react';
import { useFlightStore } from '../../core/store/flightStore';
import { useSystemStore } from '../../core/store/systemStore';
import type { FlightStrip } from '../../types/index';

type TimelineView = 'arrivals' | 'departures' | 'both';

export default function TimelinePanel() {
  const [view, setView] = useState<TimelineView>('both');
  const [timeRange, setTimeRange] = useState(60); // minutes to display
  const { strips } = useFlightStore();
  const { simulationTime, runwayConfigs } = useSystemStore();

  const now = simulationTime || new Date();

  // Filter and sort flights for timeline
  const { arrivals, departures } = useMemo(() => {
    const allStrips = Array.from(strips.values());

    const arrivals = allStrips
      .filter((s) => s.eta && ['INITIAL_APPROACH', 'FINAL_APPROACH', 'ACTIVE'].includes(s.status))
      .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

    const departures = allStrips
      .filter((s) => (s.eobt || s.tsat || s.ttot) && ['FILED', 'CLEARANCE_DELIVERED', 'PUSH_APPROVED', 'TAXIING', 'HOLDING', 'LINEUP'].includes(s.status))
      .sort((a, b) => {
        const timeA = a.ttot || a.tsat || a.eobt;
        const timeB = b.ttot || b.tsat || b.eobt;
        return new Date(timeA!).getTime() - new Date(timeB!).getTime();
      });

    return { arrivals, departures };
  }, [strips]);

  const activeRunways = useMemo(() => {
    return runwayConfigs.filter((r) => r.active);
  }, [runwayConfigs]);

  return (
    <div className="flex flex-col h-full bg-atc-bg">
      {/* Header */}
      <div className="h-10 bg-atc-surface border-b border-atc-bg flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">Timeline</span>
          <select
            className="input text-xs py-1 px-2 w-auto"
            value={view}
            onChange={(e) => setView(e.target.value as TimelineView)}
          >
            <option value="both">Both</option>
            <option value="arrivals">Arrivals (AMAN)</option>
            <option value="departures">Departures (DMAN)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Range:</span>
          <select
            className="input text-xs py-1 px-2 w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
          >
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* AMAN - Arrivals */}
        {(view === 'arrivals' || view === 'both') && (
          <div className={`${view === 'both' ? 'w-1/2 border-r border-atc-surface' : 'w-full'} flex flex-col`}>
            <div className="h-8 bg-strip-arrival/20 flex items-center justify-center text-xs font-bold text-strip-arrival">
              AMAN - Arrivals
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <TimelineColumn
                flights={arrivals}
                timeField="eta"
                now={now}
                timeRange={timeRange}
                color="blue"
              />
            </div>
          </div>
        )}

        {/* DMAN - Departures */}
        {(view === 'departures' || view === 'both') && (
          <div className={`${view === 'both' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="h-8 bg-strip-departure/20 flex items-center justify-center text-xs font-bold text-strip-departure">
              DMAN - Departures
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <TimelineColumn
                flights={departures}
                timeField="ttot"
                now={now}
                timeRange={timeRange}
                color="green"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer - Runway Info */}
      <div className="h-12 bg-atc-surface border-t border-atc-bg flex items-center justify-around px-2">
        {activeRunways.map((rwy) => (
          <div key={rwy.runway} className="text-center">
            <div className="text-xs font-bold">{rwy.runway}</div>
            <div className="text-xs text-gray-400">
              {rwy.mode === 'MIXED' ? 'A+D' : rwy.mode === 'ARRIVAL' ? 'ARR' : 'DEP'}
              {' '}{rwy.arrivalRate + rwy.departureRate}/hr
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimelineColumnProps {
  flights: FlightStrip[];
  timeField: 'eta' | 'ttot' | 'tsat' | 'eobt';
  now: Date;
  timeRange: number;
  color: 'blue' | 'green';
}

function TimelineColumn({ flights, timeField, now, timeRange, color }: TimelineColumnProps) {
  const colorClass = color === 'blue' ? 'bg-blue-600' : 'bg-green-600';
  const borderColorClass = color === 'blue' ? 'border-blue-400' : 'border-green-400';

  // Generate time markers
  const markers = useMemo(() => {
    const result = [];
    for (let i = 0; i <= timeRange; i += 15) {
      const time = new Date(now.getTime() + i * 60000);
      result.push({
        offset: i,
        label: time.toISOString().slice(11, 16) + 'Z',
      });
    }
    return result;
  }, [now, timeRange]);

  return (
    <div className="relative h-full min-h-[400px]">
      {/* Time markers */}
      {markers.map((marker) => (
        <div
          key={marker.offset}
          className="absolute left-0 right-0 border-t border-gray-700"
          style={{ top: `${(marker.offset / timeRange) * 100}%` }}
        >
          <span className="absolute -top-2.5 left-1 text-xs text-gray-500 bg-atc-bg px-1">
            {marker.label}
          </span>
        </div>
      ))}

      {/* Now marker */}
      <div className="absolute left-0 right-0 h-0.5 bg-atc-accent z-10" style={{ top: '0%' }}>
        <span className="absolute -top-2.5 right-1 text-xs text-atc-accent font-bold">NOW</span>
      </div>

      {/* Flight items */}
      {flights.map((flight) => {
        const flightTime = flight[timeField];
        if (!flightTime) return null;

        const minutesFromNow = (new Date(flightTime).getTime() - now.getTime()) / 60000;
        if (minutesFromNow < 0 || minutesFromNow > timeRange) return null;

        const topPercent = (minutesFromNow / timeRange) * 100;

        return (
          <div
            key={flight.id}
            className={`absolute left-8 right-2 h-6 rounded px-2 flex items-center ${colorClass} text-white text-xs font-mono truncate border-l-2 ${borderColorClass}`}
            style={{ top: `${topPercent}%` }}
            title={`${flight.callsign} - ${flight.departure}→${flight.destination}`}
          >
            <span className="font-bold mr-2">{flight.callsign}</span>
            <span className="opacity-75">{flight.aircraftType}</span>
            {flight.runway && (
              <span className="ml-auto opacity-75">R{flight.runway}</span>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {flights.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          No scheduled flights
        </div>
      )}
    </div>
  );
}
