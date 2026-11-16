export interface ThermalProbes {
  top: number;
  middle: number;
  bottom: number;
}

export interface MotionState {
  tiltDeg: number;
  theftAlert: boolean;
  fallDetected: boolean;
}

export interface TelemetryMetrics {
  temperature: number;
  humidity: number;
  thermalProbes: ThermalProbes;
  weightKg: number;
  dailyWeightDeltaKg: number;
  harvestReady: boolean;
  beesIn: number;
  beesOut: number;
  motion: MotionState;
}

export interface TelemetryLocation {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  satellites: number;
  isGeofenceSafe: boolean;
}

export interface DeviceStatus {
  batteryPct: number;
  batteryVoltage: number;
  batteryCurrentMa: number;
  wifiRssi: number;
  online: boolean;
}

export interface LiveTelemetry {
  timestamp: number;
  metrics: TelemetryMetrics;
  location: TelemetryLocation;
  device: DeviceStatus;
}

export interface HistoricalPoint {
  recordedAt: string;
  label: string;
  weightKg: number;
  temperature: number;
  humidity: number;
  tempTop: number;
  tempMiddle: number;
  tempBottom: number;
  beesIn: number;
  beesOut: number;
}

export type AlertType =
  | 'HIGH_TEMP'
  | 'LOW_TEMP'
  | 'THEFT_TAMPER'
  | 'HIVE_FALL'
  | 'RAPID_WEIGHT_LOSS'
  | 'HARVEST_READY'
  | 'GEOFENCE_BREACH'
  | 'LOW_BATTERY';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface HiveAlert {
  id: number;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  category: 'alert' | 'actuator' | 'system';
  message: string;
  status?: 'sent' | 'acknowledged' | 'failed';
}
