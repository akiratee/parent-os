'use client';

import { useState, useEffect } from 'react';
import { ReminderSettings, ReminderTime, getReminderSettings, saveReminderSettings, getReminderTimeLabel } from '@/lib/reminders';

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReminderSettingsModal({ isOpen, onClose }: ReminderSettingsModalProps) {
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    times: [15, 60],
    channels: ['whatsapp'],
    familyMembers: [],
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getReminderSettings();
      setSettings(stored);
    }
  }, [isOpen]);

  const handleToggleTime = (time: ReminderTime) => {
    const newTimes = settings.times.includes(time)
      ? settings.times.filter(t => t !== time)
      : [...settings.times, time].sort((a, b) => a - b);
    
    setSettings({ ...settings, times: newTimes });
  };

  const handleSave = () => {
    saveReminderSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  const reminderTimeOptions: ReminderTime[] = [15, 30, 60, 1440];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">🔔 Reminder Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Event Reminders</div>
              <div className="text-sm text-gray-500">Get notified before events</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reminder Times */}
          <div>
            <div className="font-medium text-gray-900 mb-3">When to remind</div>
            <div className="space-y-2">
              {reminderTimeOptions.map((time) => (
                <label
                  key={time}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={settings.times.includes(time)}
                    onChange={() => handleToggleTime(time)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{getReminderTimeLabel(time)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800">
              <strong>ℹ️ Note:</strong> WhatsApp reminders require the webhook to be configured (Task 1062). 
              Currently, reminders will be tracked locally and can be displayed in the app.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
