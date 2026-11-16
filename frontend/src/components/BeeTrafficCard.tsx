import React from 'react';
import { MetricCard } from './MetricCard';

interface BeeTrafficCardProps {
  beesIn: number;
  beesOut: number;
}

export const BeeTrafficCard: React.FC<BeeTrafficCardProps> = ({ beesIn, beesOut }) => {
  const total = beesIn + beesOut;
  const netInside = beesIn - beesOut;
  const progressPct = total > 0 ? (beesIn / total) * 100 : 50;

  return (
    <MetricCard
      title="Bee Traffic (2x IR)"
      value={`${beesIn} / ${beesOut}`}
      secondaryText={`In: ${beesIn}  Out: ${beesOut}`}
      targetText={`Net: ${netInside >= 0 ? '+' : ''}${netInside}`}
      icon="lucide:arrow-left-right"
      badgeText={total > 0 ? 'Active' : 'Quiet'}
      tone="sky"
      progressPct={progressPct}
    />
  );
};
