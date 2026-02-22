# Parent OS - Voice-First Family Coordination

**Voice-first family coordination via WhatsApp and natural language commands.**

## Features

### 🎤 Voice Commands
- Natural language parsing (NLP)
- Extract intent: add events, check schedule, modify, delete
- Automatic date/time extraction
- Category detection (activity, meal, chore, appointment)

### 📅 Family Calendar
- Event creation via voice
- Category-based organization
- Family member assignment
- Recurring events support

### 👨‍👩‍👧‍👦 Family Management
- Multiple family members
- Color-coded schedules
- Individual calendars

## Getting Started

```bash
cd projects/parent-os
npm install
npm run dev
```

## Voice Command Examples

```
"Add soccer practice tomorrow at 4pm"
"What's on the schedule for today?"
"Schedule dentist appointment on Friday at 2pm"
"Put piano lessons on the calendar"
"Change dinner to 6pm"
```

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **NLP:** Custom regex-based parser (extensible)
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Input:** Browser Speech Recognition + WhatsApp integration

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   VOICE INPUT                   │
│         Browser Speech + WhatsApp              │
└──────────────────┬────────────────────────────┘
                   │
         Natural Language Parser
                   │
┌──────────────────▼────────────────────────────┐
│              INTENT DETECTION                  │
│         add_event, check_schedule, etc.       │
└──────────────────┬────────────────────────────┘
                   │
         Structured Data Extraction
                   │
┌──────────────────▼────────────────────────────┐
│              CALENDAR API                     │
│         Create, Read, Update, Delete         │
└──────────────────┬────────────────────────────┘
                   │
         Supabase Database
```

## Database Schema

### family_members
- id, name, relation, color, avatar_url

### calendar_events
- id, title, description, start_time, end_time
- all_day, category, is_recurring, recurrence_rule
- family_member_id, created_by

### family_commands
- id, original_text, parsed_intent
- extracted_data, status, created_at

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Future Enhancements

- [ ] WhatsApp integration (via OpenClaw)
- [ ] AI-powered intent parsing (LLM)
- [ ] Recurring event rules (RRULE)
- [ ] Calendar reminders
- [ ] Family member preferences
- [ ] Activity suggestions
- [ ] Meal planning integration
