import React from 'react';
import { Icon } from '@iconify/react';
import type { GatePosition, GateState } from '../types/actuator';

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
    <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:panel-bottom-close" className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Entrance Gate Servo</span>
        </div>
        <span className="text-xs text-zinc-500">Angle: {gate.angle}°</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {GATE_OPTIONS.map((opt) => {
          const active = gate.position === opt.position;
          return (
            <button
              key={opt.position}
              type="button"
              onClick={() => onSelect(opt.position)}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                active
                  ? 'bg-amber-500 text-black border-amber-400 font-semibold'
                  : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <Icon icon={opt.icon} className="w-4 h-4 mb-1" />
              <span>{opt.label}</span>
              <span
                className={`text-[10px] font-normal ${
                  active ? 'text-black/75' : 'text-zinc-500'
                }`}
              >
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
