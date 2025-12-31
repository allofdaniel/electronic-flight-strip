import { useState } from 'react';
import { useFlightStore } from '../../core/store/flightStore';
import { useSystemStore } from '../../core/store/systemStore';
import type { StripStatus, ClearanceType } from '../../types/index';

type ToolTab = 'search' | 'clearance' | 'scenario' | 'config';

export default function ToolsPanel() {
  const [activeTab, setActiveTab] = useState<ToolTab>('search');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-atc-surface">
        {(['search', 'clearance', 'scenario', 'config'] as ToolTab[]).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-xs font-medium capitalize ${
              activeTab === tab
                ? 'bg-atc-surface text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'clearance' && <ClearanceTab />}
        {activeTab === 'scenario' && <ScenarioTab />}
        {activeTab === 'config' && <ConfigTab />}
      </div>
    </div>
  );
}

function SearchTab() {
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, clearFilters, getFilteredStrips } = useFlightStore();

  const filteredStrips = getFilteredStrips();

  const statusOptions: (StripStatus | 'ALL')[] = [
    'ALL',
    'FILED',
    'ACTIVE',
    'CLEARANCE_DELIVERED',
    'TAXIING',
    'HOLDING',
    'DEPARTED',
    'LANDED',
  ];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Search Callsign/Airport</label>
        <input
          type="text"
          className="input"
          placeholder="KAL001, RKSI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Filter by Status</label>
        <select
          className="input"
          value={statusFilter || 'ALL'}
          onChange={(e) => setStatusFilter(e.target.value === 'ALL' ? null : e.target.value as StripStatus)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All Statuses' : status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      <button className="btn btn-secondary w-full" onClick={clearFilters}>
        Clear Filters
      </button>

      {/* Results */}
      <div className="mt-4">
        <div className="text-xs text-gray-400 mb-2">
          {filteredStrips.length} flight(s) found
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {filteredStrips.slice(0, 20).map((strip) => (
            <div
              key={strip.id}
              className="text-xs bg-atc-surface px-2 py-1 rounded flex items-center justify-between"
            >
              <span className="font-mono font-bold">{strip.callsign}</span>
              <span className="text-gray-400">
                {strip.departure}→{strip.destination}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClearanceTab() {
  const { selectedStripId, getStrip, addClearance, updateStripStatus } = useFlightStore();

  const selectedStrip = selectedStripId ? getStrip(selectedStripId) : null;

  const clearanceTypes: ClearanceType[] = [
    'STARTUP',
    'PUSHBACK',
    'TAXI',
    'HOLD_SHORT',
    'LINEUP',
    'TAKEOFF',
    'LANDING',
    'ALTITUDE',
    'HEADING',
    'SPEED',
  ];

  const [clearanceValue, setClearanceValue] = useState('');
  const [selectedClearanceType, setSelectedClearanceType] = useState<ClearanceType>('STARTUP');

  const handleIssueClearance = () => {
    if (selectedStripId && clearanceValue) {
      addClearance(selectedStripId, selectedClearanceType, clearanceValue);
      setClearanceValue('');
    }
  };

  if (!selectedStrip) {
    return (
      <div className="text-center text-gray-500 py-8">
        Select a strip to issue clearances
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Strip Info */}
      <div className="bg-atc-surface p-3 rounded">
        <div className="text-lg font-bold callsign">{selectedStrip.callsign}</div>
        <div className="text-sm text-gray-400">
          {selectedStrip.departure} → {selectedStrip.destination}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Status: {selectedStrip.status.replace('_', ' ')}
        </div>
      </div>

      {/* Clearance Type */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Clearance Type</label>
        <select
          className="input"
          value={selectedClearanceType}
          onChange={(e) => setSelectedClearanceType(e.target.value as ClearanceType)}
        >
          {clearanceTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Clearance Value */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Clearance Details</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., VIA T1 T2, FL350, HDG 270..."
          value={clearanceValue}
          onChange={(e) => setClearanceValue(e.target.value.toUpperCase())}
        />
      </div>

      {/* Issue Button */}
      <button
        className="btn btn-primary w-full"
        onClick={handleIssueClearance}
        disabled={!clearanceValue}
      >
        Issue Clearance
      </button>

      {/* Quick Status Updates */}
      <div className="border-t border-atc-surface pt-4">
        <label className="block text-xs text-gray-400 mb-2">Quick Status Update</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'CLEARANCE_DELIVERED')}
          >
            CLR Delivered
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'PUSH_APPROVED')}
          >
            Push Approved
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'TAXIING')}
          >
            Taxiing
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'HOLDING')}
          >
            Holding
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'LINEUP')}
          >
            Line Up
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'TAKEOFF_CLEARED')}
          >
            T/O Cleared
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'DEPARTED')}
          >
            Departed
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => updateStripStatus(selectedStripId!, 'LANDED')}
          >
            Landed
          </button>
        </div>
      </div>
    </div>
  );
}

function ScenarioTab() {
  const { loadSampleData, clearAllStrips } = useFlightStore();
  const { startSimulation, pauseSimulation, simulationRunning, simulationSpeed, setSimulationSpeed } = useSystemStore();

  return (
    <div className="space-y-4">
      {/* Simulation Controls */}
      <div className="bg-atc-surface p-3 rounded">
        <div className="text-xs text-gray-400 mb-2">Simulation</div>
        <div className="flex items-center gap-2 mb-2">
          <button
            className={`btn ${simulationRunning ? 'btn-danger' : 'btn-primary'} flex-1`}
            onClick={() => simulationRunning ? pauseSimulation() : startSimulation()}
          >
            {simulationRunning ? 'Pause' : 'Start'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Speed:</span>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs font-mono w-10">{simulationSpeed}x</span>
        </div>
      </div>

      {/* Load Sample Data */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Load Scenario</label>
        <button
          className="w-full text-left bg-atc-surface hover:bg-atc-surface/80 p-3 rounded"
          onClick={loadSampleData}
        >
          <div className="text-sm font-medium">Sample Traffic</div>
          <div className="text-xs text-gray-400">Load sample departures and arrivals at RKSI</div>
        </button>
      </div>

      {/* Clear All */}
      <button className="btn btn-danger w-full" onClick={clearAllStrips}>
        Clear All Strips
      </button>
    </div>
  );
}

function ConfigTab() {
  const { operationalMode, setOperationalMode, runwayConfigs, updateRunwayConfig } = useSystemStore();

  return (
    <div className="space-y-4">
      {/* Operational Mode */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Operational Mode</label>
        <select
          className="input"
          value={operationalMode}
          onChange={(e) => setOperationalMode(e.target.value as 'LIVE' | 'SIMULATION' | 'TRAINING')}
        >
          <option value="SIMULATION">Simulation</option>
          <option value="TRAINING">Training</option>
          <option value="LIVE">Live (Disabled)</option>
        </select>
      </div>

      {/* Runway Configuration */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Runway Configuration</label>
        <div className="space-y-2">
          {runwayConfigs.map((rwy) => (
            <div key={rwy.runway} className="bg-atc-surface p-2 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{rwy.runway}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={rwy.active}
                    onChange={(e) => updateRunwayConfig(rwy.runway, { active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <select
                className="input text-xs py-1"
                value={rwy.mode}
                onChange={(e) => updateRunwayConfig(rwy.runway, { mode: e.target.value as 'DEPARTURE' | 'ARRIVAL' | 'MIXED' })}
              >
                <option value="MIXED">Mixed (Arr + Dep)</option>
                <option value="ARRIVAL">Arrival Only</option>
                <option value="DEPARTURE">Departure Only</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Nets */}
      <div className="border-t border-atc-surface pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked />
          <span>Enable Safety Nets (RIMCAS, CATC)</span>
        </label>
      </div>
    </div>
  );
}
