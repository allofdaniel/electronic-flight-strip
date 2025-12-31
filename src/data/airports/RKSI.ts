// ============================================================
// RKSI - Incheon International Airport Data
// ============================================================

import type { Airport, Runway, Gate, Procedure, HoldingPattern } from '@types/index';

export const RKSI: Airport = {
  icao: 'RKSI',
  iata: 'ICN',
  name: 'Incheon International Airport',
  location: {
    latitude: 37.4691,
    longitude: 126.4505,
  },
  elevation: 23, // feet
  timezone: 'Asia/Seoul',

  runways: [
    {
      id: '15L',
      heading: 150,
      length: 3750,
      width: 60,
      threshold: { latitude: 37.4847, longitude: 126.4167 },
      oppositeThreshold: { latitude: 37.4583, longitude: 126.4472 },
      ils: {
        frequency: 110.9,
        course: 150,
        glideslope: 3.0,
        category: 'CAT_IIIB',
      },
      status: 'OPEN',
    },
    {
      id: '33R',
      heading: 330,
      length: 3750,
      width: 60,
      threshold: { latitude: 37.4583, longitude: 126.4472 },
      oppositeThreshold: { latitude: 37.4847, longitude: 126.4167 },
      ils: {
        frequency: 111.3,
        course: 330,
        glideslope: 3.0,
        category: 'CAT_IIIB',
      },
      status: 'OPEN',
    },
    {
      id: '15R',
      heading: 150,
      length: 4000,
      width: 60,
      threshold: { latitude: 37.4847, longitude: 126.4367 },
      oppositeThreshold: { latitude: 37.4583, longitude: 126.4672 },
      ils: {
        frequency: 109.7,
        course: 150,
        glideslope: 3.0,
        category: 'CAT_IIIB',
      },
      status: 'OPEN',
    },
    {
      id: '33L',
      heading: 330,
      length: 4000,
      width: 60,
      threshold: { latitude: 37.4583, longitude: 126.4672 },
      oppositeThreshold: { latitude: 37.4847, longitude: 126.4367 },
      ils: {
        frequency: 110.3,
        course: 330,
        glideslope: 3.0,
        category: 'CAT_IIIB',
      },
      status: 'OPEN',
    },
    {
      id: '16',
      heading: 160,
      length: 3750,
      width: 60,
      threshold: { latitude: 37.4847, longitude: 126.4867 },
      oppositeThreshold: { latitude: 37.4583, longitude: 126.5072 },
      ils: {
        frequency: 109.3,
        course: 160,
        glideslope: 3.0,
        category: 'CAT_II',
      },
      status: 'OPEN',
    },
    {
      id: '34',
      heading: 340,
      length: 3750,
      width: 60,
      threshold: { latitude: 37.4583, longitude: 126.5072 },
      oppositeThreshold: { latitude: 37.4847, longitude: 126.4867 },
      ils: {
        frequency: 108.7,
        course: 340,
        glideslope: 3.0,
        category: 'CAT_II',
      },
      status: 'OPEN',
    },
  ],

  taxiways: [
    {
      id: 'A',
      name: 'A',
      path: [
        { latitude: 37.4750, longitude: 126.4250 },
        { latitude: 37.4700, longitude: 126.4350 },
        { latitude: 37.4650, longitude: 126.4450 },
      ],
      width: 30,
      holdingPoints: [
        {
          id: 'A1',
          name: 'A1',
          position: { latitude: 37.4750, longitude: 126.4250 },
          runway: '33R',
          catIII: true,
        },
        {
          id: 'A3',
          name: 'A3',
          position: { latitude: 37.4650, longitude: 126.4450 },
          runway: '15L',
          catIII: true,
        },
      ],
    },
    {
      id: 'B',
      name: 'B',
      path: [
        { latitude: 37.4750, longitude: 126.4450 },
        { latitude: 37.4700, longitude: 126.4550 },
        { latitude: 37.4650, longitude: 126.4650 },
      ],
      width: 30,
      holdingPoints: [
        {
          id: 'B1',
          name: 'B1',
          position: { latitude: 37.4750, longitude: 126.4450 },
          runway: '33L',
          catIII: true,
        },
      ],
    },
  ],

  gates: [
    // Terminal 1 Gates
    { id: '101', terminal: 'T1', position: { latitude: 37.4491, longitude: 126.4505 }, heading: 330, size: 'HEAVY' },
    { id: '102', terminal: 'T1', position: { latitude: 37.4493, longitude: 126.4510 }, heading: 330, size: 'HEAVY' },
    { id: '103', terminal: 'T1', position: { latitude: 37.4495, longitude: 126.4515 }, heading: 330, size: 'LARGE' },
    { id: '104', terminal: 'T1', position: { latitude: 37.4497, longitude: 126.4520 }, heading: 330, size: 'LARGE' },
    { id: '105', terminal: 'T1', position: { latitude: 37.4499, longitude: 126.4525 }, heading: 330, size: 'LARGE' },
    { id: '106', terminal: 'T1', position: { latitude: 37.4501, longitude: 126.4530 }, heading: 330, size: 'MEDIUM' },
    { id: '107', terminal: 'T1', position: { latitude: 37.4503, longitude: 126.4535 }, heading: 330, size: 'MEDIUM' },
    { id: '108', terminal: 'T1', position: { latitude: 37.4505, longitude: 126.4540 }, heading: 330, size: 'MEDIUM' },
    // Terminal 2 Gates
    { id: '230', terminal: 'T2', position: { latitude: 37.4591, longitude: 126.4405 }, heading: 330, size: 'HEAVY' },
    { id: '231', terminal: 'T2', position: { latitude: 37.4593, longitude: 126.4410 }, heading: 330, size: 'HEAVY' },
    { id: '232', terminal: 'T2', position: { latitude: 37.4595, longitude: 126.4415 }, heading: 330, size: 'LARGE' },
    { id: '233', terminal: 'T2', position: { latitude: 37.4597, longitude: 126.4420 }, heading: 330, size: 'LARGE' },
    { id: '234', terminal: 'T2', position: { latitude: 37.4599, longitude: 126.4425 }, heading: 330, size: 'MEDIUM' },
  ],

  sids: [
    {
      id: 'BOPTA1A',
      name: 'BOPTA 1A',
      type: 'SID',
      runway: '33L',
      waypoints: [
        { name: 'RKSI', position: { latitude: 37.4691, longitude: 126.4505 }, flyover: true },
        { name: 'IC510', position: { latitude: 37.5000, longitude: 126.4500 }, altitude: { type: 'ABOVE', value: 3000 }, flyover: false },
        { name: 'IC512', position: { latitude: 37.5500, longitude: 126.4300 }, altitude: { type: 'ABOVE', value: 6000 }, flyover: false },
        { name: 'BOPTA', position: { latitude: 37.6200, longitude: 126.3800 }, altitude: { type: 'ABOVE', value: 10000 }, flyover: true },
      ],
    },
    {
      id: 'KARBU1A',
      name: 'KARBU 1A',
      type: 'SID',
      runway: '33R',
      waypoints: [
        { name: 'RKSI', position: { latitude: 37.4691, longitude: 126.4505 }, flyover: true },
        { name: 'IC520', position: { latitude: 37.5000, longitude: 126.4800 }, altitude: { type: 'ABOVE', value: 3000 }, flyover: false },
        { name: 'IC522', position: { latitude: 37.5600, longitude: 126.5200 }, altitude: { type: 'ABOVE', value: 7000 }, flyover: false },
        { name: 'KARBU', position: { latitude: 37.6500, longitude: 126.5800 }, altitude: { type: 'ABOVE', value: 11000 }, flyover: true },
      ],
    },
    {
      id: 'OLMEN1A',
      name: 'OLMEN 1A',
      type: 'SID',
      runway: '33L',
      waypoints: [
        { name: 'RKSI', position: { latitude: 37.4691, longitude: 126.4505 }, flyover: true },
        { name: 'IC510', position: { latitude: 37.5000, longitude: 126.4500 }, altitude: { type: 'ABOVE', value: 3000 }, flyover: false },
        { name: 'OLMEN', position: { latitude: 37.5800, longitude: 126.3200 }, altitude: { type: 'ABOVE', value: 8000 }, flyover: true },
      ],
    },
  ],

  stars: [
    {
      id: 'REBIT1B',
      name: 'REBIT 1B',
      type: 'STAR',
      runway: '33L',
      waypoints: [
        { name: 'REBIT', position: { latitude: 37.2500, longitude: 126.8000 }, altitude: { type: 'BELOW', value: 15000 }, flyover: true },
        { name: 'IC801', position: { latitude: 37.3200, longitude: 126.6500 }, altitude: { type: 'BELOW', value: 11000 }, flyover: false },
        { name: 'IC802', position: { latitude: 37.3800, longitude: 126.5500 }, altitude: { type: 'BELOW', value: 7000 }, flyover: false },
        { name: 'IC803', position: { latitude: 37.4200, longitude: 126.4800 }, altitude: { type: 'AT', value: 3000 }, flyover: false },
      ],
    },
    {
      id: 'GUKDO1B',
      name: 'GUKDO 1B',
      type: 'STAR',
      runway: '33R',
      waypoints: [
        { name: 'GUKDO', position: { latitude: 37.1500, longitude: 126.5000 }, altitude: { type: 'BELOW', value: 16000 }, flyover: true },
        { name: 'IC811', position: { latitude: 37.2500, longitude: 126.4800 }, altitude: { type: 'BELOW', value: 12000 }, flyover: false },
        { name: 'IC812', position: { latitude: 37.3500, longitude: 126.4600 }, altitude: { type: 'BELOW', value: 8000 }, flyover: false },
        { name: 'IC813', position: { latitude: 37.4000, longitude: 126.4550 }, altitude: { type: 'AT', value: 3000 }, flyover: false },
      ],
    },
  ],

  holdingPatterns: [
    {
      fix: 'BOPTA',
      position: { latitude: 37.6200, longitude: 126.3800 },
      altitude: 10000,
      direction: 'RIGHT',
      legTime: 1,
      inboundCourse: 150,
    },
    {
      fix: 'GUKDO',
      position: { latitude: 37.1500, longitude: 126.5000 },
      altitude: 15000,
      direction: 'RIGHT',
      legTime: 1,
      inboundCourse: 330,
    },
    {
      fix: 'REBIT',
      position: { latitude: 37.2500, longitude: 126.8000 },
      altitude: 14000,
      direction: 'LEFT',
      legTime: 1,
      inboundCourse: 300,
    },
  ],
};

export default RKSI;
