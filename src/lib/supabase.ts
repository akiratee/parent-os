// Supabase client for Parent OS
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Types for Parent OS
export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  color: string;
  avatar_url?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  family_member_id?: string;
  category: 'activity' | 'meal' | 'chore' | 'appointment' | 'other';
  is_recurring: boolean;
  recurrence_rule?: string;
  // Location-based reminder fields
  location?: string;
  location_lat?: number;
  location_lng?: number;
  location_radius?: number; // in meters, default 100
  location_triggers?: ('arrive' | 'leave')[];
  created_by: string;
  created_at: string;
}

export interface FamilyCommand {
  id: string;
  original_text: string;
  parsed_intent: string;
  extracted_data: Record<string, any>;
  calendar_event_id?: string;
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
}

// Helper functions
export async function getFamilyMembers() {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getCalendarEvents(startDate?: string, endDate?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .order('start_time');

  if (startDate) {
    query = query.gte('start_time', startDate);
  }
  if (endDate) {
    query = query.lte('start_time', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCalendarEvent(event: Partial<CalendarEvent>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createFamilyCommand(command: { original_text: string; parsed_intent: string; extracted_data: Record<string, any> }) {
  const { data, error } = await supabase
    .from('family_commands')
    .insert(command)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

export async function updateCalendarEvent(id: string, updates: Partial<CalendarEvent>) {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Helper to find event by title (for voice commands)
export async function findEventByTitle(title: string, date?: string) {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .ilike('title', `%${title}%`)
    .order('start_time');

  if (date) {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFamilyCommands(status?: string) {
  let query = supabase
    .from('family_commands')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Family Member CRUD operations
export async function createFamilyMember(member: { name: string; relation: string; color: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('family_members')
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFamilyMember(id: string, updates: { name?: string; relation?: string; color?: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFamilyMember(id: string) {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// Recurrence helper functions
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
}

export function parseRecurrenceRule(rule: string | undefined): RecurrenceRule | null {
  if (!rule) return null;
  
  const freqMatch = rule.match(/FREQ=(DAILY|WEEKLY|MONTHLY)/);
  const untilMatch = rule.match(/UNTIL=(\d{8})/);
  
  if (!freqMatch) return null;
  
  const frequency = freqMatch[1].toLowerCase() as 'daily' | 'weekly' | 'monthly';
  let endDate: Date | undefined;
  
  if (untilMatch) {
    const dateStr = untilMatch[1];
    endDate = new Date(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(4, 6)) - 1,
      parseInt(dateStr.slice(6, 8))
    );
  }
  
  return { frequency, endDate };
}

export function expandRecurringEvents(events: CalendarEvent[], months: number = 3): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + months);
  
  for (const event of events) {
    // Add the original event
    expanded.push(event);
    
    // If recurring, expand it
    if (event.is_recurring && event.recurrence_rule) {
      const rule = parseRecurrenceRule(event.recurrence_rule);
      if (!rule) continue;
      
      const startDate = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      let currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        // Check if we've passed the end date of recurrence
        if (rule.endDate && currentDate > rule.endDate) break;
        
        // Skip the original occurrence
        if (currentDate.getTime() !== startDate.getTime()) {
          // Calculate new times
          const newStart = new Date(currentDate);
          newStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
          
          const duration = endTime.getTime() - startDate.getTime();
          const newEnd = new Date(newStart.getTime() + duration);
          
          // Create expanded event
          expanded.push({
            ...event,
            id: `${event.id}-${currentDate.toISOString().split('T')[0]}`,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          });
        }
        
        // Move to next occurrence
        switch (rule.frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
    }
  }
  
  return expanded;
}
