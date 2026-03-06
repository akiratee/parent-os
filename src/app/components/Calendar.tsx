'use client';

import { useState, useMemo } from 'react';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  category: string;
  family_member?: { name: string; color: string };
  is_recurring?: boolean;
  recurrence_rule?: string;
  [key: string]: any; // Allow additional properties
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const categoryColors: Record<string, string> = {
  activity: '#10B981',
  meal: '#F59E0B',
  chore: '#8B5CF6',
  appointment: '#EF4444',
  other: '#6B7280',
};

export default function Calendar({ events, onEventClick, onDateClick }: CalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = event.start_time.split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Generate month calendar grid
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add days from previous month to fill the first week
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }
    
    // Add all days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to fill the last week
    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentDate]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + direction * 7);
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {monthDays.map((day, idx) => {
        const dayEvents = getEventsForDate(day);
        return (
          <div
            key={idx}
            onClick={() => onDateClick?.(day)}
            className={`
              min-h-[80px] p-1 border rounded cursor-pointer transition-colors
              ${isToday(day) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}
              ${!isCurrentMonth(day) ? 'bg-gray-50' : 'bg-white'}
            `}
          >
            <div className={`
              text-sm font-medium mb-1
              ${isToday(day) ? 'text-indigo-600' : isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'}
            `}>
              {day.getDate()}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                  className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 flex items-center gap-1"
                  style={{ 
                    backgroundColor: categoryColors[event.category] || categoryColors.other,
                    color: 'white'
                  }}
                  title={event.title}
                >
                  {event.is_recurring && <span title="Recurring">🔄</span>}
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, idx) => {
        const dayEvents = getEventsForDate(day);
        return (
          <div
            key={idx}
            onClick={() => onDateClick?.(day)}
            className={`
              min-h-[200px] p-2 border rounded cursor-pointer
              ${isToday(day) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}
            `}
          >
            <div className="text-center mb-2">
              <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-lg font-medium ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
            </div>
            <div className="space-y-1">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                  className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 flex items-center gap-1"
                  style={{ 
                    backgroundColor: categoryColors[event.category] || categoryColors.other,
                    color: 'white'
                  }}
                >
                  {event.is_recurring && <span title="Recurring">🔄</span>}
                  {event.all_day ? 'All day' : new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} {event.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            const eventHour = new Date(event.start_time).getHours();
            return eventHour === hour;
          });
          
          return (
            <div key={hour} className="flex border-b border-gray-100 py-2">
              <div className="w-16 text-sm text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="flex-1 min-h-[30px]">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="text-sm px-2 py-1 rounded cursor-pointer hover:opacity-80 flex items-center gap-1"
                    style={{ 
                      backgroundColor: categoryColors[event.category] || categoryColors.other,
                      color: 'white'
                    }}
                  >
                    {event.is_recurring && <span title="Recurring">🔄</span>}
                    {event.title}
                    {!event.all_day && (
                      <span className="ml-2 opacity-75">
                        {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="calendar-component">
      {/* View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
          <h3 className="text-lg font-semibold text-gray-800 ml-2">
            {viewMode === 'day' 
              ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
          </h3>
        </div>
        
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                viewMode === mode 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {Object.entries(categoryColors).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-gray-600 capitalize">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
