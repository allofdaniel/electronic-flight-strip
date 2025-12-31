import { useEffect, useState } from 'react';
import { useSystemStore } from './core/store/systemStore';
import { useFlightStore } from './core/store/flightStore';
import MainLayout from './ui/views/MainLayout';

function App() {
  const { initializeSystem, operationalMode } = useSystemStore();
  const { loadSampleData } = useFlightStore();

  useEffect(() => {
    // Initialize system with default configuration
    initializeSystem({
      airport: 'RKSI',
      operationalMode: 'SIMULATION',
      runwayConfiguration: [
        {
          runway: '33L',
          mode: 'MIXED',
          arrivalRate: 30,
          departureRate: 30,
          active: true,
        },
        {
          runway: '33R',
          mode: 'MIXED',
          arrivalRate: 30,
          departureRate: 30,
          active: true,
        },
      ],
      bays: [],
      simulationSpeed: 1,
      safetyNetsEnabled: true,
    });

    // Load sample data for demo
    loadSampleData();
  }, [initializeSystem, loadSampleData]);

  return (
    <div className="min-h-screen bg-atc-bg text-white font-mono">
      {/* Header */}
      <header className="h-12 bg-atc-panel border-b border-atc-surface flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-atc-accent">EFS</h1>
          <span className="text-sm text-gray-400">Electronic Flight Strip System</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Mode:</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              operationalMode === 'LIVE'
                ? 'bg-green-600 text-white'
                : operationalMode === 'SIMULATION'
                ? 'bg-blue-600 text-white'
                : 'bg-yellow-600 text-white'
            }`}>
              {operationalMode}
            </span>
          </div>
          <div className="text-sm font-mono">
            <Clock />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <MainLayout />
    </div>
  );
}

// Clock component showing UTC time with live updates
function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utc = time.toISOString().slice(11, 19);
  return <span className="text-green-400">{utc}Z</span>;
}

export default App;
