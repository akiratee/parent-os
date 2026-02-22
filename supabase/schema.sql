-- Parent OS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Family Members Table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL CHECK (category IN ('activity', 'meal', 'chore', 'appointment', 'other')),
  family_member_id UUID REFERENCES public.family_members,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Commands Table (for tracking)
CREATE TABLE IF NOT EXISTS public.family_commands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_text TEXT NOT NULL,
  parsed_intent TEXT NOT NULL,
  extracted_data JSONB,
  calendar_event_id UUID REFERENCES public.calendar_events,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_commands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can manage family" ON public.family_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage events" ON public.calendar_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create commands" ON public.family_commands
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Seed default family members
INSERT INTO public.family_members (name, relation, color) VALUES
  ('Vincent', 'dad', '#3B82F6'),
  ('Sam', 'mom', '#EC4899'),
  ('Kid 1', 'son', '#10B981'),
  ('Kid 2', 'son', '#F59E0B')
ON CONFLICT DO NOTHING;
