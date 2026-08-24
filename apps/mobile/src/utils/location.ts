/**
 * Location Utility
 * 
 * Location-based services for place verification.
 * Checks if user is within place boundaries.
 * 
 * @module utils/location
 */

import * as Location from 'expo-location';
import { logger } from './logger';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if user is within place boundaries
 * @param userLocation - User's current location
 * @param placeLocation - Place location
 * @param radiusMeters - Allowed radius in meters (default: 200m)
 * @returns true if user is within radius
 */
export function isWithinPlaceRadius(
  userLocation: PlaceLocation,
  placeLocation: PlaceLocation,
  radiusMeters: number = 200
): boolean {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    placeLocation.latitude,
    placeLocation.longitude
  );
  return distance <= radiusMeters;
}

/**
 * Request location permissions and get current location
 */
export async function getCurrentLocation(): Promise<PlaceLocation | null> {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    // First try to get last known location for speed
    let location = await Location.getLastKnownPositionAsync();
    
    // If no last known location, request current with a timeout
    if (!location) {
      location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      ]);
    }

    if (!location) return null;

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    logger.error('Error getting location:', error);
    return null;
  }
}
