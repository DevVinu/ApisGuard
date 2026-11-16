import { useEffect, useState } from 'react';
import { INITIAL_ALERTS, INITIAL_TELEMETRY } from '../data/mockHiveData';
import { fetchAlerts, fetchLatestTelemetry, resolveAlert } from '../services/api';
import { getSocket } from '../services/socket';
import type { HiveAlert, LiveTelemetry } from '../types/telemetry';

export function useLiveTelemetry() {
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(INITIAL_TELEMETRY);
  const [alerts, setAlerts] = useState<HiveAlert[]>(INITIAL_ALERTS);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const [latest, activeAlerts] = await Promise.all([
          fetchLatestTelemetry(),
          fetchAlerts(),
        ]);
        if (!mounted) return;
        setTelemetry(latest);
        setAlerts(activeAlerts);
        setIsBackendConnected(true);
      } catch {
        // Backend not running yet; keep demo telemetry active so the UI remains usable.
        if (mounted) setIsBackendConnected(false);
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
      // Local dismissal still applies in offline/preview mode.
    }
  };

  return {
    telemetry,
    alerts,
    isBackendConnected,
    dismissAlert,
  };
}
