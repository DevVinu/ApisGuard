import { useEffect, useState } from 'react';
import { buildFallback24hHistory } from '../data/mockHiveData';
import { fetchHistoricalTelemetry } from '../services/api';
import type { HistoricalPoint } from '../types/telemetry';

export function useHistoricalData(hours = 24) {
  const [history, setHistory] = useState<HistoricalPoint[]>(() => buildFallback24hHistory());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    fetchHistoricalTelemetry(hours)
      .then((points) => {
        if (mounted && points.length > 0) {
          setHistory(points);
        }
      })
      .catch(() => {
        // Keep generated 24h fallback series when backend is unavailable.
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [hours]);

  return { history, isLoading };
}
