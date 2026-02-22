'use client';

import { useState, useEffect } from 'react';
import { parseCommand, generateResponse } from '@/lib/command-parser';
import { getCalendarEvents, getFamilyMembers } from '@/lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  category: string;
  family_member?: { name: string; color: string };
}

export default function ParentOSPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);

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
      setEvents(eventsData || []);
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
    // Check for browser support
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

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.start_time.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">👨‍👩‍👧‍👦 Parent OS</h1>
          <p className="text-gray-500 text-sm">Voice-first family coordination</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Family Calendar</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : sortedDates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No events yet. Try adding one with voice!
            </p>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="font-medium text-gray-700 mb-3">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <div className="space-y-2">
                    {eventsByDate[date].map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
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

        {/* Family Members */}
        {familyMembers.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👨‍👩‍👧‍👦 Family Members</h2>
            <div className="flex flex-wrap gap-3">
              {familyMembers.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
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
          </div>
        )}
      </main>
    </div>
  );
}
