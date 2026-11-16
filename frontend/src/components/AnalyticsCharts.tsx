import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { HistoricalPoint, ThermalProbes } from '../types/telemetry';
import { ClimateLineChart } from './ClimateLineChart';
import { HiveHeatMap2D } from './HiveHeatMap2D';
import { WeightAreaChart } from './WeightAreaChart';

interface AnalyticsChartsProps {
  history: HistoricalPoint[];
  thermalProbes: ThermalProbes;
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
    <section className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
          <Icon icon="lucide:trending-up" className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          24-Hour Trends &amp; Thermal Map
        </h2>

        <div className="inline-flex flex-wrap rounded-xl bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('temp-humidity')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'temp-humidity'
                ? 'bg-white text-emerald-600 shadow-sm dark:shadow-none dark:bg-zinc-900 dark:text-emerald-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Icon icon="lucide:thermometer" className="w-3.5 h-3.5" />
            Temp &amp; Humidity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('heatmap-2d')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'heatmap-2d'
                ? 'bg-white text-amber-600 shadow-sm dark:shadow-none dark:bg-zinc-900 dark:text-amber-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Icon icon="lucide:flame" className="w-3.5 h-3.5" />
            2D Heat Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'weight'
                ? 'bg-white text-amber-600 shadow-sm dark:shadow-none dark:bg-zinc-900 dark:text-amber-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Icon icon="lucide:scale" className="w-3.5 h-3.5" />
            Weight Flow
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center text-xs text-zinc-500">
          Loading 24-hour sensor trends...
        </div>
      ) : activeTab === 'temp-humidity' ? (
        <ClimateLineChart data={history} theme={theme} />
      ) : activeTab === 'heatmap-2d' ? (
        <HiveHeatMap2D currentProbes={thermalProbes} history={history} />
      ) : (
        <WeightAreaChart data={history} theme={theme} />
      )}
    </section>
  );
};
