// Location-Based Reminder System for Parent OS
// Handles geofenced alerts - notify when arriving/leaving locations

import { CalendarEvent } from './supabase';

export interface LocationReminderSettings {
  enabled: boolean;
  defaultRadius: number; // in meters
  notifyOnArrive: boolean;
  notifyOnLeave: boolean;
  familyMembers: string[]; // empty = all members
}

export interface LocationReminder {
  eventId: string;
  eventTitle: string;
  location: string;
  trigger: 'arrive' | 'leave';
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius?: number;
}

// Default settings
export const DEFAULT_LOCATION_REMINDER_SETTINGS: LocationReminderSettings = {
  enabled: true,
  defaultRadius: 100, // 100 meters
  notifyOnArrive: true,
  notifyOnLeave: true,
  familyMembers: [],
};

// Storage keys
const LOCATION_SETTINGS_KEY = 'parent_os_location_settings';
const SAVED_LOCATIONS_KEY = 'parent_os_saved_locations';
const LOCATION_ALERTS_KEY = 'parent_os_location_alerts';

// Get location reminder settings
export function getLocationReminderSettings(): LocationReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_LOCATION_REMINDER_SETTINGS;
  
  try {
    const stored = localStorage.getItem(LOCATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_LOCATION_REMINDER_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading location reminder settings:', e);
  }
  return DEFAULT_LOCATION_REMINDER_SETTINGS;
}

// Save location reminder settings
export function saveLocationReminderSettings(settings: LocationReminderSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving location reminder settings:', e);
  }
}

// Get saved locations (common places like school, home, etc.)
export function getSavedLocations(): SavedLocation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return stored ? JSON.parse(stored) : getDefaultLocations();
  } catch (e) {
    console.error('Error reading saved locations:', e);
    return getDefaultLocations();
  }
}

// Default common locations
function getDefaultLocations(): SavedLocation[] {
  return [
    { id: 'home', name: 'Home', address: '', lat: 0, lng: 0, radius: 100 },
    { id: 'school', name: 'School', address: '', lat: 0, lng: 0, radius: 150 },
    { id: 'work', name: 'Work', address: '', lat: 0, lng: 0, radius: 100 },
  ];
}

// Save a new location
export function saveLocation(location: SavedLocation): void {
  if (typeof window === 'undefined') return;
  
  try {
    const locations = getSavedLocations();
    const existingIndex = locations.findIndex(l => l.id === location.id);
    if (existingIndex >= 0) {
      locations[existingIndex] = location;
    } else {
      locations.push(location);
    }
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
  } catch (e) {
    console.error('Error saving location:', e);
  }
}

// Delete a saved location
export function deleteLocation(locationId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const locations = getSavedLocations().filter(l => l.id !== locationId);
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
  } catch (e) {
    console.error('Error deleting location:', e);
  }
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if current position is within geofence
export function isWithinGeofence(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
  return distance <= radiusMeters;
}

// Get events with location reminders
export function getEventsWithLocationReminders(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => 
    event.location && 
    (event.location_lat !== undefined || event.location_lng !== undefined)
  );
}

// Parse location string to extract potential coordinates
// This is a basic implementation - in production you'd use a geocoding API
export function parseLocationString(location: string): { lat: number; lng: number } | null {
  // Look for coordinates in format "name @ lat, lng" or "name (lat, lng)"
  const coordMatch = location.match(/@?\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
    };
  }
  
  return null;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// Get human-readable trigger description
export function getTriggerDescription(trigger: 'arrive' | 'leave', locationName: string): string {
  if (trigger === 'arrive') {
    return `When arriving at ${locationName}`;
  }
  return `When leaving ${locationName}`;
}

// Track location alerts to avoid duplicate notifications
export function getLocationAlerts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(LOCATION_ALERTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error reading location alerts:', e);
    return {};
  }
}

// Mark a location alert as sent
export function markLocationAlertSent(eventId: string, trigger: 'arrive' | 'leave'): void {
  if (typeof window === 'undefined') return;
  
  try {
    const alerts = getLocationAlerts();
    const key = `${eventId}-${trigger}`;
    alerts[key] = Date.now();
    localStorage.setItem(LOCATION_ALERTS_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('Error marking location alert sent:', e);
  }
}

// Check if a location alert was recently sent (within last hour)
export function wasLocationAlertSent(eventId: string, trigger: 'arrive' | 'leave'): boolean {
  const alerts = getLocationAlerts();
  const key = `${eventId}-${trigger}`;
  const lastSent = alerts[key];
  
  if (!lastSent) return false;
  
  // Check if within last hour
  return Date.now() - lastSent < 60 * 60 * 1000;
}

// Clear old location alerts (older than 24 hours)
export function clearOldLocationAlerts(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const alerts = getLocationAlerts();
    const now = Date.now();
    const cutoff = 24 * 60 * 60 * 1000;
    
    const filtered: Record<string, number> = {};
    for (const [key, timestamp] of Object.entries(alerts)) {
      if (now - timestamp < cutoff) {
        filtered[key] = timestamp;
      }
    }
    
    localStorage.setItem(LOCATION_ALERTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error clearing old location alerts:', e);
  }
}
