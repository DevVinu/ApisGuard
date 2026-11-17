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
        <h1 className="font-script text-2xl sm:text-[1.7rem] font-bold text-[var(--ll-ink)] leading-none">
          Controls &amp; Automation
        </h1>
        <span className="text-xs text-[var(--ll-ink-muted)] font-medium">Remote Actuators</span>
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
