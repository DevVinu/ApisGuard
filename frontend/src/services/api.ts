import axios from 'axios';
import type { ActuatorCommandPayload, ActuatorState } from '../types/actuator';
import type { HistoricalPoint, HiveAlert, LiveTelemetry } from '../types/telemetry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
});

export async function fetchLatestTelemetry(): Promise<LiveTelemetry> {
  const { data } = await apiClient.get<LiveTelemetry>('/telemetry/latest');
  return data;
}

export async function fetchHistoricalTelemetry(hours = 24): Promise<HistoricalPoint[]> {
  const { data } = await apiClient.get<HistoricalPoint[]>('/telemetry/history', {
    params: { hours },
  });
  return data;
}

export async function fetchActuators(): Promise<ActuatorState> {
  const { data } = await apiClient.get<ActuatorState>('/actuators');
  return data;
}

export async function sendActuatorCommand(payload: ActuatorCommandPayload): Promise<void> {
  await apiClient.post('/actuators/command', payload);
}

export async function fetchAlerts(): Promise<HiveAlert[]> {
  const { data } = await apiClient.get<HiveAlert[]>('/alerts');
  return data;
}

export async function resolveAlert(alertId: number): Promise<void> {
  await apiClient.patch(`/alerts/${alertId}/resolve`);
}
