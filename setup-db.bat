@echo off
REM Parent OS - Database Setup Script
REM Run this in Supabase SQL Editor

echo ========================================
echo Parent OS - Database Schema Setup
echo ========================================
echo.
echo 1. Go to: https://supabase.com/dashboard
echo 2. Select your project
echo 3. Go to SQL Editor
echo 4. Copy and paste the SQL below
echo 5. Click "Run"
echo.
echo ========================================

echo.
echo --- Copy from here ---
echo.

REM Parent OS Schema
echo -- Parent OS Database Schema
echo -- Run this in Supabase SQL Editor
echo.
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
echo.
echo -- Family Members Table
echo CREATE TABLE IF NOT EXISTS public.family_members (
echo   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
echo   name TEXT NOT NULL,
echo   relation TEXT NOT NULL,
echo   color TEXT NOT NULL,
echo   avatar_url TEXT,
echo   is_active BOOLEAN DEFAULT TRUE,
echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
echo );
echo.
echo -- Calendar Events Table
echo CREATE TABLE IF NOT EXISTS public.calendar_events (
echo   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
echo   title TEXT NOT NULL,
echo   description TEXT,
echo   start_time TIMESTAMP WITH TIME ZONE NOT NULL,
echo   end_time TIMESTAMP WITH TIME ZONE NOT NULL,
echo   all_day BOOLEAN DEFAULT FALSE,
echo   category TEXT NOT NULL CHECK (category IN ('activity', 'meal', 'chore', 'appointment', 'other')),
echo   family_member_id UUID REFERENCES public.family_members,
echo   is_recurring BOOLEAN DEFAULT FALSE,
echo   recurrence_rule TEXT,
echo   created_by UUID REFERENCES auth.users,
echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
echo   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
echo );
echo.
echo -- Family Commands Table
echo CREATE TABLE IF NOT EXISTS public.family_commands (
echo   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
echo   original_text TEXT NOT NULL,
echo   parsed_intent TEXT NOT NULL,
echo   extracted_data JSONB,
echo   calendar_event_id UUID REFERENCES public.calendar_events,
echo   status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
echo   error_message TEXT,
echo   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
echo );
echo.
echo -- Enable RLS
echo ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.family_commands ENABLE ROW LEVEL SECURITY;
echo.
echo -- Seed family members
echo INSERT INTO public.family_members (name, relation, color) VALUES
echo   ('Vincent', 'dad', '#3B82F6'),
echo   ('Sam', 'mom', '#EC4899'),
echo   ('Kid 1', 'son', '#10B981'),
echo   ('Kid 2', 'son', '#F59E0B')
echo ON CONFLICT DO NOTHING;

echo.
echo --- Copy to here ---

pause
