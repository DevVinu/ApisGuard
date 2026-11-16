import React from 'react';
import type { MotionState } from '../types/telemetry';
import { MetricCard } from './MetricCard';

interface MotionSecurityCardProps {
  motion: MotionState;
}

export const MotionSecurityCard: React.FC<MotionSecurityCardProps> = ({ motion }) => {
  const isCritical = motion.fallDetected || motion.theftAlert;
  const isTilted = motion.tiltDeg > 5;
  const tone = isCritical ? 'rose' : isTilted ? 'amber' : 'emerald';
  const badgeText = motion.fallDetected
    ? 'Fall!'
    : motion.theftAlert
      ? 'Theft!'
      : isTilted
        ? 'Tilted'
        : 'Secure';

  const progressPct = Math.min(100, (motion.tiltDeg / 45) * 100);

  return (
    <MetricCard
      title="Motion (MPU6050)"
      value={isCritical ? (motion.fallDetected ? 'FALL' : 'TAMPER') : 'Stable'}
      secondaryText={`Tilt: ${motion.tiltDeg.toFixed(1)}°`}
      targetText="Theft & fall guard"
      icon="lucide:shield-alert"
      badgeText={badgeText}
      tone={tone}
      progressPct={progressPct}
    />
  );
};
