// WhatsApp Webhook API Route Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest, NextResponse } from 'next/server';

// Mock the dependencies
vi.mock('@/lib/command-parser', () => ({
  parseCommand: vi.fn(),
  generateResponse: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  createCalendarEvent: vi.fn(),
  createFamilyCommand: vi.fn(),
}));

import { parseCommand, generateResponse } from '@/lib/command-parser';
import { createCalendarEvent, createFamilyCommand } from '@/lib/supabase';

const mockParseCommand = parseCommand as ReturnType<typeof vi.fn>;
const mockGenerateResponse = generateResponse as ReturnType<typeof vi.fn>;
const mockCreateCalendarEvent = createCalendarEvent as ReturnType<typeof vi.fn>;
const mockCreateFamilyCommand = createFamilyCommand as ReturnType<typeof vi.fn>;

describe('GET /api/whatsapp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 for invalid verify token', async () => {
    const url = new URL('http://localhost/api/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=test');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Verification failed');
  });

  it('should return 200 and challenge for valid verification', async () => {
    const url = new URL('http://localhost/api/whatsapp?hub.mode=subscribe&hub.verify_token=parent_os_verify_token&hub.challenge=test123');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('test123');
  });

  it('should return 200 with custom verify token from env', async () => {
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'custom_token');
    const url = new URL('http://localhost/api/whatsapp?hub.mode=subscribe&hub.verify_token=custom_token&hub.challenge=abc');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('abc');
    vi.unstubAllEnvs();
  });

  it('should return 403 for missing hub.mode', async () => {
    const url = new URL('http://localhost/api/whatsapp?hub.verify_token=test&hub.challenge=abc');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    
    expect(response.status).toBe(403);
  });
});

describe('POST /api/whatsapp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'parent_os_verify_token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 400 for empty message', async () => {
    const body = { message: '', from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('No message provided');
  });

  it('should return 400 for message exceeding 2000 characters', async () => {
    const longMessage = 'a'.repeat(2001);
    const body = { message: longMessage, from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Message too long (max 2000 characters)');
  });

  it('should return 429 for rate limiting', async () => {
    // First request succeeds
    mockParseCommand.mockReturnValue({
      intent: 'add_event',
      confidence: 0.8,
      entities: { title: 'Test' },
      originalText: 'add test event',
    });
    mockGenerateResponse.mockReturnValue("I'll add that to the calendar.");
    mockCreateFamilyCommand.mockResolvedValue({ id: 'cmd-1' });

    const body = { message: 'add test event', from: '1234567890' };
    
    // Make multiple requests to trigger rate limit
    for (let i = 0; i < 31; i++) {
      const request = new NextRequest('http://localhost/api/whatsapp', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      await POST(request);
    }
    
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe('Rate limit exceeded');
  });

  it('should parse and respond to valid message', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'add_event',
      confidence: 0.8,
      entities: { title: 'Soccer practice', date: '2026-02-28', time: '16:00:00' },
      originalText: 'add soccer practice tomorrow at 4pm',
    });
    mockGenerateResponse.mockReturnValue("I'll add soccer practice to the calendar on 2026-02-28 at 16:00:00.");
    mockCreateFamilyCommand.mockResolvedValue({ id: 'cmd-1' });
    mockCreateCalendarEvent.mockResolvedValue({ id: 'evt-1' });

    const body = { message: 'add soccer practice tomorrow at 4pm', from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.parsed.intent).toBe('add_event');
    expect(json.response).toBe("I'll add soccer practice to the calendar on 2026-02-28 at 16:00:00.");
    expect(json.eventCreated).toBe(true);
    expect(mockCreateFamilyCommand).toHaveBeenCalled();
    expect(mockCreateCalendarEvent).toHaveBeenCalled();
  });

  it('should handle message from different webhook formats', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'check_schedule',
      confidence: 0.7,
      entities: { date: '2026-02-28' },
      originalText: "what's on the schedule tomorrow",
    });
    mockGenerateResponse.mockReturnValue("Let me check what's on the schedule for 2026-02-28...");
    mockCreateFamilyCommand.mockResolvedValue({ id: 'cmd-2' });

    // Test with 'text' field
    const body = { text: "what's on the schedule tomorrow", phone: '9876543210' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.parsed.intent).toBe('check_schedule');
    expect(json.sender).toBe('9876543210');
  });

  it('should handle database errors gracefully', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'add_event',
      confidence: 0.8,
      entities: { title: 'Test' },
      originalText: 'add test',
    });
    mockGenerateResponse.mockReturnValue("I'll add that.");
    mockCreateFamilyCommand.mockRejectedValue(new Error('DB connection failed'));

    const body = { message: 'add test', from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    // Should still return success even if DB fails
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('should sanitize message input', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'unknown',
      confidence: 0.3,
      entities: {},
      originalText: '  test  ',
    });
    mockGenerateResponse.mockReturnValue("I'm not sure what you mean.");

    const body = { message: '  test  ', from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(mockParseCommand).toHaveBeenCalledWith('test');
  });

  it('should handle missing sender gracefully', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'ask_question',
      confidence: 0.5,
      entities: { title: 'dinner' },
      originalText: 'what about dinner',
    });
    mockGenerateResponse.mockReturnValue("Let me find out about dinner for you.");

    const body = { message: 'what about dinner' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.sender).toBe('unknown');
  });

  it('should handle add_event without time', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'add_event',
      confidence: 0.6,
      entities: { title: 'Doctor appointment', date: '2026-03-01' },
      originalText: 'add doctor appointment on march 1',
    });
    mockGenerateResponse.mockReturnValue("I'll add Doctor appointment to the calendar on 2026-03-01.");
    mockCreateFamilyCommand.mockResolvedValue({ id: 'cmd-3' });
    mockCreateCalendarEvent.mockResolvedValue({ id: 'evt-2' });

    const body = { message: 'add doctor appointment on march 1', from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.eventCreated).toBe(true);
    // Should default to 9am
    const eventCall = mockCreateCalendarEvent.mock.calls[0][0];
    expect(eventCall.start_time).toContain('T09:00:00');
  });

  it('should handle add_event with duration', async () => {
    mockParseCommand.mockReturnValue({
      intent: 'add_event',
      confidence: 0.7,
      entities: { title: 'Meeting', date: '2026-02-28', time: '14:00:00', duration: '1 hour' },
      originalText: 'add meeting tomorrow at 2pm for 1 hour',
    });
    mockGenerateResponse.mockReturnValue("I'll add Meeting to the calendar.");
    mockCreateFamilyCommand.mockResolvedValue({ id: 'cmd-4' });
    mockCreateCalendarEvent.mockResolvedValue({ id: 'evt-3' });

    const body = { message: 'add meeting tomorrow at 2pm for 1 hour', from: '1234567890' };
    const request = new NextRequest('http://localhost/api/whatsapp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const eventCall = mockCreateCalendarEvent.mock.calls[0][0];
    // End time should be 1 hour after start (14:00 + 1 hour = 15:00 in the same timezone)
    // Note: The actual time depends on the server timezone, so we check that duration was applied
    const startTime = new Date(eventCall.start_time);
    const endTime = new Date(eventCall.end_time);
    const diffMs = endTime.getTime() - startTime.getTime();
    expect(diffMs).toBe(3600000); // 1 hour in milliseconds
  });
});
