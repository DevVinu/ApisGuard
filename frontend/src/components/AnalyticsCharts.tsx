import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { HistoricalPoint, ThermalProbes } from '../types/telemetry';
import { ClimateLineChart } from './ClimateLineChart';
import { HiveHeatMap2D } from './HiveHeatMap2D';
import { InkFrame } from './InkFrame';
import { WeightAreaChart } from './WeightAreaChart';

interface AnalyticsChartsProps {
  history: HistoricalPoint[];
  thermalProbes: ThermalProbes | null;
  isLoading: boolean;
  theme: 'dark' | 'light';
}

type ChartTab = 'temp-humidity' | 'heatmap-2d' | 'weight';

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  history,
  thermalProbes,
  isLoading,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('temp-humidity');

  return (
    <section className="relative isolate ll-paper p-4 space-y-4 transition-colors">
      <InkFrame seed={410} strokeWidth={1.8} doublePass className="text-[var(--ll-ink)]" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-hand font-bold text-[var(--ll-ink)] flex items-center gap-2 text-lg sm:text-xl">
          <Icon icon="lucide:trending-up" className="w-4 h-4 text-[var(--ll-marker)]" />
          24-Hour Trends &amp; Thermal Map
        </h2>

        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-[var(--ll-paper-shade)] p-1 text-xs border border-[var(--ll-pencil-mark)]">
          <button
            type="button"
            onClick={() => setActiveTab('temp-humidity')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'temp-humidity'
                ? 'bg-[var(--ll-hi)] text-[var(--ll-ink)]'
                : 'text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
            }`}
          >
            <Icon icon="lucide:thermometer" className="w-3.5 h-3.5" />
            Temp &amp; Humidity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('heatmap-2d')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'heatmap-2d'
                ? 'bg-[var(--ll-hi)] text-[var(--ll-ink)]'
                : 'text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
            }`}
          >
            <Icon icon="lucide:flame" className="w-3.5 h-3.5" />
            2D Heat Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'weight'
                ? 'bg-[var(--ll-hi)] text-[var(--ll-ink)]'
                : 'text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
            }`}
          >
            <Icon icon="lucide:scale" className="w-3.5 h-3.5" />
            Weight Flow
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 rounded-xl bg-[var(--ll-paper-shade)] animate-pulse flex items-center justify-center text-xs text-[var(--ll-ink-muted)]">
          Loading 24-hour sensor trends...
        </div>
      ) : history.length === 0 && !thermalProbes ? (
        <div className="h-72 rounded-xl bg-[var(--ll-slip)] border border-dashed border-[var(--ll-pencil-mark)] flex flex-col items-center justify-center text-center p-4 gap-1.5">
          <Icon icon="lucide:bar-chart-2" className="w-6 h-6 text-[var(--ll-ink-muted)]" />
          <div className="font-hand text-base font-bold text-[var(--ll-ink)]">No Chart Data Yet</div>
          <p className="text-xs text-[var(--ll-ink-muted)]">
            Charts and the 2D heat map will appear as soon as the ESP32 sends live telemetry.
          </p>
        </div>
      ) : activeTab === 'temp-humidity' ? (
        <ClimateLineChart data={history} theme={theme} />
      ) : activeTab === 'heatmap-2d' ? (
        <HiveHeatMap2D
          currentProbes={thermalProbes ?? { top: 0, middle: 0, bottom: 0 }}
          history={history}
        />
      ) : (
        <WeightAreaChart data={history} theme={theme} />
      )}
    </section>
  );
};
