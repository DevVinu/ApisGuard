import React from 'react';
import { Icon } from '@iconify/react';
import type { ActuatorState, ControlMode, GatePosition } from '../types/actuator';
import { GateButtons } from './GateButtons';
import { InkFrame } from './InkFrame';
import { SyrupControl } from './SyrupControl';

interface ActuatorControlPanelProps {
  actuators: ActuatorState;
  pendingAction: string | null;
  onUpdateGate: (position: GatePosition) => void;
  onToggleSyrupMode: (mode: ControlMode) => void;
  onDispenseSyrup: () => void;
}

export const ActuatorControlPanel: React.FC<ActuatorControlPanelProps> = ({
  actuators,
  pendingAction,
  onUpdateGate,
  onToggleSyrupMode,
  onDispenseSyrup,
}) => {
  return (
    <div className="relative isolate ll-paper p-4 space-y-3.5 transition-colors">
      <InkFrame seed={301} strokeWidth={1.8} doublePass className="text-[var(--ll-ink)]" />

      <div className="flex items-center justify-between">
        <h2 className="font-hand font-bold text-[var(--ll-ink)] flex items-center gap-2 text-lg sm:text-xl">
          <Icon icon="lucide:sliders-horizontal" className="w-4 h-4 text-[var(--ll-marker)]" />
          Actuator Controls
        </h2>
        {pendingAction && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--ll-marker)] font-semibold">
            <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
            Syncing...
          </span>
        )}
      </div>

      <GateButtons gate={actuators.entranceGate} onSelect={onUpdateGate} />

      <SyrupControl
        syrup={actuators.syrupDispenser}
        onToggleMode={onToggleSyrupMode}
        onDispense={onDispenseSyrup}
      />
    </div>
  );
};
