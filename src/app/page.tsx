'use client';

import { useState, useEffect } from 'react';
import { parseCommand, generateResponse } from '@/lib/command-parser';
import { getCalendarEvents, getFamilyMembers, createCalendarEvent, deleteCalendarEvent, createFamilyMember, updateFamilyMember, deleteFamilyMember, CalendarEvent, expandRecurringEvents } from '@/lib/supabase';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import FamilyMemberModal from './components/FamilyMemberModal';
import ReminderSettingsModal from './components/ReminderSettingsModal';
import LocationReminderSettingsModal from './components/LocationReminderSettingsModal';
import ShareCalendarModal from './components/ShareCalendarModal';
import UpcomingReminders from './components/UpcomingReminders';

interface CalendarEventWithMember extends CalendarEvent {
  family_member?: { name: string; color: string };
}

export default function ParentOSPage() {
  const [events, setEvents] = useState<CalendarEventWithMember[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithMember | null>(null);
  const [showListView, setShowListView] = useState(false);
  
  // Family member modal state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Reminder settings modal state
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  
  // Location reminder settings modal state
  const [showLocationReminderSettings, setShowLocationReminderSettings] = useState(false);
  
  // Share calendar modal state
  const [showShareCalendar, setShowShareCalendar] = useState(false);
  
  // Filter state
  const [filterMemberId, setFilterMemberId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [eventsData, membersData] = await Promise.all([
        getCalendarEvents(),
        getFamilyMembers(),
      ]);
      
      // Map family member data to events
      const eventsWithMembers = (eventsData || []).map((event: any) => {
        const member = membersData?.find((m: any) => m.id === event.family_member_id);
        return {
          ...event,
          family_member: member ? { name: member.name, color: member.color } : undefined,
        };
      });
      
      // Expand recurring events for display
      const expandedEvents = expandRecurringEvents(eventsWithMembers, 3);
      
      setEvents(expandedEvents);
      setFamilyMembers(membersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleVoiceInput(text: string) {
    const parsed = parseCommand(text);
    const responseText = generateResponse(parsed);
    
    setParsedCommand(parsed);
    setResponse(responseText);
    setVoiceInput('');
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceInput(text);
      handleVoiceInput(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  async function handleSaveEvent(eventData: Partial<CalendarEvent>) {
    try {
      await createCalendarEvent(eventData);
      await loadData(); // Refresh events
      setShowEventModal(false);
      setSelectedEvent(null);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  }

  function handleEventClick(event: any) {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setShowEventModal(true);
  }

  async function handleDeleteEvent() {
    if (!selectedEvent?.id) return;
    
    try {
      await deleteCalendarEvent(selectedEvent.id);
      await loadData(); // Refresh events
      setShowEventModal(false);
      setSelectedEvent(null);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  }

  // Family member handlers
  function handleAddMember() {
    setSelectedMember(null);
    setShowMemberModal(true);
  }

  function handleEditMember(member: any) {
    setSelectedMember(member);
    setShowMemberModal(true);
  }

  async function handleSaveMember(memberData: { name: string; relation: string; color: string }) {
    try {
      if (selectedMember?.id) {
        await updateFamilyMember(selectedMember.id, memberData);
      } else {
        await createFamilyMember(memberData);
      }
      await loadData();
      setShowMemberModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error saving family member:', error);
      alert('Failed to save family member. Please try again.');
    }
  }

  async function handleDeleteMember() {
    if (!selectedMember?.id) return;
    
    try {
      await deleteFamilyMember(selectedMember.id);
      await loadData();
      setShowMemberModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error deleting family member:', error);
      alert('Failed to delete family member. Please try again.');
    }
  }

  // Group events by date for list view
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.start_time.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEventWithMember[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  // Filter events by family member
  const filteredEvents = filterMemberId 
    ? events.filter(e => e.family_member_id === filterMemberId)
    : events;

  const filteredEventsByDate = filteredEvents.reduce((acc, event) => {
    const date = event.start_time.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEventWithMember[]>);

  const filteredSortedDates = Object.keys(filteredEventsByDate).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👨‍👩‍👧‍👦 Parent OS</h1>
              <p className="text-gray-500 text-sm">Voice-first family coordination</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareCalendar(true)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Share Calendar"
              >
                📤
              </button>
              <button
                onClick={() => setShowReminderSettings(true)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Reminder Settings"
              >
                🔔
              </button>
              <button
                onClick={() => setShowLocationReminderSettings(true)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Location Reminder Settings"
              >
                📍
              </button>
              <button
                onClick={() => setShowListView(!showListView)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {showListView ? '📅 Calendar View' : '📋 List View'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Voice Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🎤 Voice Command</h2>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVoiceInput(voiceInput)}
              placeholder="Try: Add soccer practice tomorrow at 4pm"
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={startListening}
              disabled={isListening}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isListening ? 'Listening...' : '🎤 Speak'}
            </button>
          </div>

          {/* Parsed Result */}
          {parsedCommand && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">
                <strong>Intent:</strong> {parsedCommand.intent.replace(/_/g, ' ')}
              </div>
              {parsedCommand.entities.title && (
                <div className="text-sm text-gray-500 mb-1">
                  <strong>Title:</strong> {parsedCommand.entities.title}
                </div>
              )}
              {parsedCommand.entities.date && (
                <div className="text-sm text-gray-500 mb-1">
                  <strong>Date:</strong> {parsedCommand.entities.date}
                </div>
              )}
              {parsedCommand.entities.time && (
                <div className="text-sm text-gray-500 mb-1">
                  <strong>Time:</strong> {parsedCommand.entities.time}
                </div>
              )}
              {parsedCommand.entities.category && (
                <div className="text-sm text-gray-500">
                  <strong>Category:</strong> {parsedCommand.entities.category}
                </div>
              )}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-indigo-700">
              {response}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <UpcomingReminders events={events} />

        {/* Calendar / List Toggle */}
        {showListView ? (
          /* List View */
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Events</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : filteredSortedDates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {filterMemberId 
                  ? 'No events for selected family member.' 
                  : 'No events yet. Try adding one with voice or click on the calendar!'}
              </p>
            ) : (
              <div className="space-y-6">
                {filteredSortedDates.map((date) => (
                  <div key={date}>
                    <h3 className="font-medium text-gray-700 mb-3">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="space-y-2">
                      {filteredEventsByDate[date].map((event) => (
                        <div 
                          key={event.id}
                          onClick={() => handleEventClick(event as CalendarEventWithMember)}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ 
                              backgroundColor: 
                                event.category === 'activity' ? '#10B981' :
                                event.category === 'meal' ? '#F59E0B' :
                                event.category === 'chore' ? '#8B5CF6' :
                                event.category === 'appointment' ? '#EF4444' :
                                '#6B7280'
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{event.title}</div>
                            {!event.all_day && (
                              <div className="text-sm text-gray-500">
                                {new Date(event.start_time).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                                {event.family_member && (
                                  <span style={{ color: event.family_member.color }}>
                                     • {event.family_member.name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-xl shadow-lg p-6">
            <Calendar 
              events={filteredEvents} 
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </div>
        )}

        {/* Family Members */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">👨‍👩‍👧‍👦 Family Members</h2>
            <button
              onClick={handleAddMember}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Add Member
            </button>
          </div>
          
          {/* Filter by member */}
          {familyMembers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Filter events by:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterMemberId('')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    !filterMemberId 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setFilterMemberId(member.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filterMemberId === member.id 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={filterMemberId === member.id ? { backgroundColor: member.color } : {}}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {familyMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No family members yet. Click "Add Member" to get started!
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {familyMembers.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => handleEditMember(member)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <span className="text-gray-700">{member.name}</span>
                  <span className="text-gray-400 text-sm">({member.relation})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setSelectedDate(undefined);
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent?.id ? handleDeleteEvent : undefined}
        event={selectedEvent || undefined}
        selectedDate={selectedDate}
        familyMembers={familyMembers}
      />

      {/* Family Member Modal */}
      <FamilyMemberModal
        isOpen={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setSelectedMember(null);
        }}
        onSave={handleSaveMember}
        onDelete={selectedMember?.id ? handleDeleteMember : undefined}
        member={selectedMember || undefined}
      />

      {/* Reminder Settings Modal */}
      <ReminderSettingsModal
        isOpen={showReminderSettings}
        onClose={() => setShowReminderSettings(false)}
      />

      {/* Location Reminder Settings Modal */}
      <LocationReminderSettingsModal
        isOpen={showLocationReminderSettings}
        onClose={() => setShowLocationReminderSettings(false)}
      />

      {/* Share Calendar Modal */}
      <ShareCalendarModal
        isOpen={showShareCalendar}
        onClose={() => setShowShareCalendar(false)}
        familyMembers={familyMembers}
        events={events}
      />
    </div>
  );
}
