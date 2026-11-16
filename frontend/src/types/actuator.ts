export type GatePosition = 'OPEN' | 'GUARD_MODE' | 'CLOSED';
export type ControlMode = 'AUTO' | 'MANUAL';

export interface GateState {
  position: GatePosition;
  angle: number;
}

export interface SyrupDispenserState {
  isDispensing: boolean;
  mode: ControlMode;
  durationSec: number;
  lastDispensedAt: string | null;
}

export interface ActuatorState {
  entranceGate: GateState;
  syrupDispenser: SyrupDispenserState;
}

export interface ActuatorCommandPayload {
  commandId: string;
  timestamp: number;
  actions: Partial<{
    entranceGate: { position: GatePosition; angle: number };
    syrupDispenser: { dispense: boolean; durationSec: number; mode: ControlMode };
  }>;
}
