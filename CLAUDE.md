# Electronic Flight Strip System - Claude Code Project

## Project Overview

Electronic Flight Strip (EFS) System for Air Traffic Control - a standalone web application that simulates the digital flight strip management used in ATC towers.

## Live Demo & Repository

- **Live URL**: https://electronic-flight-strip.vercel.app
- **GitHub**: https://github.com/allofdaniel/electronic-flight-strip

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (custom ATC dark theme)
- **State Management**: Zustand with devtools
- **Animation**: Framer Motion
- **Deployment**: Vercel (auto-deploy from GitHub)

## Project Structure

```
src/
├── App.tsx                    # Main application component
├── main.tsx                   # Entry point
├── core/
│   └── store/
│       ├── flightStore.ts     # Flight strip state (Zustand)
│       └── systemStore.ts     # System configuration state
├── types/
│   └── index.ts               # TypeScript type definitions
├── ui/
│   ├── components/
│   │   ├── AlertPanel.tsx     # Safety net alerts (RIMCAS, STCA, etc.)
│   │   ├── Bay.tsx            # Individual bay component
│   │   ├── BayContainer.tsx   # Bay grid container
│   │   ├── FlightStripCard.tsx # Flight strip card component
│   │   ├── TimelinePanel.tsx  # AMAN/DMAN timeline view
│   │   └── ToolsPanel.tsx     # Search, clearance, scenario tools
│   ├── styles/
│   │   └── index.css          # Global styles + Tailwind
│   └── views/
│       └── MainLayout.tsx     # Main layout component
├── modules/
│   ├── aman-dman/             # Arrival/Departure Manager modules
│   ├── fdps/                  # Flight Data Processing modules
│   └── safety-net/            # Safety net engine modules
├── data/
│   ├── aircraft/              # Aircraft database
│   ├── airports/              # Airport data (RKSI)
│   └── scenarios/             # Training scenarios
├── services/                  # Service layer
└── utils/
    └── helpers.ts             # Utility functions
```

## Key Features Implemented

### 1. Bay-based Organization
- **CLR DEL (Clearance Delivery)**: Filed flights awaiting clearance
- **GROUND**: Pushback/taxi operations
- **RWY 33L/33R**: Runway-specific strips
- **DEPARTURE**: Departed aircraft
- **APPROACH**: Arriving aircraft
- **ARRIVAL**: Landed/taxi-in aircraft

### 2. Flight Strip Cards
- Callsign with airline colors
- Aircraft type + Wake turbulence category (J/H/M/L)
- Origin/Destination airports
- Altitude/Flight level
- SID/STAR routes
- Status indicators
- Clearance history

### 3. Interactive Features
- Click to select strip
- Drag-and-drop between bays
- Search by callsign/airport
- Filter by status
- Issue clearances
- Quick status updates

### 4. Timeline View (AMAN/DMAN)
- Visual timeline of arrivals/departures
- ETA/EOBT display
- Wake turbulence separation indicators

### 5. Safety Alerts
- RIMCAS (Runway Incursion Monitoring)
- STCA (Short-Term Conflict Alert)
- Wake turbulence warnings
- Sequence alerts

## Sample Data

Pre-loaded with RKSI (Incheon International Airport) sample traffic:
- 6 departures (KAL001, AAR201, OZ101, JJA501, KAL031, TWB721)
- 4 arrivals (KAL002, SIA621, AAR202, UAE501)

## Development Notes

### Import Path Convention
All imports use relative paths (not TypeScript path aliases) for Vercel compatibility:
```typescript
// Correct
import { useFlightStore } from '../../core/store/flightStore';

// Avoid (may cause build issues)
import { useFlightStore } from '@core/store/flightStore';
```

### Build Command
```bash
npm run build  # Runs vite build (no tsc pre-check)
```

### Local Development
```bash
npm install
npm run dev    # Start dev server at localhost:5173
```

## Deployment History

1. **Initial Setup**: Created React + TypeScript + Vite project structure
2. **Type Definitions**: Defined FlightStrip, Bay, Alert, Clearance types
3. **State Management**: Implemented Zustand stores for flights and system config
4. **UI Components**: Built bay-based layout with flight strip cards
5. **Sample Data**: Added RKSI airport sample traffic
6. **Import Fix**: Converted all alias imports to relative paths
7. **GitHub Push**: Pushed to allofdaniel/electronic-flight-strip
8. **Vercel Deploy**: Deployed with custom domain electronic-flight-strip.vercel.app

## Reference Projects

- RKPU Viewer: https://rkpu-viewer.vercel.app (similar deployment pattern)

## Future Enhancements (Not Implemented)

- Real-time simulation engine
- Multi-controller collaboration
- Voice recognition integration
- ATIS integration
- Weather overlay
- Conflict detection algorithms
- Historical playback
- Print strip functionality

## Created By

This project was created entirely by Claude Code (Claude AI) based on user requirements for an Electronic Flight Strip system similar to those used in actual ATC tower operations.

---

*Last updated: 2025-12-31*
