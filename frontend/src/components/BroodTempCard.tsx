import React from 'react';
import { MetricCard } from './MetricCard';
import { formatTemp } from '../utils/formatters';

interface BroodTempCardProps {
  temperature: number;
  humidity: number;
}

export const BroodTempCard: React.FC<BroodTempCardProps> = ({ temperature, humidity }) => {
  const isIdeal = temperature >= 34.0 && temperature <= 35.5;
  const isOverheat = temperature > 36.0;
  const tone = isOverheat ? 'rose' : isIdeal ? 'emerald' : 'amber';
  const badgeText = isOverheat ? 'High' : isIdeal ? 'Ideal' : 'Watch';

  const progressPct = ((temperature - 25) / 15) * 100;

  return (
    <MetricCard
      title="Hive Climate (DHT22)"
      value={formatTemp(temperature)}
      secondaryText={`Humidity: ${humidity.toFixed(0)}%`}
      targetText="Target: 34.0-35.5 °C"
      icon="lucide:thermometer"
      badgeText={badgeText}
      tone={tone}
      progressPct={progressPct}
    />
  );
};
