import React from 'react';
import { Icon } from '@iconify/react';
import type { ControlMode, SyrupDispenserState } from '../types/actuator';
import { formatTimeShort } from '../utils/formatters';
import { InkFrame } from './InkFrame';

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
    <div className="p-4 bg-[var(--ll-slip)] border-2 border-dashed border-[var(--ll-pencil-mark)]/60 rounded-lg space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:beaker" className="w-4 h-4 text-[var(--ll-marker)]" />
          <span className="font-hand text-base font-bold text-[var(--ll-ink)]">
            Sugar Syrup Dispenser
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleMode(isAuto ? 'MANUAL' : 'AUTO')}
          className={`relative isolate inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ll-btn ${
            isAuto
              ? 'bg-[var(--ll-sticky-green)] text-[var(--ll-green)]'
              : 'bg-[var(--ll-paper)] text-[var(--ll-ink-muted)]'
          }`}
        >
          <InkFrame seed={351} strokeWidth={1.3} className="text-[var(--ll-ink)]" />
          <Icon
            icon={isAuto ? 'lucide:check-circle-2' : 'lucide:circle'}
            className="w-3.5 h-3.5"
          />
          Auto-Feed: {isAuto ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--ll-ink-muted)] leading-snug">
          Type 3 submersible pump auto-dispenses {syrup.durationSec}s of syrup on rapid weight loss (&ge; 0.50 kg).
          {syrup.lastDispensedAt && ` Last fed: ${formatTimeShort(syrup.lastDispensedAt)}.`}
        </p>

        <button
          type="button"
          disabled={syrup.isDispensing}
          onClick={onDispense}
          className={`relative isolate inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold shrink-0 ll-btn ${
            syrup.isDispensing
              ? 'bg-[var(--ll-sticky-yellow)] text-[var(--ll-ink-muted)] cursor-wait'
              : 'bg-[var(--ll-marker)] text-white hover:opacity-95'
          }`}
        >
          <InkFrame seed={352} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
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
