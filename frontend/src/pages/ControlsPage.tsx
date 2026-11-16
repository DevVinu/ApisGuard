import React from 'react';
import { ActuatorControlPanel } from '../components/ActuatorControlPanel';
import type { ActuatorState, ControlMode, GatePosition } from '../types/actuator';

interface ControlsPageProps {
  actuators: ActuatorState;
  pendingAction: string | null;
  onUpdateGate: (position: GatePosition) => void;
  onToggleSyrupMode: (mode: ControlMode) => void;
  onDispenseSyrup: () => void;
}

export const ControlsPage: React.FC<ControlsPageProps> = ({
  actuators,
  pendingAction,
  onUpdateGate,
  onToggleSyrupMode,
  onDispenseSyrup,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
          Controls &amp; Automation
        </h1>
        <span className="text-xs text-zinc-500">Remote Actuators</span>
      </div>

      <ActuatorControlPanel
        actuators={actuators}
        pendingAction={pendingAction}
        onUpdateGate={onUpdateGate}
        onToggleSyrupMode={onToggleSyrupMode}
        onDispenseSyrup={onDispenseSyrup}
      />
    </div>
  );
};
