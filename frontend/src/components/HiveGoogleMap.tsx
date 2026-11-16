import React, { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
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

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const HAS_VALID_API_KEY =
  Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== 'your_google_maps_api_key_here';

interface LoadedMapSectionProps extends HiveGoogleMapProps {
  isGeofenceSafe: boolean;
  mapType: 'roadmap' | 'hybrid';
}

const LoadedMapSection: React.FC<LoadedMapSectionProps> = ({
  latitude,
  longitude,
  homeLat,
  homeLng,
  geofenceRadiusMeters,
  isGeofenceSafe,
  mapType,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  if (loadError) {
    return (
      <div className="h-[320px] bg-rose-950/40 text-rose-300 p-4 rounded-xl border border-rose-500/30 flex flex-col items-center justify-center text-center text-xs gap-2">
        <Icon icon="lucide:map-pin-off" className="w-6 h-6 text-rose-400" />
        <span>Unable to load Google Maps. Verify your VITE_GOOGLE_MAPS_API_KEY.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[320px] bg-zinc-900 animate-pulse rounded-xl flex items-center justify-center text-zinc-500 text-xs">
        Loading Hive GPS Map...
      </div>
    );
  }

  return (
    <MapContainer
      latitude={latitude}
      longitude={longitude}
      homeLat={homeLat}
      homeLng={homeLng}
      geofenceRadiusMeters={geofenceRadiusMeters}
      isGeofenceSafe={isGeofenceSafe}
      mapType={mapType}
    />
  );
};

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
    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
            <Icon icon="lucide:navigation" className="w-4 h-4 text-amber-400" />
            Live GPS &amp; Anti-Theft
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatCoordinates(props.latitude, props.longitude)}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isGeofenceSafe
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-bounce'
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

      {HAS_VALID_API_KEY ? (
        <LoadedMapSection
          {...props}
          isGeofenceSafe={isGeofenceSafe}
          mapType={mapType}
        />
      ) : (
        <div className="h-[300px] bg-zinc-900/70 border border-dashed border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2.5">
          <div className="p-3 rounded-full bg-black border border-zinc-800">
            <Icon icon="lucide:map" className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1 max-w-sm">
            <p className="text-xs font-semibold text-zinc-200">
              Google Maps Key Not Configured Yet
            </p>
            <p className="text-xs text-zinc-500">
              Add <code className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
              in <code className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">frontend/.env</code>{' '}
              to display the embedded map and {props.geofenceRadiusMeters}m geofence circle.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
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
          {HAS_VALID_API_KEY && (
            <button
              type="button"
              onClick={() => setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium transition-colors"
            >
              <Icon icon="lucide:layers" className="w-3.5 h-3.5" />
              {mapType === 'roadmap' ? 'Satellite' : 'Map'}
            </button>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-medium transition-colors"
          >
            <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};
