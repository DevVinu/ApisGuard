import React from 'react';
import { Icon } from '@iconify/react';
import type { ControlMode, SyrupDispenserState } from '../types/actuator';
import { formatTimeShort } from '../utils/formatters';

interface SyrupControlProps {
  syrup: SyrupDispenserState;
  onToggleMode: (mode: ControlMode) => void;
  onDispense: () => void;
}

export const SyrupControl: React.FC<SyrupControlProps> = ({
  syrup,
  onToggleMode,
  onDispense,
}) => {
  const isAuto = syrup.mode === 'AUTO';

  return (
    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:beaker" className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            Sugar Syrup Dispenser
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleMode(isAuto ? 'MANUAL' : 'AUTO')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            isAuto
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-white text-zinc-600 border-zinc-200 dark:bg-black dark:text-zinc-400 dark:border-zinc-800'
          }`}
        >
          <Icon
            icon={isAuto ? 'lucide:check-circle-2' : 'lucide:circle'}
            className="w-3.5 h-3.5"
          />
          Auto-Feed: {isAuto ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-500 leading-snug">
          Type 3 submersible pump auto-dispenses {syrup.durationSec}s of syrup on rapid weight loss (&ge; 0.50 kg).
          {syrup.lastDispensedAt && ` Last fed: ${formatTimeShort(syrup.lastDispensedAt)}.`}
        </p>

        <button
          type="button"
          disabled={syrup.isDispensing}
          onClick={onDispense}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            syrup.isDispensing
              ? 'bg-amber-500/30 text-amber-200 cursor-wait'
              : 'bg-amber-500 text-black hover:bg-amber-400'
          }`}
        >
          <Icon
            icon={syrup.isDispensing ? 'lucide:loader-2' : 'lucide:droplet'}
            className={`w-4 h-4 ${syrup.isDispensing ? 'animate-spin' : ''}`}
          />
          {syrup.isDispensing ? 'Dispensing...' : 'Dispense Syrup'}
        </button>
      </div>
    </div>
  );
};
