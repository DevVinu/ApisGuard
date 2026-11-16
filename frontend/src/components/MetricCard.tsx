import React from 'react';
import { Icon } from '@iconify/react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  secondaryText?: string;
  targetText?: string;
  icon: string;
  badgeText: string;
  tone?: 'emerald' | 'amber' | 'rose' | 'sky';
  progressPct?: number;
}

const TONE_CLASSES: Record<
  NonNullable<MetricCardProps['tone']>,
  { badge: string; iconColor: string; bar: string }
> = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    iconColor: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    iconColor: 'text-rose-400',
    bar: 'bg-rose-500',
  },
  sky: {
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    iconColor: 'text-sky-400',
    bar: 'bg-sky-500',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  secondaryText,
  targetText,
  icon,
  badgeText,
  tone = 'emerald',
  progressPct,
}) => {
  const styles = TONE_CLASSES[tone];

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3 h-full transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
            <Icon icon={icon} className={`w-4 h-4 ${styles.iconColor}`} />
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight">
            {title}
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border shrink-0 whitespace-nowrap ${styles.badge}`}
        >
          {badgeText}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight leading-none">
          {value}
        </div>

        {typeof progressPct === 'number' && (
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${styles.bar}`}
              style={{ width: `${Math.max(4, Math.min(100, progressPct))}%` }}
            />
          </div>
        )}
      </div>

      <div className="pt-1 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] leading-snug">
        {secondaryText && (
          <span className="text-zinc-700 dark:text-zinc-300">{secondaryText}</span>
        )}
        {targetText && <span className="text-zinc-500">{targetText}</span>}
        {!secondaryText && !targetText && subtitle && (
          <span className="text-zinc-500 dark:text-zinc-400">{subtitle}</span>
        )}
      </div>
    </div>
  );
};
