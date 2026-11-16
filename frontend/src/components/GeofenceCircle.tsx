import React from 'react';
import { Circle } from '@react-google-maps/api';

interface GeofenceCircleProps {
  homeLat: number;
  homeLng: number;
  radiusMeters: number;
  isGeofenceSafe: boolean;
}

export const GeofenceCircle: React.FC<GeofenceCircleProps> = ({
  homeLat,
  homeLng,
  radiusMeters,
  isGeofenceSafe,
}) => {
  return (
    <Circle
      center={{ lat: homeLat, lng: homeLng }}
      radius={radiusMeters}
      options={{
        fillColor: isGeofenceSafe ? '#10B981' : '#EF4444',
        fillOpacity: 0.15,
        strokeColor: isGeofenceSafe ? '#059669' : '#DC2626',
        strokeWeight: 2,
      }}
    />
  );
};
