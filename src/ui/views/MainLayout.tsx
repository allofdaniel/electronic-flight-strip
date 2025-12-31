import { useState } from 'react';
import BayContainer from '../components/BayContainer';
import AlertPanel from '../components/AlertPanel';
import TimelinePanel from '../components/TimelinePanel';
import ToolsPanel from '../components/ToolsPanel';
import ClearanceModal from '../components/ClearanceModal';
import { useSystemStore } from '../../core/store/systemStore';
import { useFlightStore } from '../../core/store/flightStore';
import type { FlightStrip } from '../../types/index';

type ViewMode = 'strips' | 'timeline' | 'split';

export default function MainLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>('strips');
  const [showAlerts, setShowAlerts] = useState(true);
  const [showTools, setShowTools] = useState(true);
  const [modalStrip, setModalStrip] = useState<FlightStrip | null>(null);
  const { unacknowledgedAlertCount } = useSystemStore();
  const { selectStrip } = useFlightStore();

  const handleStripDoubleClick = (strip: FlightStrip) => {
    setModalStrip(strip);
  };

  const handleCloseModal = () => {
    setModalStrip(null);
    selectStrip(null);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left Tools Panel */}
      {showTools && (
        <aside className="w-64 bg-atc-panel border-r border-atc-surface flex flex-col">
          <ToolsPanel />
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* View Mode Tabs */}
        <div className="h-10 bg-atc-surface border-b border-atc-bg flex items-center px-2 gap-2">
          <button
            className={`btn ${viewMode === 'strips' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('strips')}
          >
            Strips
          </button>
          <button
            className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </button>
          <button
            className={`btn ${viewMode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('split')}
          >
            Split
          </button>

          <div className="flex-1" />

          <button
            className={`btn btn-ghost ${!showTools ? 'opacity-50' : ''}`}
            onClick={() => setShowTools(!showTools)}
          >
            Tools
          </button>
          <button
            className={`btn btn-ghost relative ${!showAlerts ? 'opacity-50' : ''}`}
            onClick={() => setShowAlerts(!showAlerts)}
          >
            Alerts
            {unacknowledgedAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-alert-critical text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {unacknowledgedAlertCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Based on View Mode */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'strips' && (
            <div className="h-full overflow-x-auto">
              <BayContainer onStripDoubleClick={handleStripDoubleClick} />
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="h-full">
              <TimelinePanel />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="h-full flex">
              <div className="flex-1 overflow-x-auto border-r border-atc-surface">
                <BayContainer onStripDoubleClick={handleStripDoubleClick} />
              </div>
              <div className="w-96">
                <TimelinePanel />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Alert Panel */}
      {showAlerts && (
        <aside className="w-80 bg-atc-panel border-l border-atc-surface flex flex-col">
          <AlertPanel />
        </aside>
      )}

      {/* Clearance Modal */}
      {modalStrip && (
        <ClearanceModal strip={modalStrip} onClose={handleCloseModal} />
      )}
    </div>
  );
}
