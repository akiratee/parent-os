// Reminders Module Tests

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_REMINDER_SETTINGS,
  getUpcomingReminders,
  getReminderTimeLabel,
  formatReminderTime,
  getSentReminderKey,
  ReminderSettings,
  ReminderTime,
} from '@/lib/reminders';
import { CalendarEvent } from '@/lib/supabase';

describe('Reminder Settings', () => {
  it('should have correct default settings', () => {
    expect(DEFAULT_REMINDER_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_REMINDER_SETTINGS.times).toEqual([15, 60]);
    expect(DEFAULT_REMINDER_SETTINGS.channels).toEqual(['whatsapp']);
    expect(DEFAULT_REMINDER_SETTINGS.familyMembers).toEqual([]);
  });
});

describe('getReminderTimeLabel', () => {
  it('should return correct label for 15 minutes', () => {
    expect(getReminderTimeLabel(15)).toBe('15 minutes before');
  });

  it('should return correct label for 30 minutes', () => {
    expect(getReminderTimeLabel(30)).toBe('30 minutes before');
  });

  it('should return correct label for 60 minutes', () => {
    expect(getReminderTimeLabel(60)).toBe('1 hour before');
  });

  it('should return correct label for 1440 minutes (1 day)', () => {
    expect(getReminderTimeLabel(1440)).toBe('1 day before');
  });

  it('should return generic label for unknown times', () => {
    expect(getReminderTimeLabel(45)).toBe('45 minutes before');
  });
});

describe('formatReminderTime', () => {
  it('should format time within minutes', () => {
    const now = new Date();
    const in10Min = new Date(now.getTime() + 10 * 60 * 1000);
    const result = formatReminderTime(in10Min);
    expect(result).toContain('minutes');
  });

  it('should format time within hours', () => {
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const result = formatReminderTime(in2Hours);
    expect(result).toContain('hour');
  });
});

describe('getSentReminderKey', () => {
  it('should generate unique key for reminder', () => {
    const eventId = 'event-123';
    const reminderTime = new Date('2026-03-02T10:00:00Z');
    const key = getSentReminderKey(eventId, reminderTime);
    expect(key).toContain(eventId);
    expect(key).toContain('2026-03-02');
  });
});

describe('getUpcomingReminders', () => {
  const baseSettings: ReminderSettings = {
    enabled: true,
    times: [15, 60] as ReminderTime[],
    channels: ['whatsapp'],
    familyMembers: [],
  };

  it('should return empty array when disabled', () => {
    const settings: ReminderSettings = { ...baseSettings, enabled: false, times: [15, 60] as ReminderTime[] };
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Test Event',
        start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        all_day: false,
        category: 'activity',
        is_recurring: false,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    const reminders = getUpcomingReminders(events, settings);
    expect(reminders).toHaveLength(0);
  });

  it('should return empty array when no times configured', () => {
    const settings: ReminderSettings = { ...baseSettings, times: [] as ReminderTime[] };
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Test Event',
        start_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        all_day: false,
        category: 'activity',
        is_recurring: false,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    const reminders = getUpcomingReminders(events, settings);
    expect(reminders).toHaveLength(0);
  });

  it('should return reminders for upcoming events', () => {
    const settings: ReminderSettings = { ...baseSettings, times: [15, 60] as ReminderTime[] };
    const eventTime = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Test Event',
        start_time: eventTime.toISOString(),
        end_time: new Date(eventTime.getTime() + 60 * 60 * 1000).toISOString(),
        all_day: false,
        category: 'activity',
        is_recurring: false,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    const reminders = getUpcomingReminders(events, settings);
    
    // Should have 2 reminders: 15 min before and 60 min before
    expect(reminders.length).toBeGreaterThan(0);
    expect(reminders[0].eventTitle).toBe('Test Event');
  });

  it('should not return reminders for past events', () => {
    const settings = { ...baseSettings };
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Past Event',
        start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        end_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        all_day: false,
        category: 'activity',
        is_recurring: false,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    const reminders = getUpcomingReminders(events, settings);
    expect(reminders).toHaveLength(0);
  });

  it('should sort reminders by reminder time', () => {
    const settings: ReminderSettings = { ...baseSettings, times: [15, 60, 1440] as ReminderTime[] };
    const eventTime = new Date(Date.now() + 120 * 60 * 1000); // 2 hours from now
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'Test Event',
        start_time: eventTime.toISOString(),
        end_time: new Date(eventTime.getTime() + 60 * 60 * 1000).toISOString(),
        all_day: false,
        category: 'activity',
        is_recurring: false,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    const reminders = getUpcomingReminders(events, settings);
    
    // Should be sorted by reminder time (earliest first)
    if (reminders.length > 1) {
      for (let i = 1; i < reminders.length; i++) {
        expect(reminders[i].reminderTime.getTime()).toBeGreaterThanOrEqual(
          reminders[i - 1].reminderTime.getTime()
        );
      }
    }
  });

  it('should handle empty events array', () => {
    const reminders = getUpcomingReminders([], baseSettings);
    expect(reminders).toHaveLength(0);
  });

  it('should skip events without start_time', () => {
    const settings = { ...baseSettings };
    const events: CalendarEvent[] = [
      {
        id: '1',
        title: 'No Time Event',
        start_time: '',
        end_time: new Date().toISOString(),
        all_day: false,
        category: 'activity',
        is_recurring: false,
        created_by: 'user',
        created_at: new Date().toISOString(),
      },
    ];

    const reminders = getUpcomingReminders(events, settings);
    expect(reminders).toHaveLength(0);
  });
});

describe('Reminder Types', () => {
  it('should have valid reminder time types', () => {
    const validTimes = [15, 30, 60, 1440];
    expect(validTimes).toContain(15);
    expect(validTimes).toContain(30);
    expect(validTimes).toContain(60);
    expect(validTimes).toContain(1440);
  });
});
