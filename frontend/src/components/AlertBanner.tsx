import React from 'react';
import { Icon } from '@iconify/react';
import type { HiveAlert } from '../types/telemetry';
import { formatTimeShort } from '../utils/formatters';

interface AlertBannerProps {
  alerts: HiveAlert[];
  onDismiss: (id: number) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-2">
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        return (
          <div
            key={alert.id}
            role="alert"
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm ${
              isCritical
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <Icon
                icon={isCritical ? 'lucide:siren' : 'lucide:alert-triangle'}
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                  isCritical ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div className="min-w-0">
                <span className="font-semibold mr-1.5">{alert.alertType.replace(/_/g, ' ')}:</span>
                <span className="text-zinc-200">{alert.message}</span>
                <span className="ml-2 text-[11px] text-zinc-400">
                  ({formatTimeShort(alert.createdAt)})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0 transition-colors"
            >
              <Icon icon="lucide:x" className="w-3.5 h-3.5" />
              Dismiss
            </button>
          </div>
        );
      })}
    </section>
  );
};
