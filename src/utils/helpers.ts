// ============================================================
// Electronic Flight Strip - Utility Helpers
// ============================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Format UTC time in HHMM format (ATC standard)
 */
export function formatZuluTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}${minutes}Z`;
}

/**
 * Format UTC time in HH:MM:SS format
 */
export function formatZuluTimeLong(date: Date): string {
  return date.toISOString().slice(11, 19) + 'Z';
}

/**
 * Parse HHMM time string to Date (assuming today, UTC)
 */
export function parseZuluTime(time: string): Date {
  const hours = parseInt(time.slice(0, 2), 10);
  const minutes = parseInt(time.slice(2, 4), 10);

  const now = new Date();
  const result = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours,
    minutes,
    0
  ));

  return result;
}

/**
 * Format flight level (altitude / 100)
 */
export function formatFlightLevel(altitude: number): string {
  if (altitude < 10000) {
    return altitude.toString();
  }
  return `FL${Math.round(altitude / 100)}`;
}

/**
 * Parse flight level string to altitude
 */
export function parseFlightLevel(fl: string): number {
  if (fl.startsWith('FL')) {
    return parseInt(fl.slice(2), 10) * 100;
  }
  if (fl.startsWith('A')) {
    return parseInt(fl.slice(1), 10) * 100;
  }
  return parseInt(fl, 10);
}

/**
 * Format speed with unit
 */
export function formatSpeed(speed: number, unit: 'KT' | 'MACH' = 'KT'): string {
  if (unit === 'MACH') {
    return `M${(speed / 100).toFixed(2).slice(1)}`;
  }
  return `${speed}KT`;
}

/**
 * Calculate time difference in minutes
 */
export function timeDiffMinutes(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60000);
}

/**
 * Format time difference as +/- minutes
 */
export function formatTimeDiff(minutes: number): string {
  if (minutes === 0) return 'ON TIME';
  const sign = minutes > 0 ? '+' : '';
  return `${sign}${minutes}min`;
}

/**
 * Calculate distance between two coordinates (in nautical miles)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing between two coordinates (in degrees)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Generate squawk code (4-digit octal)
 */
export function generateSquawk(): string {
  // Avoid special codes: 7500, 7600, 7700
  const code = Math.floor(Math.random() * 4096);
  let octal = code.toString(8).padStart(4, '0');

  // Check for special codes
  if (['7500', '7600', '7700'].includes(octal)) {
    return generateSquawk(); // Regenerate
  }

  return octal;
}

/**
 * Validate squawk code
 */
export function isValidSquawk(squawk: string): boolean {
  if (squawk.length !== 4) return false;
  return /^[0-7]{4}$/.test(squawk);
}

/**
 * Format callsign with proper spacing
 */
export function formatCallsign(callsign: string): string {
  // Add space between airline code and flight number
  const match = callsign.match(/^([A-Z]{2,3})(\d+[A-Z]?)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return callsign;
}

/**
 * Parse callsign to airline and flight number
 */
export function parseCallsign(callsign: string): { airline: string; flight: string } {
  const normalized = callsign.replace(/\s+/g, '');
  const match = normalized.match(/^([A-Z]{2,3})(\d+[A-Z]?)$/);

  if (match) {
    return { airline: match[1], flight: match[2] };
  }

  return { airline: '', flight: callsign };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
