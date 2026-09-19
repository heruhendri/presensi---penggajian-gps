/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters with high precision
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function isWithinRadius(
  userLat: number,
  userLng: number,
  officeLat: number,
  officeLng: number,
  radiusMeters: number
): boolean {
  const dist = calculateDistanceMeters(userLat, userLng, officeLat, officeLng);
  return dist <= radiusMeters;
}

export type GpsAccuracyLevel = 'high' | 'medium' | 'low';

export function getGpsAccuracyLevel(accuracyMeters: number): {
  level: GpsAccuracyLevel;
  label: string;
  color: string;
} {
  if (accuracyMeters <= 20) {
    return {
      level: 'high',
      label: 'Sangat Akurat (GPS Satelit)',
      color: 'text-emerald-500',
    };
  } else if (accuracyMeters <= 60) {
    return {
      level: 'medium',
      label: 'Cukup Akurat (GPS/Wi-Fi)',
      color: 'text-amber-500',
    };
  } else {
    return {
      level: 'low',
      label: 'Kurang Akurat (BTS Seluler / IP)',
      color: 'text-rose-500',
    };
  }
}

/**
 * Generate coordinate offset at specific distance in meters and bearing
 */
export function getOffsetCoordinates(
  centerLat: number,
  centerLng: number,
  distanceMeters: number,
  bearingDegrees: number = 45
): { lat: number; lng: number } {
  const R = 6371e3;
  const d = distanceMeters / R;
  const brng = (bearingDegrees * Math.PI) / 180;
  const lat1 = (centerLat * Math.PI) / 180;
  const lon1 = (centerLng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lon2 * 180) / Math.PI,
  };
}

export function getCurrentCoordinates(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
}): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser Anda'));
      return;
    }

    const highAcc = options?.enableHighAccuracy !== false;
    const timeoutMs = options?.timeout ?? 10000;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 10,
        });
      },
      (error) => {
        // If high accuracy timed out or failed, try low-accuracy fallback
        if (highAcc && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              resolve({
                lat: fallbackPos.coords.latitude,
                lng: fallbackPos.coords.longitude,
                accuracy: fallbackPos.coords.accuracy || 50,
              });
            },
            (fallbackErr) => {
              reject(formatGeolocationError(fallbackErr));
            },
            {
              enableHighAccuracy: false,
              timeout: 6000,
              maximumAge: 0,
            }
          );
          return;
        }
        reject(formatGeolocationError(error));
      },
      {
        enableHighAccuracy: highAcc,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

function formatGeolocationError(error: GeolocationPositionError): Error {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new Error('Akses lokasi ditolak. Silakan berikan izin GPS pada browser untuk presensi.');
    case error.POSITION_UNAVAILABLE:
      return new Error('Sinyal GPS tidak tersedia atau perangkat berada di area tanpa sinyal.');
    case error.TIMEOUT:
      return new Error('Waktu pencarian sinyal GPS habis. Coba refresh atau aktifkan GPS perangkat.');
    default:
      return new Error(error.message || 'Gagal membaca koordinat GPS perangkat.');
  }
}

