import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlightStripCard from './FlightStripCard';
import { useFlightStore } from '../../core/store/flightStore';
import type { BayType, FlightStrip } from '../../types/index';

interface BayProps {
  id: string;
  name: string;
  type: BayType;
  runway?: string;
  onStripDoubleClick?: (strip: FlightStrip) => void;
}

export default function Bay({ id, name, type, runway, onStripDoubleClick }: BayProps) {
  const { dropTargetBayId, setDropTarget, moveStripToBay, endDragging, draggingStripId } = useFlightStore();

  // Subscribe to strips and stripsByBay directly to properly react to changes
  const allStrips = useFlightStore((state) => state.strips);
  const stripsByBay = useFlightStore((state) => state.stripsByBay);

  const strips = useMemo(() => {
    const stripIds = stripsByBay.get(id) || [];
    return stripIds
      .map((stripId) => allStrips.get(stripId))
      .filter((s): s is FlightStrip => s !== undefined);
  }, [id, allStrips, stripsByBay]);

  const isDropTarget = dropTargetBayId === id;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(id);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingStripId) {
      moveStripToBay(draggingStripId, id);
      endDragging();
    }
    setDropTarget(null);
  };

  const bayClass = useMemo(() => {
    switch (type) {
      case 'DEPARTURE':
        return 'bay-departure';
      case 'ARRIVAL':
        return 'bay-arrival';
      case 'RUNWAY':
        return 'bay-runway';
      default:
        return '';
    }
  }, [type]);

  return (
    <div
      className={`bay ${bayClass} ${isDropTarget ? 'drop-zone-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Bay Header */}
      <div className="bay-header">
        <span>{name}</span>
        <span className="text-xs text-gray-400">
          {strips.length} {runway ? `| ${runway}` : ''}
        </span>
      </div>

      {/* Bay Content */}
      <div className="bay-content">
        {strips.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            No strips
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {strips.map((strip, index) => (
              <motion.div
                key={strip.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FlightStripCard strip={strip} index={index} onDoubleClick={onStripDoubleClick} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
