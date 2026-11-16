import React from 'react';
import type { TelemetryMetrics } from '../types/telemetry';
import { BeeTrafficCard } from './BeeTrafficCard';
import { BroodTempCard } from './BroodTempCard';
import { MotionSecurityCard } from './MotionSecurityCard';
import { WeightCard } from './WeightCard';

interface MetricCardsGridProps {
  metrics: TelemetryMetrics;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ metrics }) => {
  return (
    <section id="metrics" className="scroll-mt-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <BroodTempCard temperature={metrics.temperature} humidity={metrics.humidity} />
        <WeightCard
          weightKg={metrics.weightKg}
          dailyDeltaKg={metrics.dailyWeightDeltaKg}
          harvestReady={metrics.harvestReady}
        />
        <BeeTrafficCard beesIn={metrics.beesIn} beesOut={metrics.beesOut} />
        <MotionSecurityCard motion={metrics.motion} />
      </div>
    </section>
  );
};
