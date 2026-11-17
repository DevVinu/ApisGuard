import React from 'react';
import { Icon } from '@iconify/react';
import { InkFrame } from './InkFrame';

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
    badge: 'bg-[var(--ll-sticky-green)] text-[var(--ll-green)]',
    iconColor: 'text-[var(--ll-green)]',
    bar: 'bg-[var(--ll-green)]',
  },
  amber: {
    badge: 'bg-[var(--ll-sticky-yellow)] text-[var(--ll-ink)]',
    iconColor: 'text-[var(--ll-marker)]',
    bar: 'bg-[var(--ll-marker)]',
  },
  rose: {
    badge: 'bg-[var(--ll-sticky-pink)] text-[var(--ll-red)]',
    iconColor: 'text-[var(--ll-red)]',
    bar: 'bg-[var(--ll-red)]',
  },
  sky: {
    badge: 'bg-[var(--ll-sticky-blue)] text-[var(--ll-ink-you)]',
    iconColor: 'text-[var(--ll-ink-you)]',
    bar: 'bg-[var(--ll-ink-you)]',
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
  const seed = title.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 17);

  return (
    <div className="relative isolate ll-card p-3.5 sm:p-4 flex flex-col justify-between gap-3 h-full transition-colors">
      <InkFrame seed={seed} strokeWidth={1.7} doublePass className="text-[var(--ll-ink)]" />

      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative isolate p-1.5 sm:p-2 bg-[var(--ll-slip)] shrink-0">
            <InkFrame seed={seed + 3} strokeWidth={1.2} className="text-[var(--ll-pencil-mark)]" />
            <Icon icon={icon} className={`w-4 h-4 ${styles.iconColor}`} />
          </div>
          <span className="font-hand text-sm font-bold text-[var(--ll-ink)] leading-tight">
            {title}
          </span>
        </div>

        <span
          className={`relative isolate px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold shrink-0 whitespace-nowrap ${styles.badge}`}
        >
          <InkFrame seed={seed + 7} strokeWidth={1.15} className="text-[var(--ll-ink)]/60" />
          {badgeText}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-xl sm:text-2xl font-bold text-[var(--ll-ink)] tracking-tight leading-none">
          {value}
        </div>

        {typeof progressPct === 'number' && (
          <div className="w-full h-2 bg-[var(--ll-paper-shade)] rounded-full overflow-hidden border border-[var(--ll-pencil-mark)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${styles.bar}`}
              style={{ width: `${Math.max(4, Math.min(100, progressPct))}%` }}
            />
          </div>
        )}
      </div>

      <div className="pt-1.5 border-t border-dashed border-[var(--ll-pencil-mark)]/60 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] leading-snug">
        {secondaryText && <span className="text-[var(--ll-ink-soft)]">{secondaryText}</span>}
        {targetText && <span className="text-[var(--ll-ink-muted)]">{targetText}</span>}
        {!secondaryText && !targetText && subtitle && (
          <span className="text-[var(--ll-ink-muted)]">{subtitle}</span>
        )}
      </div>
    </div>
  );
};
