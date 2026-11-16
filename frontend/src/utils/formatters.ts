export function formatTemp(value: number): string {
  return `${value.toFixed(1)} °C`;
}

export function formatWeight(value: number): string {
  return `${value.toFixed(2)} kg`;
}

export function formatSignedWeight(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)} kg`;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
}

export function formatTimeShort(isoOrTimestamp: string | number): string {
  const date = typeof isoOrTimestamp === 'number' ? new Date(isoOrTimestamp * 1000) : new Date(isoOrTimestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getWifiLabel(rssi: number): string {
  if (rssi >= -60) return 'Excellent';
  if (rssi >= -70) return 'Good';
  if (rssi >= -80) return 'Fair';
  return 'Weak';
}
