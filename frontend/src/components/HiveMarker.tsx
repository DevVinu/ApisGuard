import React from 'react';
import { Marker } from '@react-google-maps/api';

interface HiveMarkerProps {
  latitude: number;
  longitude: number;
}

export const HiveMarker: React.FC<HiveMarkerProps> = ({ latitude, longitude }) => {
  return <Marker position={{ lat: latitude, lng: longitude }} title="ApisGuard Hive 01" />;
};
