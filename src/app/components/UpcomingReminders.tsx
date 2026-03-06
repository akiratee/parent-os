'use client';

import { useState, useEffect } from 'react';
import { getUpcomingReminders, getReminderSettings, formatReminderTime, Reminder, ReminderSettings } from '@/lib/reminders';
import { CalendarEvent } from '@/lib/supabase';

interface UpcomingRemindersProps {
  events: CalendarEvent[];
}

export default function UpcomingReminders({ events }: UpcomingRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadedSettings = getReminderSettings();
    setSettings(loadedSettings);
    
    if (loadedSettings.enabled && events.length > 0) {
      const upcoming = getUpcomingReminders(events, loadedSettings);
      setReminders(upcoming);
    }
  }, [events]);

  const handleDismiss = (reminderKey: string) => {
    setDismissed(prev => new Set([...prev, reminderKey]));
  };

  // Filter out dismissed reminders
  const visibleReminders = reminders.filter(r => {
    const key = `${r.eventId}-${r.type}`;
    return !dismissed.has(key);
  });

  if (!settings?.enabled || visibleReminders.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔔</span>
        <h3 className="font-semibold text-gray-900">Upcoming Reminders</h3>
        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
          {visibleReminders.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {visibleReminders.slice(0, 5).map((reminder, index) => {
          const reminderKey = `${reminder.eventId}-${reminder.type}`;
          const timeLabel = formatReminderTime(reminder.reminderTime);
          
          return (
            <div 
              key={`${reminderKey}-${index}`}
              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  ⏰
                </div>
                <div>
                  <div className="font-medium text-gray-900">{reminder.eventTitle}</div>
                  <div className="text-sm text-gray-500">
                    {timeLabel} • {new Date(reminder.eventTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(reminderKey)}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
        
        {visibleReminders.length > 5 && (
          <div className="text-center text-sm text-gray-500">
            +{visibleReminders.length - 5} more reminders
          </div>
        )}
      </div>
    </div>
  );
}
