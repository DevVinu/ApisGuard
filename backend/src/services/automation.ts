import type { Server as SocketIOServer } from 'socket.io';
import type {
  ActuatorCommandPayload,
  HiveAlert,
  IncomingTelemetryMqtt,
  LiveTelemetry,
} from '../types/index.js';
import { calculateDistanceMeters } from './geofence.js';
import {
  createAlert,
  get24hBaselineWeight,
  getActuatorsState,
  getPreviousWeight,
  getSettings,
  logActuatorCommand,
  saveTelemetry,
  updateActuatorInDb,
} from './store.js';

export type MqttPublishFn = (topic: string, payload: unknown) => void;

export async function processIncomingTelemetry(
  raw: IncomingTelemetryMqtt,
  io: SocketIOServer,
  publishMqtt: MqttPublishFn
): Promise<void> {
  const settings = await getSettings();
  const [baselineWeight, previousWeight, actuators] = await Promise.all([
    get24hBaselineWeight(),
    getPreviousWeight(),
    getActuatorsState(),
  ]);

  const distanceMeters = calculateDistanceMeters(
    raw.location.latitude,
    raw.location.longitude,
    settings.homeLatitude,
    settings.homeLongitude
  );
  const isGeofenceSafe = distanceMeters <= settings.geofenceRadiusMeters;
  const weightKg = Number(raw.metrics.weightKg);
  const dailyWeightDeltaKg =
    baselineWeight !== null ? Number((weightKg - baselineWeight).toFixed(2)) : 0;
  const harvestReady = weightKg >= settings.harvestWeightKg;
  const temperature = Number(raw.metrics.temperature);

  const normalized: LiveTelemetry = {
    timestamp: raw.timestamp ?? Math.floor(Date.now() / 1000),
    metrics: {
      temperature,
      humidity: Number(raw.metrics.humidity),
      thermalProbes: raw.metrics.thermalProbes ?? {
        top: temperature,
        middle: temperature,
        bottom: temperature,
      },
      weightKg,
      dailyWeightDeltaKg,
      harvestReady,
      beesIn: Number(raw.metrics.beesIn ?? 0),
      beesOut: Number(raw.metrics.beesOut ?? 0),
      motion: {
        tiltDeg: Number(raw.metrics.motion?.tiltDeg ?? 0),
        theftAlert: Boolean(raw.metrics.motion?.theftAlert ?? false),
        fallDetected: Boolean(raw.metrics.motion?.fallDetected ?? false),
      },
    },
    location: {
      latitude: Number(raw.location.latitude),
      longitude: Number(raw.location.longitude),
      altitudeMeters: Number(raw.location.altitudeMeters),
      satellites: Number(raw.location.satellites),
      isGeofenceSafe,
    },
    device: {
      batteryPct: Number(raw.device.batteryPct),
      batteryVoltage: Number(raw.device.batteryVoltage),
      batteryCurrentMa: Number(raw.device.batteryCurrentMa ?? 0),
      wifiRssi: Number(raw.device.wifiRssi),
      online: true,
    },
  };

  await saveTelemetry(normalized);
  io.emit('telemetry:update', normalized);

  const emitAlert = (alert: HiveAlert | null) => {
    if (!alert) return;
    io.emit('alert:new', alert);
    publishMqtt('apisguard/alerts', alert);
  };

  // Rule 1: High Temperature (DHT22)
  if (normalized.metrics.temperature > settings.maxTempThreshold) {
    emitAlert(
      await createAlert(
        'HIGH_TEMP',
        'warning',
        `Hive temperature reached ${normalized.metrics.temperature.toFixed(1)} °C (threshold ${settings.maxTempThreshold.toFixed(1)} °C).`
      )
    );
  }

  // Rule 2: GPS Geofence Breach (NEO-6M)
  if (!isGeofenceSafe) {
    emitAlert(
      await createAlert(
        'GEOFENCE_BREACH',
        'critical',
        `Hive moved ${distanceMeters.toFixed(1)} m outside safe ${settings.geofenceRadiusMeters} m zone!`
      )
    );
  }

  // Rule 3: MPU6050 Fall & Theft Detection
  if (normalized.metrics.motion.fallDetected) {
    emitAlert(
      await createAlert(
        'HIVE_FALL',
        'critical',
        `Hive fall detected (${normalized.metrics.motion.tiltDeg.toFixed(1)}° tilt on MPU6050)!`
      )
    );
  } else if (normalized.metrics.motion.theftAlert) {
    emitAlert(
      await createAlert(
        'THEFT_TAMPER',
        'critical',
        `Suspicious hive movement/tampering detected (${normalized.metrics.motion.tiltDeg.toFixed(1)}° tilt).`
      )
    );
  }

  // Rule 4: Rapid Weight Loss (HX711 5kg) -> Alert + Auto Type 3 Sugar Syrup Pump
  const dropFromPrev = previousWeight !== null ? previousWeight - weightKg : 0;
  if (dropFromPrev >= settings.rapidWeightLossKg) {
    emitAlert(
      await createAlert(
        'RAPID_WEIGHT_LOSS',
        'warning',
        `Rapid hive weight drop of ${dropFromPrev.toFixed(2)} kg detected.`
      )
    );

    if (actuators.syrupDispenser.mode === 'AUTO') {
      const durationSec = actuators.syrupDispenser.durationSec || 5;
      const autoCommand: ActuatorCommandPayload = {
        commandId: `auto-syrup-${Date.now().toString().slice(-4)}`,
        timestamp: Math.floor(Date.now() / 1000),
        actions: {
          syrupDispenser: {
            dispense: true,
            durationSec,
            mode: 'AUTO',
          },
        },
      };
      publishMqtt('apisguard/actuators/set', autoCommand);
      await updateActuatorInDb('syrup_dispenser', 'DISPENSING', true);
      await logActuatorCommand(
        'syrup_dispenser',
        'auto_rule',
        `Auto-dispensed sugar syrup (${durationSec}s) via Type 3 pump (weight drop ${dropFromPrev.toFixed(2)} kg)`,
        'sent'
      );
      io.emit('actuators:ack', await getActuatorsState());
    }
  }

  // Rule 5: Harvest Time Ready (HX711 5kg load cell)
  if (harvestReady) {
    emitAlert(
      await createAlert(
        'HARVEST_READY',
        'info',
        `Honey harvest threshold reached: ${weightKg.toFixed(2)} kg (>= ${settings.harvestWeightKg.toFixed(2)} kg).`
      )
    );
  }

  // Rule 6: Low Battery (INA219)
  if (normalized.device.batteryPct <= 20) {
    emitAlert(
      await createAlert(
        'LOW_BATTERY',
        'warning',
        `Hive battery low at ${normalized.device.batteryPct}% (${normalized.device.batteryVoltage.toFixed(2)} V, ${normalized.device.batteryCurrentMa.toFixed(0)} mA).`
      )
    );
  }
}
