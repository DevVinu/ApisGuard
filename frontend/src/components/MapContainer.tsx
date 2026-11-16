import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  latitude: number;
  longitude: number;
  homeLat: number;
  homeLng: number;
  geofenceRadiusMeters: number;
  isGeofenceSafe: boolean;
  mapType: 'roadmap' | 'hybrid';
}

const MAP_TILE_API_KEY = import.meta.env.VITE_MAP_TILE_API_KEY || '';
const VOYAGER_TILES = MAP_TILE_API_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${MAP_TILE_API_KEY}`
  : 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const SATELLITE_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const MapContainer: React.FC<MapContainerProps> = ({
  latitude,
  longitude,
  homeLat,
  homeLng,
  geofenceRadiusMeters,
  isGeofenceSafe,
  mapType,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 17,
      zoomControl: true,
    });

    const tile = L.tileLayer(mapType === 'hybrid' ? SATELLITE_TILES : VOYAGER_TILES, {
      maxZoom: 19,
      attribution:
        mapType === 'hybrid' ? '&copy; Esri' : '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    const circle = L.circle([homeLat, homeLng], {
      radius: geofenceRadiusMeters,
      color: isGeofenceSafe ? '#10b981' : '#f43f5e',
      fillColor: isGeofenceSafe ? '#10b981' : '#f43f5e',
      fillOpacity: 0.14,
      weight: 2,
    }).addTo(map);

    const marker = L.circleMarker([latitude, longitude], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#f59e0b',
      fillOpacity: 1,
    })
      .bindTooltip('ApisGuard Hive 01', { direction: 'top' })
      .addTo(map);

    mapRef.current = map;
    tileRef.current = tile;
    circleRef.current = circle;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      circleRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileRef.current) {
      map.removeLayer(tileRef.current);
    }

    tileRef.current = L.tileLayer(mapType === 'hybrid' ? SATELLITE_TILES : VOYAGER_TILES, {
      maxZoom: 19,
      attribution:
        mapType === 'hybrid' ? '&copy; Esri' : '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
  }, [mapType]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.setLatLng([latitude, longitude]);
    map.panTo([latitude, longitude], { animate: true });

    circleRef.current?.setLatLng([homeLat, homeLng]);
    circleRef.current?.setRadius(geofenceRadiusMeters);
    circleRef.current?.setStyle({
      color: isGeofenceSafe ? '#10b981' : '#f43f5e',
      fillColor: isGeofenceSafe ? '#10b981' : '#f43f5e',
    });
  }, [latitude, longitude, homeLat, homeLng, geofenceRadiusMeters, isGeofenceSafe]);

  return (
    <div
      ref={containerRef}
      className="relative z-0 w-full h-[290px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
    />
  );
};
