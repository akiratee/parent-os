import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/lib/supabase';

// GET /api/events - List calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const events = await getCalendarEvents(startDate, endDate);
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new calendar event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.start_time) {
      return NextResponse.json(
        { error: 'Start time is required' },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be less than 200 characters' },
        { status: 400 }
      );
    }

    // Validate category if provided
    const validCategories = ['activity', 'meal', 'chore', 'appointment', 'other'];
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startTime = new Date(body.start_time);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start time format' },
        { status: 400 }
      );
    }

    if (body.end_time) {
      const endTime = new Date(body.end_time);
      if (isNaN(endTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end time format' },
          { status: 400 }
        );
      }
      if (endTime < startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    const event = await createCalendarEvent({
      title: body.title,
      description: body.description || '',
      start_time: body.start_time,
      end_time: body.end_time || body.start_time,
      all_day: body.all_day || false,
      family_member_id: body.family_member_id || null,
      category: body.category || 'other',
      is_recurring: body.is_recurring || false,
      recurrence_rule: body.recurrence_rule || null,
      created_by: body.created_by || 'system',
    });
    
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
