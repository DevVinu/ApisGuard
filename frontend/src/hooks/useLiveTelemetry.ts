import { useEffect, useState } from 'react';
import { fetchAlerts, fetchLatestTelemetry, resolveAlert } from '../services/api';
import { getSocket } from '../services/socket';
import type { HiveAlert, LiveTelemetry } from '../types/telemetry';

export function useLiveTelemetry() {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [alerts, setAlerts] = useState<HiveAlert[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      const [latestRes, alertsRes] = await Promise.allSettled([
        fetchLatestTelemetry(),
        fetchAlerts(),
      ]);
      if (!mounted) return;

      if (latestRes.status === 'fulfilled') {
        setTelemetry(latestRes.value);
        setIsBackendConnected(true);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value);
        setIsBackendConnected(true);
      }
    }

    loadInitial();

    const socket = getSocket();

    const handleConnect = () => setIsBackendConnected(true);
    const handleDisconnect = () => setIsBackendConnected(false);
    const handleTelemetry = (payload: LiveTelemetry) => setTelemetry(payload);
    const handleAlert = (alert: HiveAlert) => {
      setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('telemetry:update', handleTelemetry);
    socket.on('alert:new', handleAlert);

    return () => {
      mounted = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('telemetry:update', handleTelemetry);
      socket.off('alert:new', handleAlert);
    };
  }, []);

  const dismissAlert = async (alertId: number) => {
    setAlerts((prev) => prev.filter((item) => item.id !== alertId));
    try {
      await resolveAlert(alertId);
    } catch {
      // Ignore if backend is offline.
    }
  };

  return {
    telemetry,
    alerts,
    isBackendConnected,
    dismissAlert,
  };
}
