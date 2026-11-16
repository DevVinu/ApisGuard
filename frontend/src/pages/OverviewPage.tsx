import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AlertBanner } from '../components/AlertBanner';
import { HiveGoogleMap } from '../components/HiveGoogleMap';
import { MetricCardsGrid } from '../components/MetricCardsGrid';
import type { ActuatorState } from '../types/actuator';
import type { HiveAlert, LiveTelemetry } from '../types/telemetry';

interface OverviewPageProps {
  telemetry: LiveTelemetry;
  actuators: ActuatorState;
  alerts: HiveAlert[];
  homeLat: number;
  homeLng: number;
  geofenceRadiusMeters: number;
  onDismissAlert: (id: number) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  telemetry,
  actuators,
  alerts,
  homeLat,
  homeLng,
  geofenceRadiusMeters,
  onDismissAlert,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-semibold text-white">Hive Overview</h1>
        <span className="text-xs text-zinc-500">Live GPS &amp; Telemetry</span>
      </div>

      <AlertBanner alerts={alerts} onDismiss={onDismissAlert} />

      <HiveGoogleMap
        latitude={telemetry.location.latitude}
        longitude={telemetry.location.longitude}
        homeLat={homeLat}
        homeLng={homeLng}
        geofenceRadiusMeters={geofenceRadiusMeters}
        satellites={telemetry.location.satellites}
        altitudeMeters={telemetry.location.altitudeMeters}
      />

      <MetricCardsGrid metrics={telemetry.metrics} />

      {/* Simple Quick-Status Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/controls"
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 transition-colors space-y-1.5"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Entrance Gate</span>
            <Icon icon="lucide:door-open" className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-white">
            {actuators.entranceGate.position.replace('_', ' ')}
          </div>
          <div className="text-[11px] text-zinc-500">
            Angle: {actuators.entranceGate.angle}°
          </div>
        </Link>

        <Link
          to="/controls"
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 transition-colors space-y-1.5"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Sugar Syrup</span>
            <Icon icon="lucide:beaker" className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-white">
            {actuators.syrupDispenser.isDispensing ? 'Dispensing' : 'Standby'}
          </div>
          <div className="text-[11px] text-zinc-500">
            Auto-Feed: {actuators.syrupDispenser.mode === 'AUTO' ? 'ON' : 'OFF'}
          </div>
        </Link>

        <Link
          to="/charts"
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 transition-colors space-y-1.5"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>24h Trends</span>
            <Icon icon="lucide:trending-up" className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-white">View Charts</div>
          <div className="text-[11px] text-zinc-500">Weight &amp; Climate</div>
        </Link>
      </div>
    </div>
  );
};
