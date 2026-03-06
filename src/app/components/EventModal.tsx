'use client';

import { useState, useEffect } from 'react';

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  category: 'activity' | 'meal' | 'chore' | 'appointment' | 'other';
  family_member_id?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  // Location-based reminder fields
  location?: string;
  location_lat?: number;
  location_lng?: number;
  location_radius?: number;
  location_triggers?: ('arrive' | 'leave')[];
}

type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: () => void;
  event?: CalendarEvent | null;
  selectedDate?: Date;
  familyMembers?: { id: string; name: string; color: string }[];
}

const categories = [
  { value: 'activity', label: 'Activity', color: '#10B981' },
  { value: 'meal', label: 'Meal', color: '#F59E0B' },
  { value: 'chore', label: 'Chore', color: '#8B5CF6' },
  { value: 'appointment', label: 'Appointment', color: '#EF4444' },
  { value: 'other', label: 'Other', color: '#6B7280' },
];

export default function EventModal({ isOpen, onClose, onSave, onDelete, event, selectedDate, familyMembers = [] }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState<CalendarEvent['category']>('activity');
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  // Location reminder state
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationRadius, setLocationRadius] = useState('100');
  const [locationTriggers, setLocationTriggers] = useState<('arrive' | 'leave')[]>(['arrive']);
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(event.start_time.split('T')[0]);
      setStartTime(event.start_time.split('T')[1]?.substring(0, 5) || '09:00');
      setEndTime(event.end_time.split('T')[1]?.substring(0, 5) || '10:00');
      setAllDay(event.all_day);
      setCategory(event.category);
      setFamilyMemberId(event.family_member_id || '');
      setIsRecurring(event.is_recurring || false);
      // Location fields
      setLocation(event.location || '');
      setLocationLat(event.location_lat?.toString() || '');
      setLocationLng(event.location_lng?.toString() || '');
      setLocationRadius(event.location_radius?.toString() || '100');
      setLocationTriggers(event.location_triggers || ['arrive']);
      // Parse recurrence rule if exists
      if (event.recurrence_rule) {
        const rule = event.recurrence_rule;
        if (rule.includes('DAILY')) setRecurrenceFrequency('daily');
        else if (rule.includes('MONTHLY')) setRecurrenceFrequency('monthly');
        else setRecurrenceFrequency('weekly');
        
        // Extract end date from rule
        const endMatch = rule.match(/UNTIL=(\d{8})/);
        if (endMatch) {
          const year = endMatch[1].slice(0, 4);
          const month = endMatch[1].slice(4, 6);
          const day = endMatch[1].slice(6, 8);
          setRecurrenceEndDate(`${year}-${month}-${day}`);
        }
      }
    } else if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setAllDay(false);
      setCategory('activity');
      setFamilyMemberId('');
      setIsRecurring(false);
      setRecurrenceFrequency('weekly');
      setRecurrenceEndDate('');
      // Reset location fields
      setLocation('');
      setLocationLat('');
      setLocationLng('');
      setLocationRadius('100');
      setLocationTriggers(['arrive']);
    }
  }, [event, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = allDay 
      ? `${date}T00:00:00` 
      : `${date}T${startTime}:00`;
    const endDateTime = allDay 
      ? `${date}T23:59:59` 
      : `${date}T${endTime}:00`;

    // Build recurrence rule (iCalendar format)
    let recurrenceRule: string | undefined;
    if (isRecurring) {
      const freq = recurrenceFrequency.toUpperCase();
      if (recurrenceEndDate) {
        const endDateStr = recurrenceEndDate.replace(/-/g, '');
        recurrenceRule = `FREQ=${freq};UNTIL=${endDateStr}`;
      } else {
        recurrenceRule = `FREQ=${freq}`;
      }
    }

    // Build location data
    const locationData = location ? {
      location,
      location_lat: locationLat ? parseFloat(locationLat) : undefined,
      location_lng: locationLng ? parseFloat(locationLng) : undefined,
      location_radius: locationRadius ? parseInt(locationRadius) : 100,
      location_triggers: locationTriggers,
    } : {};

    onSave({
      title,
      description,
      start_time: startDateTime,
      end_time: endDateTime,
      all_day: allDay,
      category,
      family_member_id: familyMemberId || undefined,
      is_recurring: isRecurring,
      recurrence_rule: recurrenceRule,
      ...locationData,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {event ? 'Edit Event' : 'New Event'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Soccer practice"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700">All day event</label>
          </div>

          {/* Time */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as CalendarEvent['category'])}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    category === cat.value
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={category === cat.value ? { backgroundColor: cat.color } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Family Member */}
          {familyMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <select
                value={familyMemberId}
                onChange={(e) => setFamilyMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring Event Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-700">Recurring event</label>
          </div>

          {/* Recurrence Options */}
          {isRecurring && (
            <div className="space-y-3 pl-6 border-l-2 border-indigo-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ends</label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
              </div>
            </div>
          )}

          {/* Location Reminder Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLocation"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="showLocation" className="text-sm text-gray-700">📍 Location reminder</label>
          </div>

          {/* Location Options */}
          {showLocation && (
            <div className="space-y-3 pl-6 border-l-2 border-green-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location name</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Soccer field, School, Grandma's house"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={locationLat}
                    onChange={(e) => setLocationLat(e.target.value)}
                    placeholder="e.g., 34.0522"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={locationLng}
                    onChange={(e) => setLocationLng(e.target.value)}
                    placeholder="e.g., -118.2437"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geofence radius (meters)</label>
                <input
                  type="number"
                  value={locationRadius}
                  onChange={(e) => setLocationRadius(e.target.value)}
                  placeholder="100"
                  min="50"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when within this distance (50-1000m)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notify when:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={locationTriggers.includes('arrive')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLocationTriggers([...locationTriggers, 'arrive']);
                        } else {
                          setLocationTriggers(locationTriggers.filter(t => t !== 'arrive'));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    🚗 Arriving
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={locationTriggers.includes('leave')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLocationTriggers([...locationTriggers, 'leave']);
                        } else {
                          setLocationTriggers(locationTriggers.filter(t => t !== 'leave'));
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    🏃 Leaving
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {event && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
            >
              {event ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
