import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HOME_COORDINATES } from './data/mockHiveData';
import { useActuatorControl } from './hooks/useActuatorControl';
import { useHistoricalData } from './hooks/useHistoricalData';
import { useLiveTelemetry } from './hooks/useLiveTelemetry';
import { useTheme } from './hooks/useTheme';
import { ChartsPage } from './pages/ChartsPage';
import { ControlsPage } from './pages/ControlsPage';
import { LogsPage } from './pages/LogsPage';
import { OverviewPage } from './pages/OverviewPage';

export function App() {
  const { theme, setTheme } = useTheme();
  const { telemetry, alerts, isBackendConnected, dismissAlert } = useLiveTelemetry();
  const {
    actuators,
    logs,
    pendingAction,
    updateGate,
    toggleSyrupAutoMode,
    dispenseSyrup,
  } = useActuatorControl();
  const { history, isLoading: isHistoryLoading } = useHistoricalData(24);

  return (
    <BrowserRouter>
      <div className="min-h-screen ll-desk text-[var(--ll-ink)] flex flex-col transition-colors">
        <Navbar
          device={telemetry.device}
          activeAlertsCount={alerts.length}
          isBackendConnected={isBackendConnected}
          theme={theme}
          onChangeTheme={setTheme}
        />

        <main className="max-w-5xl w-full mx-auto px-4 pt-4 pb-24 md:pb-8 flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <OverviewPage
                  telemetry={telemetry}
                  actuators={actuators}
                  alerts={alerts}
                  homeLat={HOME_COORDINATES.latitude}
                  homeLng={HOME_COORDINATES.longitude}
                  geofenceRadiusMeters={HOME_COORDINATES.geofenceRadiusMeters}
                  onDismissAlert={dismissAlert}
                />
              }
            />
            <Route
              path="/controls"
              element={
                <ControlsPage
                  actuators={actuators}
                  pendingAction={pendingAction}
                  onUpdateGate={updateGate}
                  onToggleSyrupMode={toggleSyrupAutoMode}
                  onDispenseSyrup={dispenseSyrup}
                />
              }
            />
            <Route
              path="/charts"
              element={
                <ChartsPage
                  history={history}
                  thermalProbes={telemetry.metrics.thermalProbes}
                  isLoading={isHistoryLoading}
                  theme={theme}
                />
              }
            />
            <Route
              path="/logs"
              element={
                <LogsPage alerts={alerts} logs={logs} onDismissAlert={dismissAlert} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
