# ApisGuard — Free Map Setup with Leaflet (No API Key Required)

This guide explains how to use **Leaflet** + free map tiles in `frontend/` instead of Google Maps—so you get an interactive live hive GPS map, dark/satellite view toggle, hive marker, and `50 m` geofence circle with **no API key and no credit card**.

---

## 1. Install Leaflet in `frontend/`

`ApisGuard` uses `react@^18.3.1`. Using the core `leaflet` package directly (with TypeScript types) avoids any React version peer-dependency conflicts and stays lightweight:

```powershell
cd c:\project\ApisGuard\frontend
npm install leaflet
npm install -D @types/leaflet
```

*(Optional, if `registry.npmjs.org` resets TLS connections on your network, add `--registry=https://registry.yarnpkg.com` to both commands.)*

If you are completely replacing Google Maps, you can also uninstall `@react-google-maps/api`:

```powershell
npm uninstall @react-google-maps/api
```

---

## 2. Import Leaflet Styles

Add Leaflet's stylesheet once in `frontend/src/main.tsx` (or at the top of `MapContainer.tsx`):

```ts
import 'leaflet/dist/leaflet.css';
```

> **Note**: Without `leaflet/dist/leaflet.css`, map tiles will scatter across the page instead of aligning cleanly.

---

## 3. Free Tile Layers (No API Key Needed)

Leaflet needs a tile URL template for the map background. You can switch between a **Dark Map** (matches ApisGuard's black UI) and **Satellite View**:

| Mode in UI | Tile Provider | Tile URL |
| :--- | :--- | :--- |
| **Map (`roadmap`)** | CartoDB Dark Matter *(fits black UI)* | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` |
| **Map (alternative)** | OpenStreetMap Standard | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |
| **Satellite (`hybrid`)** | Esri World Imagery | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` |

---

## 4. How It Replaces `MapContainer.tsx`

In `frontend/src/components/MapContainer.tsx`, `MapContainer` already receives everything it needs as props:

- `latitude`, `longitude` (live hive GPS)
- `homeLat`, `homeLng` (geofence center)
- `geofenceRadiusMeters` (`50`)
- `isGeofenceSafe` (switches geofence color between green and red)
- `mapType` (`'roadmap'` | `'hybrid'`)

A clean Leaflet implementation inside `MapContainer.tsx` uses a `div` ref + `useEffect`:

```tsx
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

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
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

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 17,
      zoomControl: true,
    });

    const tile = L.tileLayer(mapType === 'hybrid' ? SATELLITE_TILES : DARK_TILES, {
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
      .bindTooltip('ApisGuard Hive', { direction: 'top' })
      .addTo(map);

    mapRef.current = map;
    tileRef.current = tile;
    circleRef.current = circle;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch tile layer when user toggles Map / Satellite
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileRef.current) {
      map.removeLayer(tileRef.current);
    }

    tileRef.current = L.tileLayer(mapType === 'hybrid' ? SATELLITE_TILES : DARK_TILES, {
      maxZoom: 19,
      attribution:
        mapType === 'hybrid' ? '&copy; Esri' : '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
  }, [mapType]);

  // Update live hive GPS marker and geofence color on telemetry updates
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

  return <div ref={containerRef} className="w-full h-[290px] rounded-xl overflow-hidden z-0" />;
};
```

---

## 5. Remove the API Key Gate in `HiveGoogleMap.tsx`

Currently [HiveGoogleMap.tsx](./frontend/src/components/HiveGoogleMap.tsx) checks `VITE_GOOGLE_MAPS_API_KEY` and shows a setup placeholder when no Google key is set. Once using Leaflet:

- Render `<MapContainer ... />` directly without `useJsApiLoader` or `HAS_VALID_API_KEY`.
- You no longer need `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env` (`VITE_API_BASE_URL` and `VITE_SOCKET_URL` are all that remain).

---

## 6. Vite & Styling Tips for Leaflet

1. **Why `L.circleMarker` (or `L.divIcon`) instead of `L.marker`?**
   In Vite production builds, Leaflet's default blue PNG pin (`marker-icon.png`) often breaks with a missing image icon unless assets are manually imported. `L.circleMarker` or an Iconify `L.divIcon` draws crisp vector pins with zero image path issues.
2. **Keep `z-0` on the map container**:
   Leaflet panes use high CSS `z-index` values (`400`+). Putting `z-0` / `relative z-0` on the map wrapper prevents the map from floating over the sticky top `Navbar` when scrolling on mobile.
3. **Explicit container height**:
   Leaflet renders blank if its container has `0px` height; keep `h-[290px]` (or another fixed height class) on the wrapper `div`.

---

## Next Step
If you want, I can apply this Leaflet replacement directly into [MapContainer.tsx](./frontend/src/components/MapContainer.tsx) and [HiveGoogleMap.tsx](./frontend/src/components/HiveGoogleMap.tsx) so your map works live right away without needing a Google Maps key.
