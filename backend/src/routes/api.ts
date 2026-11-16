import { Router } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import { checkDatabaseConnection } from '../db/mysql.js';
import { isMqttConnected, publishMqtt } from '../mqtt/client.js';
import {
  getActiveAlerts,
  getActuatorsState,
  getHistoricalTelemetry,
  getLatestTelemetry,
  getRecentLogs,
  getSettings,
  logActuatorCommand,
  resolveAlertById,
  updateActuatorInDb,
} from '../services/store.js';
import type { ActuatorCommandPayload } from '../types/index.js';

export function createApiRouter(io: SocketIOServer): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const dbOk = await checkDatabaseConnection();
    res.json({
      status: 'ok',
      mysql: dbOk ? 'connected' : 'disconnected',
      mqtt: isMqttConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/telemetry/latest', async (_req, res) => {
    const latest = await getLatestTelemetry();
    if (!latest) {
      res.status(404).json({ message: 'No telemetry recorded yet' });
      return;
    }
    res.json(latest);
  });

  router.get('/telemetry/history', async (req, res) => {
    const hours = Math.min(168, Math.max(1, Number(req.query.hours || 24)));
    const points = await getHistoricalTelemetry(hours);
    res.json(points);
  });

  router.get('/actuators', async (_req, res) => {
    const state = await getActuatorsState();
    res.json(state);
  });

  router.post('/actuators/command', async (req, res) => {
    const payload = req.body as ActuatorCommandPayload;
    if (!payload || !payload.actions) {
      res.status(400).json({ message: 'Invalid actuator command payload' });
      return;
    }

    publishMqtt('apisguard/actuators/set', payload);

    const { entranceGate, syrupDispenser } = payload.actions;

    if (entranceGate) {
      await updateActuatorInDb('entrance_gate', entranceGate.position);
      await logActuatorCommand(
        'entrance_gate',
        'manual_web',
        `Entrance gate set to ${entranceGate.position} (${entranceGate.angle}°)`
      );
    }

    if (syrupDispenser) {
      const isAuto = syrupDispenser.mode === 'AUTO';
      await updateActuatorInDb(
        'syrup_dispenser',
        syrupDispenser.dispense ? 'DISPENSING' : 'OFF',
        isAuto
      );
      await logActuatorCommand(
        'syrup_dispenser',
        'manual_web',
        syrupDispenser.dispense
          ? `Manual Type 3 syrup pump dispense (${syrupDispenser.durationSec}s)`
          : `Sugar syrup auto-feed set to ${syrupDispenser.mode}`
      );
    }

    const updated = await getActuatorsState();
    io.emit('actuators:ack', updated);
    res.json({ ok: true, actuators: updated });
  });

  router.get('/alerts', async (_req, res) => {
    const alerts = await getActiveAlerts();
    res.json(alerts);
  });

  router.patch('/alerts/:id/resolve', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ message: 'Invalid alert ID' });
      return;
    }
    await resolveAlertById(id);
    res.json({ ok: true });
  });

  router.get('/logs', async (_req, res) => {
    const logs = await getRecentLogs();
    res.json(logs);
  });

  router.get('/settings', async (_req, res) => {
    const settings = await getSettings();
    res.json(settings);
  });

  return router;
}
