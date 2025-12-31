import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlightStripCard from './FlightStripCard';
import { useFlightStore } from '../../core/store/flightStore';
import type { BayType } from '../../types/index';

interface BayProps {
  id: string;
  name: string;
  type: BayType;
  runway?: string;
}

export default function Bay({ id, name, type, runway }: BayProps) {
  const { getStripsByBay, dropTargetBayId, setDropTarget, moveStripToBay, endDragging, draggingStripId } = useFlightStore();

  const strips = useMemo(() => getStripsByBay(id), [id, getStripsByBay]);

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
        <AnimatePresence mode="popLayout">
          {strips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-20 text-gray-500 text-sm"
            >
              No strips
            </motion.div>
          ) : (
            strips.map((strip, index) => (
              <motion.div
                key={strip.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <FlightStripCard strip={strip} index={index} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
