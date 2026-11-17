import React from 'react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { InkFrame } from '../components/InkFrame';
import type { HistoricalPoint, ThermalProbes } from '../types/telemetry';

interface ChartsPageProps {
  history: HistoricalPoint[];
  thermalProbes: ThermalProbes | null;
  isLoading: boolean;
  theme: 'dark' | 'light';
}

export const ChartsPage: React.FC<ChartsPageProps> = ({
  history,
  thermalProbes,
  isLoading,
  theme,
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
        <h1 className="font-script text-2xl sm:text-[1.7rem] font-bold text-[var(--ll-ink)] leading-none">
          Analytics &amp; Heat Map
        </h1>
        <span className="relative isolate px-3 py-1 bg-[var(--ll-sticky-yellow)] text-xs font-semibold text-[var(--ll-ink)]">
          <InkFrame seed={401} strokeWidth={1.3} className="text-[var(--ll-ink)]" />
          Last 24 Hours
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div className="relative isolate ll-card p-3.5 space-y-1 transition-colors">
          <InkFrame seed={402} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
          <div className="text-[var(--ll-ink-muted)]">3-Level Probes (Top / Mid / Bot)</div>
          <div className="text-sm font-bold text-[var(--ll-ink)]">
            {thermalProbes
              ? `${thermalProbes.top.toFixed(1)}° / ${thermalProbes.middle.toFixed(1)}° / ${thermalProbes.bottom.toFixed(1)}°C`
              : 'No data'}
          </div>
        </div>
        <div className="relative isolate ll-card p-3.5 space-y-1 transition-colors">
          <InkFrame seed={403} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
          <div className="text-[var(--ll-ink-muted)]">24h DHT22 Temp Range</div>
          <div className="text-sm font-bold text-[var(--ll-green)]">
            {minTemp} – {maxTemp} °C
          </div>
        </div>
        <div className="relative isolate ll-card p-3.5 space-y-1 transition-colors">
          <InkFrame seed={404} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
          <div className="text-[var(--ll-ink-muted)]">24h Weight Range</div>
          <div className="text-sm font-bold text-[var(--ll-marker)]">
            {minWeight} – {maxWeight} kg
          </div>
        </div>
      </div>

      <AnalyticsCharts
        history={history}
        thermalProbes={thermalProbes}
        isLoading={isLoading}
        theme={theme}
      />
    </div>
  );
};
