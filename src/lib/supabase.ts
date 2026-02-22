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
