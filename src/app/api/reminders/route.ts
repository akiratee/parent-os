// Reminders API Route
// Provides endpoints for checking and triggering event reminders

import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents, expandRecurringEvents } from '@/lib/supabase';
import { getUpcomingReminders, ReminderSettings, DEFAULT_REMINDER_SETTINGS } from '@/lib/reminders';

// GET /api/reminders - Get upcoming reminders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get reminder settings from query params or use defaults
    const enabled = searchParams.get('enabled') !== 'false';
    const timesParam = searchParams.get('times');
    const times = timesParam 
      ? timesParam.split(',').map(t => parseInt(t) as 15 | 30 | 60 | 1440)
      : DEFAULT_REMINDER_SETTINGS.times;
    
    const settings: ReminderSettings = {
      enabled,
      times,
      channels: ['whatsapp'],
      familyMembers: [],
    };
    
    // Get events for the next 2 days (to cover all reminder windows)
    const now = new Date();
    const startDate = now.toISOString();
    const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    
    const events = await getCalendarEvents(startDate, endDate);
    
    if (!events || events.length === 0) {
      return NextResponse.json({
        upcomingReminders: [],
        eventsCount: 0,
      });
    }
    
    // Expand recurring events
    const expandedEvents = expandRecurringEvents(events, 1);
    
    // Get upcoming reminders
    const upcomingReminders = getUpcomingReminders(expandedEvents, settings);
    
    return NextResponse.json({
      upcomingReminders,
      eventsCount: expandedEvents.length,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// POST /api/reminders - Trigger a reminder notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, eventTime, reminderType } = body;
    
    // Validate required fields
    if (!eventId || !eventTitle || !eventTime) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, eventTitle, eventTime' },
        { status: 400 }
      );
    }
    
    // TODO: Integrate with WhatsApp webhook or other notification services
    // For now, return a placeholder response
    // In production, this would call the WhatsApp API to send a message
    
    console.log(`[REMINDER] Would send reminder for "${eventTitle}" at ${eventTime} (${reminderType} minutes before)`);
    
    return NextResponse.json({
      success: true,
      message: 'Reminder triggered',
      event: {
        id: eventId,
        title: eventTitle,
        time: eventTime,
        reminderType,
      },
      note: 'WhatsApp integration requires webhook configuration (Task 1062)',
    });
  } catch (error) {
    console.error('Error triggering reminder:', error);
    return NextResponse.json(
      { error: 'Failed to trigger reminder' },
      { status: 500 }
    );
  }
}
