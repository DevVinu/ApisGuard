import React from 'react';
import { Icon } from '@iconify/react';
import type { ActuatorState, ControlMode, GatePosition } from '../types/actuator';
import { GateButtons } from './GateButtons';
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
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
          <Icon icon="lucide:sliders-horizontal" className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          Actuator Controls
        </h2>
        {pendingAction && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
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
