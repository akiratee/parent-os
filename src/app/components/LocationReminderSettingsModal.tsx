'use client';

import { useState, useEffect } from 'react';
import {
  getLocationReminderSettings,
  saveLocationReminderSettings,
  getSavedLocations,
  saveLocation,
  deleteLocation,
  SavedLocation,
  DEFAULT_LOCATION_REMINDER_SETTINGS,
} from '@/lib/location-reminders';

interface LocationReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationReminderSettingsModal({ isOpen, onClose }: LocationReminderSettingsModalProps) {
  const [settings, setSettings] = useState(DEFAULT_LOCATION_REMINDER_SETTINGS);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', lat: '', lng: '', radius: '100' });
  const [showAddLocation, setShowAddLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getLocationReminderSettings());
      setSavedLocations(getSavedLocations());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveLocationReminderSettings(settings);
    onClose();
  };

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.lat || !newLocation.lng) return;
    
    const location: SavedLocation = {
      id: Date.now().toString(),
      name: newLocation.name,
      address: newLocation.address,
      lat: parseFloat(newLocation.lat),
      lng: parseFloat(newLocation.lng),
      radius: parseInt(newLocation.radius) || 100,
    };
    
    saveLocation(location);
    setSavedLocations(getSavedLocations());
    setNewLocation({ name: '', address: '', lat: '', lng: '', radius: '100' });
    setShowAddLocation(false);
  };

  const handleDeleteLocation = (id: string) => {
    deleteLocation(id);
    setSavedLocations(getSavedLocations());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            📍 Location Reminder Settings
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Location Reminders</div>
              <div className="text-sm text-gray-500">Get notified based on your location</div>
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

          {/* Default Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default geofence radius
            </label>
            <select
              value={settings.defaultRadius}
              onChange={(e) => setSettings({ ...settings, defaultRadius: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="50">50 meters</option>
              <option value="100">100 meters</option>
              <option value="150">150 meters</option>
              <option value="200">200 meters</option>
              <option value="500">500 meters</option>
            </select>
          </div>

          {/* Notify Triggers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default notification triggers
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={settings.notifyOnArrive}
                  onChange={(e) => setSettings({ ...settings, notifyOnArrive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                🚗 Notify on arrival
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={settings.notifyOnLeave}
                  onChange={(e) => setSettings({ ...settings, notifyOnLeave: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                🏃 Notify on departure
              </label>
            </div>
          </div>

          {/* Saved Locations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Saved Locations
              </label>
              <button
                onClick={() => setShowAddLocation(!showAddLocation)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showAddLocation ? 'Cancel' : '+ Add Location'}
              </button>
            </div>

            {savedLocations.length === 0 && !showAddLocation ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No saved locations. Add common places like home, school, or work.
              </p>
            ) : (
              <div className="space-y-2">
                {savedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-800">{loc.name}</div>
                      <div className="text-xs text-gray-500">
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} • {loc.radius}m radius
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Location Form */}
            {showAddLocation && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    placeholder="e.g., Soccer Field"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={newLocation.lat}
                      onChange={(e) => setNewLocation({ ...newLocation, lat: e.target.value })}
                      placeholder="34.0522"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={newLocation.lng}
                      onChange={(e) => setNewLocation({ ...newLocation, lng: e.target.value })}
                      placeholder="-118.2437"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Radius (meters)</label>
                  <input
                    type="number"
                    value={newLocation.radius}
                    onChange={(e) => setNewLocation({ ...newLocation, radius: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={handleAddLocation}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  Save Location
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
