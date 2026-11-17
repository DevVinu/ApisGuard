import React from 'react';
import { ActivityLogModal } from '../components/ActivityLogModal';
import { AlertBanner } from '../components/AlertBanner';
import type { ActivityLogEntry, HiveAlert } from '../types/telemetry';

interface LogsPageProps {
  alerts: HiveAlert[];
  logs: ActivityLogEntry[];
  onDismissAlert: (id: number) => void;
}

export const LogsPage: React.FC<LogsPageProps> = ({ alerts, logs, onDismissAlert }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-script text-2xl sm:text-[1.7rem] font-bold text-[var(--ll-ink)] leading-none">
          Alerts &amp; Logs
        </h1>
        <span className="text-xs text-[var(--ll-ink-muted)] font-medium">
          {logs.length} entries
        </span>
      </div>

      <AlertBanner alerts={alerts} onDismiss={onDismissAlert} />

      <ActivityLogModal logs={logs} />
    </div>
  );
};
