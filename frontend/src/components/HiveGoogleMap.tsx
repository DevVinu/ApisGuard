import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { calculateDistanceMeters, isInsideGeofence } from '../utils/geofence';
import { formatCoordinates } from '../utils/formatters';
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
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <Icon icon="lucide:navigation" className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Live GPS &amp; Anti-Theft
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {formatCoordinates(props.latitude, props.longitude)}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isGeofenceSafe
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-bounce'
          }`}
        >
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

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Icon icon="lucide:satellite" className="w-3.5 h-3.5 text-zinc-500" />
            {props.satellites} sats
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon icon="lucide:mountain" className="w-3.5 h-3.5 text-zinc-500" />
            {props.altitudeMeters.toFixed(1)} m alt
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon icon="lucide:radar" className="w-3.5 h-3.5 text-zinc-500" />
            {distanceFromHome.toFixed(1)} m from base
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-800 font-medium transition-colors"
          >
            <Icon icon="lucide:layers" className="w-3.5 h-3.5" />
            {mapType === 'roadmap' ? 'Satellite' : 'Map'}
          </button>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium transition-colors"
          >
            <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};
