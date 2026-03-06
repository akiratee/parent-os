// Event Reminder System for Parent OS
// Handles reminder preferences and checking for upcoming events

import { CalendarEvent } from './supabase';

// Reminder time options in minutes
export type ReminderTime = 15 | 30 | 60 | 1440; // 15min, 30min, 1hr, 1day

export interface ReminderSettings {
  enabled: boolean;
  times: ReminderTime[];
  channels: ('whatsapp' | 'push')[];
  familyMembers: string[]; // empty = all members
}

export interface Reminder {
  eventId: string;
  eventTitle: string;
  eventTime: Date;
  reminderTime: Date;
  type: ReminderTime;
}

// Default reminder settings
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  times: [15, 60], // 15 minutes and 1 hour before
  channels: ['whatsapp'],
  familyMembers: [],
};

// Storage key
const REMINDER_SETTINGS_KEY = 'parent_os_reminder_settings';
const SENT_REMINDERS_KEY = 'parent_os_sent_reminders';

// Get reminder settings from localStorage (client-side)
export function getReminderSettings(): ReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_SETTINGS;
  
  try {
    const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading reminder settings:', e);
  }
  return DEFAULT_REMINDER_SETTINGS;
}

// Save reminder settings to localStorage (client-side)
export function saveReminderSettings(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving reminder settings:', e);
  }
}

// Get the unique key for a sent reminder (to avoid duplicates)
export function getSentReminderKey(eventId: string, reminderTime: Date): string {
  return `${eventId}-${reminderTime.toISOString()}`;
}

// Get all sent reminders (client-side)
export function getSentReminders(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(SENT_REMINDERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Error reading sent reminders:', e);
    return {};
  }
}

// Mark a reminder as sent (client-side)
export function markReminderSent(eventId: string, reminderTime: Date): void {
  if (typeof window === 'undefined') return;
  
  try {
    const sent = getSentReminders();
    sent[getSentReminderKey(eventId, reminderTime)] = true;
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sent));
  } catch (e) {
    console.error('Error marking reminder sent:', e);
  }
}

// Check if a reminder has already been sent (client-side)
export function wasReminderSent(eventId: string, reminderTime: Date): boolean {
  const sent = getSentReminders();
  return !!sent[getSentReminderKey(eventId, reminderTime)];
}

// Clear old sent reminders (older than 24 hours)
export function clearOldSentReminders(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const sent = getSentReminders();
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const filtered: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(sent)) {
      // Extract the reminder time from the key
      const parts = key.split('-');
      const timeStr = parts.slice(-2).join('-'); // Last two parts are ISO date
      const reminderTime = new Date(timeStr);
      
      if (reminderTime > cutoff) {
        filtered[key] = value;
      }
    }
    
    localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error clearing old reminders:', e);
  }
}

// Calculate upcoming reminders for a list of events
export function getUpcomingReminders(events: CalendarEvent[], settings: ReminderSettings): Reminder[] {
  if (!settings.enabled || settings.times.length === 0) {
    return [];
  }
  
  const reminders: Reminder[] = [];
  const now = new Date();
  
  for (const event of events) {
    // Skip if event doesn't have a valid start time
    if (!event.start_time) continue;
    
    const eventTime = new Date(event.start_time);
    
    // Skip past events
    if (eventTime <= now) continue;
    
    // Check each reminder time
    for (const minutes of settings.times) {
      const reminderTime = new Date(eventTime.getTime() - minutes * 60 * 1000);
      
      // Only include future reminders (within next 24 hours)
      const maxReminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (reminderTime > now && reminderTime <= maxReminderTime) {
        reminders.push({
          eventId: event.id,
          eventTitle: event.title,
          eventTime,
          reminderTime,
          type: minutes,
        });
      }
    }
  }
  
  // Sort by reminder time
  reminders.sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime());
  
  return reminders;
}

// Get human-readable reminder time
export function getReminderTimeLabel(minutes: number): string {
  switch (minutes) {
    case 15:
      return '15 minutes before';
    case 30:
      return '30 minutes before';
    case 60:
      return '1 hour before';
    case 1440:
      return '1 day before';
    default:
      return `${minutes} minutes before`;
  }
}

// Format reminder time for display
export function formatReminderTime(reminderTime: Date): string {
  const now = new Date();
  const diff = reminderTime.getTime() - now.getTime();
  const minutes = Math.round(diff / 60 / 1000);
  
  if (minutes < 60) {
    return `in ${minutes} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.round(minutes / 1440);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
}
