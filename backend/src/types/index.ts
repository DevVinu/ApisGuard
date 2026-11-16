export type GatePosition = 'OPEN' | 'GUARD_MODE' | 'CLOSED';
export type ControlMode = 'AUTO' | 'MANUAL';

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

export interface LiveTelemetry {
  timestamp: number;
  metrics: {
    temperature: number;
    humidity: number;
    thermalProbes: ThermalProbes;
    weightKg: number;
    dailyWeightDeltaKg: number;
    harvestReady: boolean;
    beesIn: number;
    beesOut: number;
    motion: MotionState;
  };
  location: {
    latitude: number;
    longitude: number;
    altitudeMeters: number;
    satellites: number;
    isGeofenceSafe: boolean;
  };
  device: {
    batteryPct: number;
    batteryVoltage: number;
    batteryCurrentMa: number;
    wifiRssi: number;
    online: boolean;
  };
}

export interface IncomingTelemetryMqtt {
  timestamp?: number;
  metrics: {
    temperature: number;
    humidity: number;
    thermalProbes?: ThermalProbes;
    weightKg: number;
    beesIn?: number;
    beesOut?: number;
    motion?: Partial<MotionState>;
  };
  location: {
    latitude: number;
    longitude: number;
    altitudeMeters: number;
    satellites: number;
    isGeofenceSafe?: boolean;
  };
  device: {
    batteryPct: number;
    batteryVoltage: number;
    batteryCurrentMa?: number;
    wifiRssi: number;
  };
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

export interface ActuatorState {
  entranceGate: {
    position: GatePosition;
    angle: number;
  };
  syrupDispenser: {
    isDispensing: boolean;
    mode: ControlMode;
    durationSec: number;
    lastDispensedAt: string | null;
  };
}

export interface ActuatorCommandPayload {
  commandId: string;
  timestamp: number;
  actions: Partial<{
    entranceGate: { position: GatePosition; angle: number };
    syrupDispenser: { dispense: boolean; durationSec: number; mode: ControlMode };
  }>;
}

export interface HiveSettings {
  homeLatitude: number;
  homeLongitude: number;
  geofenceRadiusMeters: number;
  maxTempThreshold: number;
  rapidWeightLossKg: number;
  harvestWeightKg: number;
  scaleTareOffset: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  category: 'alert' | 'actuator' | 'system';
  message: string;
  status?: 'sent' | 'acknowledged' | 'failed';
}
