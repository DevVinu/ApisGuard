import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { calculateDistanceMeters, isInsideGeofence } from '../utils/geofence';
import { formatCoordinates } from '../utils/formatters';
import { InkFrame } from './InkFrame';
import { MapContainer } from './MapContainer';

interface HiveGoogleMapProps {
  latitude: number;
  longitude: number;
  homeLat: number;
  homeLng: number;
  geofenceRadiusMeters: number;
  satellites: number;
  altitudeMeters: number;
}

export const HiveGoogleMap: React.FC<HiveGoogleMapProps> = (props) => {
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const distanceFromHome = calculateDistanceMeters(
    props.latitude,
    props.longitude,
    props.homeLat,
    props.homeLng
  );
  const isGeofenceSafe = isInsideGeofence(
    props.latitude,
    props.longitude,
    props.homeLat,
    props.homeLng,
    props.geofenceRadiusMeters
  );
  const googleMapsUrl = `https://www.google.com/maps?q=${props.latitude},${props.longitude}`;

  return (
    <div className="relative isolate ll-paper p-4 flex flex-col justify-between gap-3 transition-colors">
      <InkFrame seed={71} strokeWidth={1.8} doublePass className="text-[var(--ll-ink)]" />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-hand font-bold text-[var(--ll-ink)] flex items-center gap-2 text-lg sm:text-xl">
            <Icon icon="lucide:navigation" className="w-4 h-4 text-[var(--ll-marker)]" />
            Live GPS &amp; Anti-Theft
          </h2>
          <p className="text-xs text-[var(--ll-ink-muted)] mt-0.5">
            {formatCoordinates(props.latitude, props.longitude)}
          </p>
        </div>

        <span
          className={`relative isolate inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold ${
            isGeofenceSafe
              ? 'bg-[var(--ll-sticky-green)] text-[var(--ll-green)]'
              : 'bg-[var(--ll-sticky-pink)] text-[var(--ll-red)] animate-bounce'
          }`}
        >
          <InkFrame seed={72} strokeWidth={1.3} className="text-[var(--ll-ink)]" />
          <Icon
            icon={isGeofenceSafe ? 'lucide:shield-check' : 'lucide:shield-alert'}
            className="w-3.5 h-3.5"
          />
          {isGeofenceSafe
            ? `Within ${props.geofenceRadiusMeters}m Zone`
            : 'GEOFENCE BREACH'}
        </span>
      </div>

      <MapContainer
        latitude={props.latitude}
        longitude={props.longitude}
        homeLat={props.homeLat}
        homeLng={props.homeLng}
        geofenceRadiusMeters={props.geofenceRadiusMeters}
        isGeofenceSafe={isGeofenceSafe}
        mapType={mapType}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--ll-ink-muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Icon icon="lucide:satellite" className="w-3.5 h-3.5" />
            {props.satellites} sats
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon icon="lucide:mountain" className="w-3.5 h-3.5" />
            {props.altitudeMeters.toFixed(1)} m alt
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon icon="lucide:radar" className="w-3.5 h-3.5" />
            {distanceFromHome.toFixed(1)} m from base
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="relative isolate inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--ll-slip)] hover:bg-[var(--ll-paper-shade)] text-[var(--ll-ink)] font-semibold ll-btn"
          >
            <InkFrame seed={73} strokeWidth={1.4} className="text-[var(--ll-ink)]" />
            <Icon icon="lucide:layers" className="w-3.5 h-3.5" />
            {mapType === 'roadmap' ? 'Satellite' : 'Map'}
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="relative isolate inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--ll-hi)]/75 hover:bg-[var(--ll-hi)] text-[var(--ll-ink)] font-semibold ll-btn"
          >
            <InkFrame seed={74} strokeWidth={1.4} className="text-[var(--ll-ink)]" />
            <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};
