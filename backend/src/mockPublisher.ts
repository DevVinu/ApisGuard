import mqtt from 'mqtt';
import { env } from './config/env.js';

const client = mqtt.connect(env.mqtt.url, {
  username: env.mqtt.username,
  password: env.mqtt.password,
});

let weightKg = 3.85;
let beesIn = 42;
let beesOut = 38;

client.on('connect', () => {
  console.log(`[MockESP32] Connected to ${env.mqtt.url}. Publishing every 5s...`);

  const sendSample = () => {
    const tempMiddle = Number((34.9 + (Math.random() - 0.5) * 0.6).toFixed(2));
    beesIn += Math.floor(Math.random() * 4);
    beesOut += Math.floor(Math.random() * 4);

    const payload = {
      timestamp: Math.floor(Date.now() / 1000),
      metrics: {
        temperature: tempMiddle,
        humidity: Number((58.5 + (Math.random() - 0.5) * 2.0).toFixed(1)),
        thermalProbes: {
          top: Number((tempMiddle + 0.7).toFixed(2)),
          middle: tempMiddle,
          bottom: Number((tempMiddle - 1.5).toFixed(2)),
        },
        weightKg: Number(
          Math.min(5.0, Math.max(0.2, weightKg + (Math.random() - 0.45) * 0.04)).toFixed(2)
        ),
        beesIn,
        beesOut,
        motion: {
          tiltDeg: Number((Math.random() * 1.8).toFixed(1)),
          theftAlert: false,
          fallDetected: false,
        },
      },
      location: {
        latitude: 6.927079,
        longitude: 79.861244,
        altitudeMeters: 14.5,
        satellites: 9,
      },
      device: {
        batteryPct: 92,
        batteryVoltage: 12.42,
        batteryCurrentMa: 215,
        wifiRssi: -64,
      },
    };

    weightKg = payload.metrics.weightKg;
    client.publish('apisguard/telemetry', JSON.stringify(payload));
    console.log('[MockESP32] Sent telemetry:', payload.metrics);
  };

  sendSample();
  setInterval(sendSample, 5000);
});
