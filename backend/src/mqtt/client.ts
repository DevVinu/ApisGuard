import mqtt, { type MqttClient } from 'mqtt';
import type { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env.js';
import { processIncomingTelemetry } from '../services/automation.js';
import { getActuatorsState, updateActuatorInDb } from '../services/store.js';
import type { GatePosition, IncomingTelemetryMqtt } from '../types/index.js';

let client: MqttClient | null = null;
let mqttConnected = false;

export function isMqttConnected(): boolean {
  return mqttConnected;
}

export function publishMqtt(topic: string, payload: unknown): void {
  if (!client || !mqttConnected) {
    console.warn(`[MQTT] Cannot publish to ${topic}; broker not connected.`);
    return;
  }
  client.publish(topic, JSON.stringify(payload));
}

export function initMqtt(io: SocketIOServer): MqttClient {
  client = mqtt.connect(env.mqtt.url, {
    username: env.mqtt.username,
    password: env.mqtt.password,
    reconnectPeriod: 5000,
    connectTimeout: 4000,
  });

  client.on('connect', () => {
    mqttConnected = true;
    console.log(`[MQTT] Connected to ${env.mqtt.url}`);
    client?.subscribe([
      'apisguard/telemetry',
      'apisguard/status',
      'apisguard/actuators/ack',
      'apisguard/alerts',
    ]);
  });

  client.on('close', () => {
    mqttConnected = false;
  });

  client.on('error', (err) => {
    mqttConnected = false;
    console.warn(`[MQTT] Connection warning: ${err.message}`);
  });

  client.on('message', async (topic, rawBuffer) => {
    try {
      const parsed = JSON.parse(rawBuffer.toString('utf-8'));

      if (topic === 'apisguard/telemetry') {
        await processIncomingTelemetry(
          parsed as IncomingTelemetryMqtt,
          io,
          publishMqtt
        );
      } else if (topic === 'apisguard/actuators/ack') {
        if (parsed.entranceGate?.position) {
          await updateActuatorInDb(
            'entrance_gate',
            parsed.entranceGate.position as GatePosition
          );
        }
        if (parsed.syrupDispenser) {
          await updateActuatorInDb(
            'syrup_dispenser',
            parsed.syrupDispenser.dispense ? 'DISPENSING' : 'OFF',
            parsed.syrupDispenser.mode === 'AUTO'
          );
        }
        io.emit('actuators:ack', await getActuatorsState());
      }
    } catch (err) {
      console.error(`[MQTT] Failed to handle message on ${topic}:`, err);
    }
  });

  return client;
}
