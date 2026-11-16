import React from 'react';
import { LOAD_CELL_MAX_KG } from '../data/mockHiveData';
import { MetricCard } from './MetricCard';
import { formatSignedWeight, formatWeight } from '../utils/formatters';

interface WeightCardProps {
  weightKg: number;
  dailyDeltaKg: number;
  harvestReady: boolean;
}

export const WeightCard: React.FC<WeightCardProps> = ({
  weightKg,
  dailyDeltaKg,
  harvestReady,
}) => {
  const isRapidLoss = dailyDeltaKg <= -0.5;
  const tone = isRapidLoss ? 'rose' : harvestReady ? 'emerald' : 'amber';
  const badgeText = isRapidLoss
    ? 'Rapid Loss'
    : harvestReady
      ? 'Harvest Ready'
      : `${formatSignedWeight(dailyDeltaKg)} today`;

  const progressPct = (weightKg / LOAD_CELL_MAX_KG) * 100;

  return (
    <MetricCard
      title="Hive Weight (5kg)"
      value={formatWeight(weightKg)}
      secondaryText={`24h change: ${formatSignedWeight(dailyDeltaKg)}`}
      targetText={
        isRapidLoss
          ? 'Low store — syrup feed'
          : harvestReady
            ? 'Ready to harvest!'
            : 'Harvest: >= 4.20 kg'
      }
      icon="lucide:scale"
      badgeText={badgeText}
      tone={tone}
      progressPct={progressPct}
    />
  );
};
