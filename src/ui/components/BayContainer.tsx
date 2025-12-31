import { useMemo } from 'react';
import Bay from './Bay';
import { useSystemStore } from '../../core/store/systemStore';
import type { BayType } from '../../types/index';

// Default bay configuration for demonstration
const DEFAULT_BAYS = [
  { id: 'clearance', name: 'CLR DEL', type: 'GROUND' as BayType, position: 0, controllerRole: 'CLEARANCE' },
  { id: 'ground', name: 'GROUND', type: 'GROUND' as BayType, position: 1, controllerRole: 'GROUND' },
  { id: 'rwy-33l', name: 'RWY 33L', type: 'RUNWAY' as BayType, position: 2, controllerRole: 'TOWER', runway: '33L' },
  { id: 'rwy-33r', name: 'RWY 33R', type: 'RUNWAY' as BayType, position: 3, controllerRole: 'TOWER', runway: '33R' },
  { id: 'departure', name: 'DEPARTURE', type: 'DEPARTURE' as BayType, position: 4, controllerRole: 'DEPARTURE' },
  { id: 'approach', name: 'APPROACH', type: 'APPROACH' as BayType, position: 5, controllerRole: 'APPROACH' },
  { id: 'arrival', name: 'ARRIVAL', type: 'ARRIVAL' as BayType, position: 6, controllerRole: 'TOWER' },
];

export default function BayContainer() {
  const { bays: configuredBays } = useSystemStore();

  // Use configured bays or default bays
  const bays = useMemo(() => {
    if (configuredBays.length > 0) {
      return configuredBays;
    }
    return DEFAULT_BAYS.map((b) => ({
      ...b,
      strips: [],
    }));
  }, [configuredBays]);

  return (
    <div className="flex gap-2 p-2 h-full min-w-max">
      {bays.map((bay) => (
        <Bay
          key={bay.id}
          id={bay.id}
          name={bay.name}
          type={bay.type}
          runway={bay.runway}
        />
      ))}
    </div>
  );
}
