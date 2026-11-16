import React from 'react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import type { HistoricalPoint, ThermalProbes } from '../types/telemetry';

interface ChartsPageProps {
  history: HistoricalPoint[];
  thermalProbes: ThermalProbes;
  isLoading: boolean;
}

export const ChartsPage: React.FC<ChartsPageProps> = ({
  history,
  thermalProbes,
  isLoading,
}) => {
  const weights = history.map((p) => p.weightKg);
  const temps = history.map((p) => p.temperature);

  const minWeight = weights.length > 0 ? Math.min(...weights).toFixed(2) : '--';
  const maxWeight = weights.length > 0 ? Math.max(...weights).toFixed(2) : '--';
  const minTemp = temps.length > 0 ? Math.min(...temps).toFixed(1) : '--';
  const maxTemp = temps.length > 0 ? Math.max(...temps).toFixed(1) : '--';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-semibold text-white">Analytics &amp; Heat Map</h1>
        <span className="text-xs text-zinc-500">Last 24 Hours</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-zinc-500">3-Level Probes (Top / Mid / Bot)</div>
          <div className="text-sm font-semibold text-white">
            {thermalProbes.top.toFixed(1)}° / {thermalProbes.middle.toFixed(1)}° /{' '}
            {thermalProbes.bottom.toFixed(1)}°C
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-zinc-500">24h DHT22 Temp Range</div>
          <div className="text-sm font-semibold text-emerald-400">
            {minTemp} – {maxTemp} °C
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-zinc-500">24h Weight Range</div>
          <div className="text-sm font-semibold text-amber-400">
            {minWeight} – {maxWeight} kg
          </div>
        </div>
      </div>

      <AnalyticsCharts
        history={history}
        thermalProbes={thermalProbes}
        isLoading={isLoading}
      />
    </div>
  );
};
