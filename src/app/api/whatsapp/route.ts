// WhatsApp Webhook API Route
// Receives voice commands from WhatsApp via OpenClaw and returns parsed results

import { NextRequest, NextResponse } from 'next/server';
import { parseCommand, generateResponse } from '@/lib/command-parser';
import { createCalendarEvent, createFamilyCommand, getCalendarEvents, deleteCalendarEvent, updateCalendarEvent, findEventByTitle } from '@/lib/supabase';

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  // WhatsApp webhook verification (GET challenge)
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');
  
  // Verify token - should match env var in production
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'parent_os_verify_token';
  
  if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
    console.log('WhatsApp webhook verified');
    return new NextResponse(hubChallenge, { status: 200 });
  }
  
  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    
    // Extract message from various webhook formats
    const message = body.message || body.text || body.body || '';
    const sender = body.from || body.sender || body.phone || 'unknown';
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedMessage = message.trim().slice(0, 2000);
    
    // Parse the command using the NLP parser
    const parsed = parseCommand(sanitizedMessage);
    
    // Generate a natural language response (use let so it can be updated for check_schedule)
    let responseText = generateResponse(parsed);

    // Try to process the command (create event if applicable)
    let eventResult = null;
    let commandResult = null;
    let scheduleEvents = null;
    
    try {
      // Store the command for history
      commandResult = await createFamilyCommand({
        original_text: sanitizedMessage,
        parsed_intent: parsed.intent,
        extracted_data: parsed.entities,
      });
      
      // If add_event intent and we have required fields, create the event
      if (parsed.intent === 'add_event' && parsed.entities.title) {
        const startTime = parsed.entities.date 
          ? `${parsed.entities.date}T${parsed.entities.time || '09:00:00'}`
          : new Date().toISOString();
        
        // Calculate end time from duration if provided
        let endTime = startTime;
        if (parsed.entities.duration) {
          const startDate = new Date(startTime);
          const durationStr = parsed.entities.duration.toLowerCase();
          
          // Parse duration (e.g., "1 hour", "30 minutes", "2 hours 30 minutes")
          let totalMinutes = 0;
          
          const hourMatch = durationStr.match(/(\d+)\s*hour/i);
          const minuteMatch = durationStr.match(/(\d+)\s*minute/i);
          
          if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
          if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);
          
          // Default to 1 hour if no match
          if (totalMinutes === 0) totalMinutes = 60;
          
          startDate.setMinutes(startDate.getMinutes() + totalMinutes);
          endTime = startDate.toISOString();
        }
        
        eventResult = await createCalendarEvent({
          title: parsed.entities.title,
          description: `Voice command from ${sender}`,
          start_time: startTime,
          end_time: endTime,
          all_day: !parsed.entities.time,
          category: (parsed.entities.category as any) || 'other',
          is_recurring: !!parsed.entities.recurrence,
          recurrence_rule: parsed.entities.recurrence || undefined,
          created_by: sender,
        });
      }
      
      // If check_schedule intent, fetch events for the requested date
      if (parsed.intent === 'check_schedule') {
        const targetDate = parsed.entities.date || new Date().toISOString().split('T')[0];
        const startOfDay = `${targetDate}T00:00:00`;
        const endOfDay = `${targetDate}T23:59:59`;
        
        try {
          const events = await getCalendarEvents(startOfDay, endOfDay);
          scheduleEvents = events || [];
          
          // Generate a more helpful response based on events found
          if (scheduleEvents.length === 0) {
            responseText = `Nothing scheduled for ${targetDate}. Would you like to add something?`;
          } else if (scheduleEvents.length === 1) {
            const evt = scheduleEvents[0];
            const time = evt.all_day ? 'all day' : new Date(evt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            responseText = `You have 1 thing on ${targetDate}: "${evt.title}" at ${time}.`;
          } else {
            const eventList = scheduleEvents.slice(0, 5).map((evt: any, i: number) => {
              const time = evt.all_day ? 'all day' : new Date(evt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              return `${i + 1}. ${evt.title} at ${time}`;
            }).join('\n');
            const more = scheduleEvents.length > 5 ? `\n...and ${scheduleEvents.length - 5} more` : '';
            responseText = `You have ${scheduleEvents.length} things on ${targetDate}:\n${eventList}${more}`;
          }
        } catch (scheduleError) {
          console.error('Error fetching schedule:', scheduleError);
        }
      }
      
      // If modify_event intent, update an existing event
      if (parsed.intent === 'modify_event' && parsed.entities.title) {
        try {
          const targetDate = parsed.entities.date || undefined;
          const events = await findEventByTitle(parsed.entities.title, targetDate);
          
          if (!events || events.length === 0) {
            responseText = `I couldn't find an event called "${parsed.entities.title}"${targetDate ? ` on ${targetDate}` : ''}. Would you like me to add it instead?`;
          } else if (events.length === 1) {
            const event = events[0];
            const updates: any = {};
            
            if (parsed.entities.date) {
              const oldStart = new Date(event.start_time);
              const oldEnd = new Date(event.end_time);
              const duration = oldEnd.getTime() - oldStart.getTime();
              
              const newStart = new Date(`${parsed.entities.date}T${parsed.entities.time || '09:00:00'}`);
              const newEnd = new Date(newStart.getTime() + duration);
              
              updates.start_time = newStart.toISOString();
              updates.end_time = newEnd.toISOString();
            }
            
            if (parsed.entities.time && !parsed.entities.date) {
              const oldStart = new Date(event.start_time);
              const oldEnd = new Date(event.end_time);
              const duration = oldEnd.getTime() - oldStart.getTime();
              
              const [hours, minutes] = parsed.entities.time.split(':');
              const newStart = new Date(oldStart);
              newStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              const newEnd = new Date(newStart.getTime() + duration);
              
              updates.start_time = newStart.toISOString();
              updates.end_time = newEnd.toISOString();
            }
            
            if (parsed.entities.title !== event.title) {
              updates.title = parsed.entities.title;
            }
            
            const updatedEvent = await updateCalendarEvent(event.id, updates);
            responseText = `Done! Updated "${updatedEvent.title}"${parsed.entities.date ? ` to ${parsed.entities.date}` : ''}${parsed.entities.time ? ` at ${parsed.entities.time}` : ''}.`;
            eventResult = updatedEvent;
          } else {
            // Multiple matches - ask for clarification
            const eventList = events.slice(0, 3).map((e: any, i: number) => `${i + 1}. ${e.title} on ${new Date(e.start_time).toLocaleDateString()}`).join('\n');
            responseText = `I found multiple events matching "${parsed.entities.title}". Which one?\n${eventList}\n\nOr say the date to narrow it down.`;
          }
        } catch (modifyError) {
          console.error('Error modifying event:', modifyError);
          responseText = `Sorry, I had trouble updating that event. Please try again or use the calendar directly.`;
        }
      }
      
      // If delete_event intent, remove an event
      if (parsed.intent === 'delete_event' && parsed.entities.title) {
        try {
          const targetDate = parsed.entities.date || undefined;
          const events = await findEventByTitle(parsed.entities.title, targetDate);
          
          if (!events || events.length === 0) {
            responseText = `I couldn't find an event called "${parsed.entities.title}"${targetDate ? ` on ${targetDate}` : ''}. Would you like me to add it instead?`;
          } else if (events.length === 1) {
            const event = events[0];
            await deleteCalendarEvent(event.id);
            responseText = `Done! Removed "${event.title}" from your calendar.`;
          } else {
            // Multiple matches - ask for clarification
            const eventList = events.slice(0, 3).map((e: any, i: number) => `${i + 1}. ${e.title} on ${new Date(e.start_time).toLocaleDateString()}`).join('\n');
            responseText = `I found multiple events matching "${parsed.entities.title}". Which one?\n${eventList}\n\nOr say the date to narrow it down.`;
          }
        } catch (deleteError) {
          console.error('Error deleting event:', deleteError);
          responseText = `Sorry, I had trouble removing that event. Please try again or use the calendar directly.`;
        }
      }
    } catch (dbError) {
      // Log but don't fail the request - the command was parsed successfully
      console.error('Database error processing command:', dbError);
    }

    // Return the parsed command and response
    return NextResponse.json({
      success: true,
      sender,
      message: sanitizedMessage,
      parsed: {
        intent: parsed.intent,
        confidence: parsed.confidence,
        entities: parsed.entities,
      },
      response: responseText,
      eventCreated: !!eventResult,
      commandId: commandResult?.id,
      scheduleEvents: scheduleEvents ? scheduleEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
        all_day: e.all_day,
        category: e.category,
      })) : null,
    });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
