import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ActivityLogEntry } from '../types/telemetry';
import { formatTimeShort } from '../utils/formatters';

interface ActivityLogModalProps {
  logs: ActivityLogEntry[];
}

type CategoryFilter = 'all' | 'actuator' | 'alert' | 'system';

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ logs }) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const filteredLogs = filter === 'all' ? logs : logs.filter((item) => item.category === filter);

  return (
    <section className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
          <Icon icon="lucide:history" className="w-4 h-4 text-amber-400" />
          Incident &amp; Actuator Log
        </h2>

        <div className="inline-flex rounded-xl bg-black border border-zinc-800 p-1 text-xs">
          {(['all', 'actuator', 'alert', 'system'] as CategoryFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                filter === key
                  ? 'bg-zinc-900 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">No entries in this category.</p>
      ) : (
        <ul className="divide-y divide-zinc-800/80">
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
                      ? 'text-rose-400'
                      : entry.category === 'actuator'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                />
                <span className="font-medium text-zinc-500 shrink-0">
                  {formatTimeShort(entry.timestamp)}
                </span>
                <span className="text-zinc-200 truncate">{entry.message}</span>
              </div>

              {entry.status && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-medium shrink-0">
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
