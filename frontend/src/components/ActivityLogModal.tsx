import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ActivityLogEntry } from '../types/telemetry';
import { formatTimeShort } from '../utils/formatters';
import { InkFrame } from './InkFrame';

interface ActivityLogModalProps {
  logs: ActivityLogEntry[];
}

type CategoryFilter = 'all' | 'actuator' | 'alert' | 'system';

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ logs }) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const filteredLogs = filter === 'all' ? logs : logs.filter((item) => item.category === filter);

  return (
    <section className="relative isolate ll-paper p-4 space-y-3 transition-colors">
      <InkFrame seed={501} strokeWidth={1.8} doublePass className="text-[var(--ll-ink)]" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-hand font-bold text-[var(--ll-ink)] flex items-center gap-2 text-lg sm:text-xl">
          <Icon icon="lucide:history" className="w-4 h-4 text-[var(--ll-marker)]" />
          Incident &amp; Actuator Log
        </h2>

        <div className="inline-flex gap-1 rounded-lg bg-[var(--ll-paper-shade)] border border-[var(--ll-pencil-mark)] p-1 text-xs">
          {(['all', 'actuator', 'alert', 'system'] as CategoryFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-colors ${
                filter === key
                  ? 'bg-[var(--ll-hi)] text-[var(--ll-ink)]'
                  : 'text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--ll-ink-muted)]">
          No entries in this category.
        </p>
      ) : (
        <ul className="divide-y divide-dashed divide-[var(--ll-pencil-mark)]/50">
          {filteredLogs.map((entry) => (
            <li key={entry.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  icon={
                    entry.category === 'alert'
                      ? 'lucide:alert-circle'
                      : entry.category === 'actuator'
                        ? 'lucide:cpu'
                        : 'lucide:check-circle-2'
                  }
                  className={`w-4 h-4 shrink-0 ${
                    entry.category === 'alert'
                      ? 'text-[var(--ll-red)]'
                      : entry.category === 'actuator'
                        ? 'text-[var(--ll-marker)]'
                        : 'text-[var(--ll-green)]'
                  }`}
                />
                <span className="font-medium text-[var(--ll-ink-muted)] shrink-0">
                  {formatTimeShort(entry.timestamp)}
                </span>
                <span className="text-[var(--ll-ink)] truncate">{entry.message}</span>
              </div>

              {entry.status && (
                <span className="px-2 py-0.5 rounded bg-[var(--ll-slip)] border border-[var(--ll-pencil-mark)] text-[var(--ll-ink-muted)] text-[11px] font-medium shrink-0">
                  {entry.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
