import React from 'react';
import { Icon } from '@iconify/react';
import type { HiveAlert } from '../types/telemetry';
import { formatTimeShort } from '../utils/formatters';
import { InkFrame } from './InkFrame';

interface AlertBannerProps {
  alerts: HiveAlert[];
  onDismiss: (id: number) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-2.5">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        return (
          <div
            key={alert.id}
            role="alert"
            className={`relative isolate flex items-center justify-between gap-3 px-4 py-3 text-xs sm:text-sm ${
              isCritical
                ? 'bg-[var(--ll-sticky-pink)] text-[var(--ll-ink)]'
                : 'bg-[var(--ll-sticky-yellow)] text-[var(--ll-ink)]'
            }`}
          >
            <InkFrame
              seed={200 + alert.id}
              strokeWidth={1.6}
              className={isCritical ? 'text-[var(--ll-red)]' : 'text-[var(--ll-ink)]'}
            />

            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <Icon
                icon={isCritical ? 'lucide:siren' : 'lucide:alert-triangle'}
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                  isCritical ? 'text-[var(--ll-red)]' : 'text-[var(--ll-marker)]'
                }`}
              />
              <div className="min-w-0">
                <span className="font-bold mr-1.5">{alert.alertType.replace(/_/g, ' ')}:</span>
                <span className="text-[var(--ll-ink-soft)]">{alert.message}</span>
                <span className="ml-2 text-[11px] text-[var(--ll-ink-muted)]">
                  ({formatTimeShort(alert.createdAt)})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="relative isolate inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--ll-paper)] hover:bg-[var(--ll-paper-shade)] text-[var(--ll-ink)] shrink-0 ll-btn"
            >
              <InkFrame seed={250 + alert.id} strokeWidth={1.3} className="text-[var(--ll-ink)]" />
              <Icon icon="lucide:x" className="w-3.5 h-3.5" />
              Dismiss
            </button>
          </div>
        );
      })}
    </section>
  );
};
