import { useEffect, useState, useCallback } from 'react';
import { useSystemStore } from './core/store/systemStore';
import { useFlightStore } from './core/store/flightStore';
import MainLayout from './ui/views/MainLayout';
import { simulationEngine } from './services/SimulationEngine';

function App() {
  const { initializeSystem, operationalMode, simulationSpeed, setSimulationSpeed } = useSystemStore();
  const { loadSampleData } = useFlightStore();
  const [isSimRunning, setIsSimRunning] = useState(false);

  const toggleSimulation = useCallback(() => {
    if (isSimRunning) {
      simulationEngine.stop();
      setIsSimRunning(false);
    } else {
      simulationEngine.start();
      setIsSimRunning(true);
    }
  }, [isSimRunning]);

  const handleSpeedChange = useCallback((speed: number) => {
    setSimulationSpeed(speed);
  }, [setSimulationSpeed]);

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
          {/* Simulation Controls */}
          <div className="flex items-center gap-2 border-r border-atc-surface pr-4">
            <button
              onClick={toggleSimulation}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                isSimRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSimRunning ? 'STOP' : 'START'}
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Speed:</span>
              {[1, 2, 5, 10].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    simulationSpeed === speed
                      ? 'bg-atc-accent text-black'
                      : 'bg-atc-surface text-gray-300 hover:bg-atc-panel'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

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
