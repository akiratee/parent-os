// Events API Route Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock the supabase client - must match actual exports used in route
vi.mock('@/lib/supabase', () => ({
  getCalendarEvents: vi.fn(),
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  getFamilyMembers: vi.fn(),
  createFamilyCommand: vi.fn(),
  getFamilyCommands: vi.fn(),
}));

import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/lib/supabase';

const mockGetCalendarEvents = getCalendarEvents as ReturnType<typeof vi.fn>;
const mockCreateCalendarEvent = createCalendarEvent as ReturnType<typeof vi.fn>;
const mockDeleteCalendarEvent = deleteCalendarEvent as ReturnType<typeof vi.fn>;

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all events', async () => {
    const events = [
      { id: 'evt-1', title: 'Soccer', start_time: '2026-02-28T10:00:00Z' },
      { id: 'evt-2', title: 'Piano', start_time: '2026-02-28T15:00:00Z' },
    ];
    mockGetCalendarEvents.mockResolvedValue(events);

    const request = new NextRequest('http://localhost/api/events');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events).toEqual(events);
  });

  it('should return empty array when no events', async () => {
    mockGetCalendarEvents.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/events');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.events).toEqual([]);
  });

  it('should handle database errors', async () => {
    mockGetCalendarEvents.mockRejectedValue(new Error('DB connection failed'));

    const request = new NextRequest('http://localhost/api/events');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to fetch events');
  });

  it('should pass date filters to getCalendarEvents', async () => {
    mockGetCalendarEvents.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/events?startDate=2026-02-01&endDate=2026-02-28');
    await GET(request);
    
    expect(mockGetCalendarEvents).toHaveBeenCalledWith('2026-02-01', '2026-02-28');
  });
});

describe('POST /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create event with valid data', async () => {
    const newEvent = {
      title: 'Doctor appointment',
      description: 'Annual checkup',
      start_time: '2026-03-01T10:00:00',
      end_time: '2026-03-01T10:30:00',
      all_day: false,
      category: 'appointment',
    };
    mockCreateCalendarEvent.mockResolvedValue({ id: 'evt-3', ...newEvent });

    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify(newEvent),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.event.id).toBe('evt-3');
    expect(json.event.title).toBe('Doctor appointment');
  });

  it('should return 400 for missing title', async () => {
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ start_time: '2026-03-01T10:00:00' }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Title is required');
  });

  it('should return 400 for missing start_time', async () => {
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test event' }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Start time is required');
  });

  it('should return 400 for title exceeding 200 characters', async () => {
    const longTitle = 'a'.repeat(201);
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: longTitle, start_time: '2026-03-01T10:00:00' }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Title must be less than 200 characters');
  });

  it('should return 400 for invalid category', async () => {
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', start_time: '2026-03-01T10:00:00', category: 'invalid' }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Category must be one of');
  });

  it('should return 400 for invalid start time format', async () => {
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', start_time: 'not-a-date' }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid start time format');
  });

  it('should return 400 for end time before start time', async () => {
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ 
        title: 'Test', 
        start_time: '2026-03-01T10:00:00',
        end_time: '2026-03-01T09:00:00'
      }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('End time must be after start time');
  });

  it('should handle database errors gracefully', async () => {
    mockCreateCalendarEvent.mockRejectedValue(new Error('DB connection failed'));

    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test event', start_time: '2026-03-01T10:00:00' }),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to create event');
  });
});
