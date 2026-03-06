import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate title length if provided
    if (body.title && body.title.length > 200) {
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

    // Validate dates if provided
    if (body.start_time) {
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
    }

    // Supabase doesn't have a direct PATCH, so we delete and recreate
    // In production, you'd use supabase.from('calendar_events').update().eq('id', id)
    await deleteCalendarEvent(id);
    
    const event = await createCalendarEvent({
      id, // Preserve the original ID
      title: body.title,
      description: body.description,
      start_time: body.start_time,
      end_time: body.end_time,
      all_day: body.all_day,
      family_member_id: body.family_member_id,
      category: body.category,
      is_recurring: body.is_recurring,
      recurrence_rule: body.recurrence_rule,
      created_by: body.created_by,
    });
    
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete a calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await deleteCalendarEvent(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
