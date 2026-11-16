import { useEffect, useState } from 'react';
import { INITIAL_ACTUATORS, INITIAL_LOGS } from '../data/mockHiveData';
import { fetchActuators, sendActuatorCommand } from '../services/api';
import { getSocket } from '../services/socket';
import type {
  ActuatorCommandPayload,
  ActuatorState,
  ControlMode,
  GatePosition,
} from '../types/actuator';
import type { ActivityLogEntry } from '../types/telemetry';

const GATE_ANGLES: Record<GatePosition, number> = {
  OPEN: 0,
  GUARD_MODE: 45,
  CLOSED: 90,
};

export function useActuatorControl() {
  const [actuators, setActuators] = useState<ActuatorState>(INITIAL_ACTUATORS);
  const [logs, setLogs] = useState<ActivityLogEntry[]>(INITIAL_LOGS);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchActuators()
      .then((data) => {
        if (mounted) setActuators(data);
      })
      .catch(() => {
        // Keep initial actuator state when backend is unavailable.
      });

    const socket = getSocket();
    const handleAck = (updated: ActuatorState) => {
      setActuators(updated);
      setPendingAction(null);
    };

    socket.on('actuators:ack', handleAck);
    return () => {
      mounted = false;
      socket.off('actuators:ack', handleAck);
    };
  }, []);

  const appendLog = (message: string, status: ActivityLogEntry['status'] = 'sent') => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'actuator',
        message,
        status,
      },
      ...prev,
    ]);
  };

  const dispatchCommand = async (
    label: string,
    actions: ActuatorCommandPayload['actions'],
    logMessage: string
  ) => {
    setPendingAction(label);
    const payload: ActuatorCommandPayload = {
      commandId: `cmd-${Date.now().toString().slice(-4)}`,
      timestamp: Math.floor(Date.now() / 1000),
      actions,
    };

    try {
      await sendActuatorCommand(payload);
      appendLog(logMessage, 'sent');
    } catch {
      // Optimistic local state works cleanly in UI preview mode before backend is running.
      appendLog(`${logMessage} (local preview)`, 'acknowledged');
    } finally {
      setPendingAction(null);
    }
  };

  const updateGate = (position: GatePosition) => {
    const angle = GATE_ANGLES[position];
    setActuators((prev) => ({
      ...prev,
      entranceGate: { position, angle },
    }));
    void dispatchCommand(
      'gate',
      { entranceGate: { position, angle } },
      `Entrance gate moved to ${position} (${angle}°)`
    );
  };

  const toggleSyrupAutoMode = (mode: ControlMode) => {
    setActuators((prev) => ({
      ...prev,
      syrupDispenser: { ...prev.syrupDispenser, mode },
    }));
    void dispatchCommand(
      'syrup-mode',
      {
        syrupDispenser: {
          dispense: false,
          durationSec: actuators.syrupDispenser.durationSec,
          mode,
        },
      },
      `Sugar syrup auto-feed set to ${mode}`
    );
  };

  const dispenseSyrup = () => {
    const durationSec = actuators.syrupDispenser.durationSec;
    const nowIso = new Date().toISOString();
    setActuators((prev) => ({
      ...prev,
      syrupDispenser: {
        ...prev.syrupDispenser,
        isDispensing: true,
        lastDispensedAt: nowIso,
      },
    }));

    void dispatchCommand(
      'syrup-dispense',
      {
        syrupDispenser: {
          dispense: true,
          durationSec,
          mode: actuators.syrupDispenser.mode,
        },
      },
      `Sugar syrup dispensed for ${durationSec}s`
    );

    window.setTimeout(() => {
      setActuators((prev) => ({
        ...prev,
        syrupDispenser: { ...prev.syrupDispenser, isDispensing: false },
      }));
    }, durationSec * 1000);
  };

  return {
    actuators,
    logs,
    pendingAction,
    updateGate,
    toggleSyrupAutoMode,
    dispenseSyrup,
  };
}
