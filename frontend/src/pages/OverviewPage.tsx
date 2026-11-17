import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AlertBanner } from '../components/AlertBanner';
import { HiveGoogleMap } from '../components/HiveGoogleMap';
import { InkFrame } from '../components/InkFrame';
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
        <h1 className="font-script text-2xl sm:text-[1.7rem] font-bold text-[var(--ll-ink)] leading-none">
          Hive Overview
        </h1>
        <span className="relative isolate px-3 py-1 bg-[var(--ll-sticky-yellow)] text-xs font-semibold text-[var(--ll-ink)]">
          <InkFrame seed={12} strokeWidth={1.3} className="text-[var(--ll-ink)]" />
          Live GPS &amp; Telemetry
        </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link
          to="/controls"
          className="relative isolate ll-slip p-3.5 space-y-1.5 ll-btn"
        >
          <InkFrame seed={21} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
          <div className="flex items-center justify-between text-[var(--ll-ink-muted)] text-xs">
            <span>Entrance Gate</span>
            <Icon icon="lucide:door-open" className="w-4 h-4 text-[var(--ll-marker)]" />
          </div>
          <div className="font-hand text-lg font-bold text-[var(--ll-ink)] leading-tight">
            {actuators.entranceGate.position.replace('_', ' ')}
          </div>
          <div className="text-[11px] text-[var(--ll-ink-muted)]">
            Angle: {actuators.entranceGate.angle}°
          </div>
        </Link>

        <Link
          to="/controls"
          className="relative isolate ll-slip p-3.5 space-y-1.5 ll-btn"
        >
          <InkFrame seed={22} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
          <div className="flex items-center justify-between text-[var(--ll-ink-muted)] text-xs">
            <span>Sugar Syrup</span>
            <Icon icon="lucide:beaker" className="w-4 h-4 text-[var(--ll-marker)]" />
          </div>
          <div className="font-hand text-lg font-bold text-[var(--ll-ink)] leading-tight">
            {actuators.syrupDispenser.isDispensing ? 'Dispensing' : 'Standby'}
          </div>
          <div className="text-[11px] text-[var(--ll-ink-muted)]">
            Auto-Feed: {actuators.syrupDispenser.mode === 'AUTO' ? 'ON' : 'OFF'}
          </div>
        </Link>

        <Link
          to="/charts"
          className="relative isolate ll-slip p-3.5 space-y-1.5 ll-btn"
        >
          <InkFrame seed={23} strokeWidth={1.6} className="text-[var(--ll-ink)]" />
          <div className="flex items-center justify-between text-[var(--ll-ink-muted)] text-xs">
            <span>24h Trends</span>
            <Icon icon="lucide:trending-up" className="w-4 h-4 text-[var(--ll-marker)]" />
          </div>
          <div className="font-hand text-lg font-bold text-[var(--ll-ink)] leading-tight">
            View Charts
          </div>
          <div className="text-[11px] text-[var(--ll-ink-muted)]">Weight &amp; Climate</div>
        </Link>
      </div>
    </div>
  );
};
