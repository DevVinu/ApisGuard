import type { ActuatorState } from '../types/actuator';
import type { ActivityLogEntry, HistoricalPoint, HiveAlert, LiveTelemetry } from '../types/telemetry';

export const HOME_COORDINATES = {
  latitude: 6.927079,
  longitude: 79.861244,
  geofenceRadiusMeters: 50,
};

export const HARVEST_THRESHOLD_KG = 4.2;
export const LOAD_CELL_MAX_KG = 5.0;

export const INITIAL_TELEMETRY: LiveTelemetry = {
  timestamp: Math.floor(Date.now() / 1000),
  metrics: {
    temperature: 34.8,
    humidity: 58.2,
    thermalProbes: {
      top: 35.6,
      middle: 34.9,
      bottom: 33.2,
    },
    weightKg: 3.85,
    dailyWeightDeltaKg: 0.24,
    harvestReady: false,
    beesIn: 142,
    beesOut: 136,
    motion: {
      tiltDeg: 0.4,
      theftAlert: false,
      fallDetected: false,
    },
  },
  location: {
    latitude: HOME_COORDINATES.latitude,
    longitude: HOME_COORDINATES.longitude,
    altitudeMeters: 14.5,
    satellites: 9,
    isGeofenceSafe: true,
  },
  device: {
    batteryPct: 92,
    batteryVoltage: 12.42,
    batteryCurrentMa: 215,
    wifiRssi: -65,
    online: true,
  },
};

export const INITIAL_ACTUATORS: ActuatorState = {
  entranceGate: {
    position: 'OPEN',
    angle: 0,
  },
  syrupDispenser: {
    isDispensing: false,
    mode: 'AUTO',
    durationSec: 5,
    lastDispensedAt: null,
  },
};

export const INITIAL_ALERTS: HiveAlert[] = [
  {
    id: 1,
    alertType: 'HIGH_TEMP',
    severity: 'warning',
    message: 'DHT22 temperature reached 36.2 °C earlier — monitor hive shade and airflow.',
    isResolved: false,
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    category: 'alert',
    message: 'High temperature warning triggered (36.2 °C > 36.0 °C threshold)',
    status: 'acknowledged',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    category: 'system',
    message: 'HX711 5kg scale calibration complete (3.61 kg baseline)',
    status: 'acknowledged',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    category: 'actuator',
    message: 'Entrance gate servo set to OPEN for daytime foraging',
    status: 'acknowledged',
  },
];

export function buildFallback24hHistory(): HistoricalPoint[] {
  const now = Date.now();
  const points: HistoricalPoint[] = [];

  for (let i = 23; i >= 0; i -= 1) {
    const t = new Date(now - i * 60 * 60 * 1000);
    const hour = t.getHours();
    const diurnalWave = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const weightGain = ((23 - i) / 23) * 0.35;
    const tempMiddle = Number((34.9 + diurnalWave * 0.45).toFixed(2));
    const tempTop = Number((tempMiddle + 0.7 + diurnalWave * 0.35).toFixed(2));
    const tempBottom = Number((tempMiddle - 1.7 + diurnalWave * 0.8).toFixed(2));

    points.push({
      recordedAt: t.toISOString(),
      label: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weightKg: Number((3.5 + weightGain + Math.sin(i * 0.6) * 0.04).toFixed(2)),
      temperature: tempMiddle,
      humidity: Number((58.5 - diurnalWave * 3.0).toFixed(1)),
      tempTop,
      tempMiddle,
      tempBottom,
      beesIn: Math.max(0, Math.round(90 + diurnalWave * 60 + i * 2)),
      beesOut: Math.max(0, Math.round(85 + diurnalWave * 58 + i * 2)),
    });
  }

  return points;
}
