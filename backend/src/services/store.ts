import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/mysql.js';
import type {
  ActivityLogEntry,
  ActuatorState,
  AlertSeverity,
  AlertType,
  GatePosition,
  HistoricalPoint,
  HiveAlert,
  HiveSettings,
  LiveTelemetry,
} from '../types/index.js';

const GATE_ANGLES: Record<GatePosition, number> = {
  OPEN: 0,
  GUARD_MODE: 45,
  CLOSED: 90,
};

const defaultSettings: HiveSettings = {
  homeLatitude: 6.927079,
  homeLongitude: 79.861244,
  geofenceRadiusMeters: 50,
  maxTempThreshold: 36.0,
  rapidWeightLossKg: 0.5,
  harvestWeightKg: 4.2,
  scaleTareOffset: 0,
};

let memoryActuators: ActuatorState = {
  entranceGate: { position: 'OPEN', angle: 0 },
  syrupDispenser: {
    isDispensing: false,
    mode: 'AUTO',
    durationSec: 5,
    lastDispensedAt: null,
  },
};

let memoryLatestTelemetry: LiveTelemetry | null = null;
const memoryHistory: HistoricalPoint[] = [];
const memoryAlerts: HiveAlert[] = [];
const memoryLogs: ActivityLogEntry[] = [];
let nextAlertId = 1;

function formatLabel(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function getSettings(): Promise<HiveSettings> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT setting_key, setting_value FROM settings'
    );
    const map = new Map(rows.map((r) => [String(r.setting_key), String(r.setting_value)]));
    return {
      homeLatitude: Number(map.get('home_latitude') ?? defaultSettings.homeLatitude),
      homeLongitude: Number(map.get('home_longitude') ?? defaultSettings.homeLongitude),
      geofenceRadiusMeters: Number(
        map.get('geofence_radius_meters') ?? defaultSettings.geofenceRadiusMeters
      ),
      maxTempThreshold: Number(map.get('max_temp_threshold') ?? defaultSettings.maxTempThreshold),
      rapidWeightLossKg: Number(
        map.get('rapid_weight_loss_kg') ?? defaultSettings.rapidWeightLossKg
      ),
      harvestWeightKg: Number(
        map.get('harvest_weight_kg') ?? defaultSettings.harvestWeightKg
      ),
      scaleTareOffset: Number(map.get('scale_tare_offset') ?? defaultSettings.scaleTareOffset),
    };
  } catch {
    return defaultSettings;
  }
}

export async function get24hBaselineWeight(): Promise<number | null> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT weight_kg FROM telemetry
       WHERE recorded_at >= NOW() - INTERVAL 24 HOUR
       ORDER BY recorded_at ASC
       LIMIT 1`
    );
    if (rows.length > 0 && rows[0].weight_kg !== null) {
      return Number(rows[0].weight_kg);
    }
    return null;
  } catch {
    return memoryHistory.length > 0 ? memoryHistory[0].weightKg : null;
  }
}

export async function getPreviousWeight(): Promise<number | null> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT weight_kg FROM telemetry ORDER BY recorded_at DESC LIMIT 1'
    );
    if (rows.length > 0 && rows[0].weight_kg !== null) {
      return Number(rows[0].weight_kg);
    }
    return null;
  } catch {
    return memoryLatestTelemetry ? memoryLatestTelemetry.metrics.weightKg : null;
  }
}

export async function saveTelemetry(telemetry: LiveTelemetry): Promise<void> {
  memoryLatestTelemetry = telemetry;
  const recordedIso = new Date(telemetry.timestamp * 1000).toISOString();
  memoryHistory.push({
    recordedAt: recordedIso,
    label: formatLabel(recordedIso),
    weightKg: telemetry.metrics.weightKg,
    temperature: telemetry.metrics.temperature,
    humidity: telemetry.metrics.humidity,
    tempTop: telemetry.metrics.thermalProbes.top,
    tempMiddle: telemetry.metrics.thermalProbes.middle,
    tempBottom: telemetry.metrics.thermalProbes.bottom,
    beesIn: telemetry.metrics.beesIn,
    beesOut: telemetry.metrics.beesOut,
  });
  if (memoryHistory.length > 500) memoryHistory.shift();

  try {
    await pool.query(
      `INSERT INTO telemetry (
        temperature, humidity,
        temp_top, temp_middle, temp_bottom,
        weight_kg, bees_in, bees_out,
        tilt_deg, theft_alert, fall_detected,
        latitude, longitude, altitude_meters, satellites_connected,
        battery_pct, battery_voltage, battery_current_ma, wifi_rssi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        telemetry.metrics.temperature,
        telemetry.metrics.humidity,
        telemetry.metrics.thermalProbes.top,
        telemetry.metrics.thermalProbes.middle,
        telemetry.metrics.thermalProbes.bottom,
        telemetry.metrics.weightKg,
        telemetry.metrics.beesIn,
        telemetry.metrics.beesOut,
        telemetry.metrics.motion.tiltDeg,
        telemetry.metrics.motion.theftAlert,
        telemetry.metrics.motion.fallDetected,
        telemetry.location.latitude,
        telemetry.location.longitude,
        telemetry.location.altitudeMeters,
        telemetry.location.satellites,
        telemetry.device.batteryPct,
        telemetry.device.batteryVoltage,
        telemetry.device.batteryCurrentMa,
        telemetry.device.wifiRssi,
      ]
    );
  } catch {
    // Fallback remains in memory if MySQL is offline.
  }
}

export async function getLatestTelemetry(): Promise<LiveTelemetry | null> {
  if (memoryLatestTelemetry) return memoryLatestTelemetry;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM telemetry ORDER BY recorded_at DESC LIMIT 1'
    );
    if (rows.length === 0) return null;

    const r = rows[0];
    const [baseline, settings] = await Promise.all([get24hBaselineWeight(), getSettings()]);
    const weightKg = Number(r.weight_kg ?? 0);
    const dailyWeightDeltaKg =
      baseline !== null ? Number((weightKg - baseline).toFixed(2)) : 0;
    const temp = Number(r.temperature ?? 0);

    return {
      timestamp: Math.floor(new Date(r.recorded_at).getTime() / 1000),
      metrics: {
        temperature: temp,
        humidity: Number(r.humidity ?? 0),
        thermalProbes: {
          top: Number(r.temp_top ?? temp),
          middle: Number(r.temp_middle ?? temp),
          bottom: Number(r.temp_bottom ?? temp),
        },
        weightKg,
        dailyWeightDeltaKg,
        harvestReady: weightKg >= settings.harvestWeightKg,
        beesIn: Number(r.bees_in ?? 0),
        beesOut: Number(r.bees_out ?? 0),
        motion: {
          tiltDeg: Number(r.tilt_deg ?? 0),
          theftAlert: Boolean(r.theft_alert),
          fallDetected: Boolean(r.fall_detected),
        },
      },
      location: {
        latitude: Number(r.latitude ?? 0),
        longitude: Number(r.longitude ?? 0),
        altitudeMeters: Number(r.altitude_meters ?? 0),
        satellites: Number(r.satellites_connected ?? 0),
        isGeofenceSafe: true,
      },
      device: {
        batteryPct: Number(r.battery_pct ?? 0),
        batteryVoltage: Number(r.battery_voltage ?? 0),
        batteryCurrentMa: Number(r.battery_current_ma ?? 0),
        wifiRssi: Number(r.wifi_rssi ?? -70),
        online: true,
      },
    };
  } catch {
    return null;
  }
}

export async function getHistoricalTelemetry(hours = 24): Promise<HistoricalPoint[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT recorded_at, weight_kg, temperature, humidity,
              temp_top, temp_middle, temp_bottom, bees_in, bees_out
       FROM telemetry
       WHERE recorded_at >= NOW() - INTERVAL ? HOUR
       ORDER BY recorded_at ASC`,
      [hours]
    );
    if (rows.length === 0) return memoryHistory;

    return rows.map((r) => {
      const temp = Number(r.temperature ?? 0);
      return {
        recordedAt: new Date(r.recorded_at).toISOString(),
        label: formatLabel(r.recorded_at),
        weightKg: Number(r.weight_kg ?? 0),
        temperature: temp,
        humidity: Number(r.humidity ?? 0),
        tempTop: Number(r.temp_top ?? temp),
        tempMiddle: Number(r.temp_middle ?? temp),
        tempBottom: Number(r.temp_bottom ?? temp),
        beesIn: Number(r.bees_in ?? 0),
        beesOut: Number(r.bees_out ?? 0),
      };
    });
  } catch {
    return memoryHistory;
  }
}

export async function getActuatorsState(): Promise<ActuatorState> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT type, current_state, is_auto_mode, updated_at FROM actuators'
    );
    if (rows.length === 0) return memoryActuators;

    const state: ActuatorState = {
      entranceGate: { ...memoryActuators.entranceGate },
      syrupDispenser: { ...memoryActuators.syrupDispenser },
    };

    for (const row of rows) {
      if (row.type === 'entrance_gate') {
        const pos = (row.current_state as GatePosition) || 'OPEN';
        state.entranceGate = {
          position: pos,
          angle: GATE_ANGLES[pos] ?? 0,
        };
      } else if (row.type === 'syrup_dispenser') {
        state.syrupDispenser = {
          ...state.syrupDispenser,
          isDispensing: row.current_state === 'DISPENSING',
          mode: row.is_auto_mode ? 'AUTO' : 'MANUAL',
        };
      }
    }

    memoryActuators = state;
    return state;
  } catch {
    return memoryActuators;
  }
}

export async function updateActuatorInDb(
  type: 'entrance_gate' | 'syrup_dispenser',
  currentState: string,
  isAutoMode?: boolean
): Promise<void> {
  if (type === 'entrance_gate') {
    const pos = currentState as GatePosition;
    memoryActuators.entranceGate = { position: pos, angle: GATE_ANGLES[pos] ?? 0 };
  } else if (type === 'syrup_dispenser') {
    memoryActuators.syrupDispenser = {
      ...memoryActuators.syrupDispenser,
      isDispensing: currentState === 'DISPENSING',
      mode:
        typeof isAutoMode === 'boolean'
          ? isAutoMode
            ? 'AUTO'
            : 'MANUAL'
          : memoryActuators.syrupDispenser.mode,
      lastDispensedAt:
        currentState === 'DISPENSING'
          ? new Date().toISOString()
          : memoryActuators.syrupDispenser.lastDispensedAt,
    };
  }

  try {
    if (typeof isAutoMode === 'boolean') {
      await pool.query(
        'UPDATE actuators SET current_state = ?, is_auto_mode = ? WHERE type = ?',
        [currentState, isAutoMode, type]
      );
    } else {
      await pool.query('UPDATE actuators SET current_state = ? WHERE type = ?', [
        currentState,
        type,
      ]);
    }
  } catch {
    // In-memory state stays updated when DB is offline.
  }
}

export async function logActuatorCommand(
  actuatorType: 'entrance_gate' | 'syrup_dispenser',
  triggeredBy: 'manual_web' | 'auto_rule',
  commandDetails: string,
  status: 'sent' | 'acknowledged' | 'failed' = 'sent'
): Promise<void> {
  memoryLogs.unshift({
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    category: 'actuator',
    message: commandDetails,
    status,
  });
  if (memoryLogs.length > 100) memoryLogs.pop();

  try {
    await pool.query(
      `INSERT INTO actuator_logs (actuator_type, triggered_by, command_details, status)
       VALUES (?, ?, ?, ?)`,
      [actuatorType, triggeredBy, commandDetails, status]
    );
  } catch {
    // Memory log remains available when DB is offline.
  }
}

export async function createAlert(
  alertType: AlertType,
  severity: AlertSeverity,
  message: string
): Promise<HiveAlert | null> {
  // Deduplicate unresolved alerts of the same type so telemetry bursts don't spam DB.
  const existingMem = memoryAlerts.find(
    (a) => a.alertType === alertType && !a.isResolved
  );
  if (existingMem) return null;

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM alerts WHERE alert_type = ? AND is_resolved = FALSE LIMIT 1',
      [alertType]
    );
    if (existing.length > 0) return null;

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO alerts (alert_type, severity, message) VALUES (?, ?, ?)',
      [alertType, severity, message]
    );
    const created: HiveAlert = {
      id: result.insertId,
      alertType,
      severity,
      message,
      isResolved: false,
      createdAt: new Date().toISOString(),
    };
    memoryAlerts.unshift(created);
    return created;
  } catch {
    const created: HiveAlert = {
      id: nextAlertId++,
      alertType,
      severity,
      message,
      isResolved: false,
      createdAt: new Date().toISOString(),
    };
    memoryAlerts.unshift(created);
    return created;
  }
}

export async function getActiveAlerts(): Promise<HiveAlert[]> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM alerts WHERE is_resolved = FALSE ORDER BY created_at DESC'
    );
    return rows.map((r) => ({
      id: Number(r.id),
      alertType: r.alert_type as AlertType,
      severity: r.severity as AlertSeverity,
      message: String(r.message),
      isResolved: Boolean(r.is_resolved),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  } catch {
    return memoryAlerts.filter((a) => !a.isResolved);
  }
}

export async function resolveAlertById(alertId: number): Promise<void> {
  const target = memoryAlerts.find((a) => a.id === alertId);
  if (target) target.isResolved = true;

  try {
    await pool.query('UPDATE alerts SET is_resolved = TRUE WHERE id = ?', [alertId]);
  } catch {
    // In-memory resolution already applied.
  }
}

export async function getRecentLogs(): Promise<ActivityLogEntry[]> {
  try {
    const [actRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, command_details, status, executed_at FROM actuator_logs ORDER BY executed_at DESC LIMIT 30'
    );
    const [alertRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, alert_type, message, is_resolved, created_at FROM alerts ORDER BY created_at DESC LIMIT 20'
    );

    const combined: ActivityLogEntry[] = [
      ...actRows.map((r) => ({
        id: `act-${r.id}`,
        timestamp: new Date(r.executed_at).toISOString(),
        category: 'actuator' as const,
        message: String(r.command_details),
        status: r.status as 'sent' | 'acknowledged' | 'failed',
      })),
      ...alertRows.map((r) => ({
        id: `alert-${r.id}`,
        timestamp: new Date(r.created_at).toISOString(),
        category: 'alert' as const,
        message: `${r.alert_type}: ${r.message}`,
        status: (r.is_resolved ? 'acknowledged' : 'sent') as 'acknowledged' | 'sent',
      })),
    ];

    combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return combined;
  } catch {
    return memoryLogs;
  }
}
