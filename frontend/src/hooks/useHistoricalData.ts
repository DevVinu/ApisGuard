import { useEffect, useState } from 'react';
import { fetchHistoricalTelemetry } from '../services/api';
import { getSocket } from '../services/socket';
import type { HistoricalPoint, LiveTelemetry } from '../types/telemetry';

export function useHistoricalData(hours = 24) {
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    fetchHistoricalTelemetry(hours)
      .then((points) => {
        if (mounted) {
          setHistory(points);
        }
      })
      .catch(() => {
        if (mounted) setHistory([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const socket = getSocket();
    const handleLivePoint = (t: LiveTelemetry) => {
      const date = new Date(t.timestamp * 1000);
      const nextPoint: HistoricalPoint = {
        recordedAt: date.toISOString(),
        label: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weightKg: t.metrics.weightKg,
        temperature: t.metrics.temperature,
        humidity: t.metrics.humidity,
        tempTop: t.metrics.thermalProbes.top,
        tempMiddle: t.metrics.thermalProbes.middle,
        tempBottom: t.metrics.thermalProbes.bottom,
        beesIn: t.metrics.beesIn,
        beesOut: t.metrics.beesOut,
      };
      setHistory((prev) => [...prev.slice(-299), nextPoint]);
    };

    socket.on('telemetry:update', handleLivePoint);

    return () => {
      mounted = false;
      socket.off('telemetry:update', handleLivePoint);
    };
  }, [hours]);

  return { history, isLoading };
}
