import React from 'react';
import { Icon } from '@iconify/react';
import type { GatePosition, GateState } from '../types/actuator';
import { InkFrame } from './InkFrame';

interface GateButtonsProps {
  gate: GateState;
  onSelect: (position: GatePosition) => void;
}

const GATE_OPTIONS: Array<{
  position: GatePosition;
  label: string;
  hint: string;
  icon: string;
}> = [
  { position: 'OPEN', label: 'Open', hint: 'Foraging', icon: 'lucide:door-open' },
  { position: 'GUARD_MODE', label: 'Guard', hint: 'Wasp block', icon: 'lucide:shield' },
  { position: 'CLOSED', label: 'Closed', hint: 'Lockdown', icon: 'lucide:lock' },
];

export const GateButtons: React.FC<GateButtonsProps> = ({ gate, onSelect }) => {
  return (
    <div className="p-4 bg-[var(--ll-slip)] border-2 border-dashed border-[var(--ll-pencil-mark)]/60 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:panel-bottom-close" className="w-4 h-4 text-[var(--ll-marker)]" />
          <span className="font-hand text-base font-bold text-[var(--ll-ink)]">
            Entrance Gate Servo
          </span>
        </div>
        <span className="text-xs text-[var(--ll-ink-muted)] font-medium">
          Angle: {gate.angle}°
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {GATE_OPTIONS.map((opt, idx) => {
          const active = gate.position === opt.position;
          return (
            <button
              key={opt.position}
              type="button"
              onClick={() => onSelect(opt.position)}
              className={`relative isolate flex flex-col items-center justify-center py-2.5 px-2 text-xs font-semibold ll-btn ${
                active
                  ? 'bg-[var(--ll-hi)] text-[var(--ll-ink)]'
                  : 'bg-[var(--ll-paper)] text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)] hover:bg-[var(--ll-paper-shade)]'
              }`}
            >
              <InkFrame
                seed={320 + idx * 9}
                strokeWidth={active ? 1.8 : 1.3}
                className="text-[var(--ll-ink)]"
              />
              <Icon icon={opt.icon} className="w-4 h-4 mb-1" />
              <span>{opt.label}</span>
              <span className="text-[10px] font-normal opacity-75">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
