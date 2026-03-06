'use client';

import { useState, useEffect } from 'react';
import { getCalendarEvents, getFamilyMembers, CalendarEvent, expandRecurringEvents } from '@/lib/supabase';

interface ShareData {
  title: string;
  members: string[];
  createdAt: string;
}

interface CalendarEventWithMember extends CalendarEvent {
  family_member?: { name: string; color: string };
}

export default function SharePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [events, setEvents] = useState<CalendarEventWithMember[]>([]);
  const [familyMembers, setFamilyMembers] = useState<{ id: string; name: string; color: string }[]>([]);
  const [showListView, setShowListView] = useState(false);

  useEffect(() => {
    loadSharedCalendar();
  }, []);

  async function loadSharedCalendar() {
    try {
      setLoading(true);
      
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      // Legacy support: also check for old data param
      const dataParam = params.get('data');
      
      if (token) {
        // NEW: Token-based validation
        const response = await fetch(`/api/share?token=${encodeURIComponent(token)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Invalid or expired share link.');
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setShareData({
          title: data.title,
          members: data.members,
          createdAt: data.createdAt,
        });
        
        // Load calendar data
        const [eventsData, membersData] = await Promise.all([
          getCalendarEvents(),
          getFamilyMembers(),
        ]);
        
        setFamilyMembers(membersData || []);
        
        // Filter events by selected members if specified
        let filteredEvents = eventsData || [];
        if (data.members && data.members.length > 0) {
          filteredEvents = filteredEvents.filter((event: CalendarEvent) => 
            !event.family_member_id || data.members.includes(event.family_member_id)
          );
        }
        
        // Map family member data to events
        const eventsWithMembers = filteredEvents.map((event: any) => {
          const member = membersData?.find((m: any) => m.id === event.family_member_id);
          return {
            ...event,
            family_member: member ? { name: member.name, color: member.color } : undefined,
          };
        });
        
        // Expand recurring events
        const expandedEvents = expandRecurringEvents(eventsWithMembers, 3);
        setEvents(expandedEvents);
        
      } else if (dataParam) {
        // LEGACY: Base64-encoded data (deprecated but still supported for backward compatibility)
        console.warn('Using deprecated share link format. Consider regenerating a new share link.');
        
        const decoded = JSON.parse(atob(dataParam)) as ShareData;
        setShareData(decoded);
        
        // Load calendar data
        const [eventsData, membersData] = await Promise.all([
          getCalendarEvents(),
          getFamilyMembers(),
        ]);
        
        setFamilyMembers(membersData || []);
        
        // Filter events by selected members if specified
        let filteredEvents = eventsData || [];
        if (decoded.members && decoded.members.length > 0) {
          filteredEvents = filteredEvents.filter((event: CalendarEvent) => 
            !event.family_member_id || decoded.members.includes(event.family_member_id)
          );
        }
        
        // Map family member data to events
        const eventsWithMembers = filteredEvents.map((event: any) => {
          const member = membersData?.find((m: any) => m.id === event.family_member_id);
          return {
            ...event,
            family_member: member ? { name: member.name, color: member.color } : undefined,
          };
        });
        
        // Expand recurring events
        const expandedEvents = expandRecurringEvents(eventsWithMembers, 3);
        setEvents(expandedEvents);
      } else {
        setError('No share data found. Please use a valid share link.');
        setLoading(false);
        return;
      }
      
    } catch (err) {
      console.error('Error loading shared calendar:', err);
      setError('Failed to load shared calendar. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.start_time.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEventWithMember[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  // Get category color
  function getCategoryColor(category: string) {
    switch (category) {
      case 'activity': return '#10B981';
      case 'meal': return '#F59E0B';
      case 'chore': return '#8B5CF6';
      case 'appointment': return '#EF4444';
      default: return '#6B7280';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Calendar</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📅 {shareData?.title || 'Shared Calendar'}</h1>
              <p className="text-gray-500 text-sm">View-only access</p>
            </div>
            <button
              onClick={() => setShowListView(!showListView)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {showListView ? '📅 Calendar View' : '📋 List View'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Security Info Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-green-800">
            <span>🔐</span>
            <span className="text-sm">
              This is a secure, read-only view of the calendar. You can view events but cannot make changes.
              {shareData?.createdAt && (
                <span className="text-green-600 ml-2">
                  Link created {new Date(shareData.createdAt).toLocaleDateString()}
                </span>
              )}
            </span>
          </div>
        </div>

        {showListView ? (
          /* List View */
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Events</h2>
            
            {sortedDates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No events to display.
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
                            style={{ backgroundColor: getCategoryColor(event.category) }}
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
                            {event.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {event.description}
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
          /* Simple Calendar Grid View */
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                
                const cells = [];
                
                // Empty cells before first day
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg"></div>);
                }
                
                // Day cells
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = dateStr === today.toISOString().split('T')[0];
                  
                  cells.push(
                    <div 
                      key={day}
                      className={`h-24 p-1 rounded-lg overflow-y-auto ${
                        isToday ? 'bg-indigo-50 border-2 border-indigo-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm font-medium ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      {dayEvents.slice(0, 3).map((event) => (
                        <div 
                          key={event.id}
                          className="text-xs px-1 py-0.5 mt-1 rounded truncate"
                          style={{ 
                            backgroundColor: getCategoryColor(event.category) + '20',
                            color: getCategoryColor(event.category)
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 mt-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  );
                }
                
                return cells;
              })()}
            </div>
          </div>
        )}

        {/* Family Members Legend */}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
