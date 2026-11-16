import React, { useMemo } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { GeofenceCircle } from './GeofenceCircle';
import { HiveMarker } from './HiveMarker';

interface MapContainerProps {
  latitude: number;
  longitude: number;
  homeLat: number;
  homeLng: number;
  geofenceRadiusMeters: number;
  isGeofenceSafe: boolean;
  mapType: 'roadmap' | 'hybrid';
}

const mapContainerStyle = {
  width: '100%',
  height: '290px',
  borderRadius: '0.75rem',
};

export const MapContainer: React.FC<MapContainerProps> = ({
  latitude,
  longitude,
  homeLat,
  homeLng,
  geofenceRadiusMeters,
  isGeofenceSafe,
  mapType,
}) => {
  const center = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={17}
      options={{
        mapTypeId: mapType,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      <HiveMarker latitude={latitude} longitude={longitude} />
      <GeofenceCircle
        homeLat={homeLat}
        homeLng={homeLng}
        radiusMeters={geofenceRadiusMeters}
        isGeofenceSafe={isGeofenceSafe}
      />
    </GoogleMap>
  );
};
