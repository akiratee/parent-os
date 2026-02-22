# Parent OS Technical Specification

**Technical Architecture Document**

## Overview

**Parent OS** is a Next.js application with Supabase backend, providing voice-first family coordination with natural language command parsing and WhatsApp integration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   VOICE INPUT                   │
│  ┌─────────────────────────────────────────┐ │
│  │  Browser Speech Recognition (web)       │ │
│  │  WhatsApp via OpenClaw                  │ │
│  └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────┘
                   │
         Natural Language Parser
                   │
┌──────────────────▼──────────────────────────────┐
│              INTENT ROUTER                     │
│  ┌─────────────────────────────────────────┐   │
│  │  add_event                             │   │
│  │  check_schedule                        │   │
│  │  modify_event                          │   │
│  │  delete_event                          │   │
│  │  ask_question                          │   │
│  └─────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┘
                   │
         Structured Command
                   │
┌──────────────────▼──────────────────────────────┐
│              CALENDAR API                     │
│         Next.js API Routes                    │
│  ┌─────────────────────────────────────────┐   │
│  │  • POST /api/events (create)            │   │
│  │  • GET /api/events (list)              │   │
│  │  • GET /api/events/[id]                │   │
│  │  • PUT /api/events/[id]                │   │
│  │  • DELETE /api/events/[id]             │   │
│  │  • GET /api/family-members             │   │
│  │  • POST /api/commands (parse)          │   │
│  └─────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┘
                   │
         Supabase Database
                   │
┌──────────────────▼──────────────────────────────┐
│              INTEGRATIONS                        │
│  • OpenClaw (WhatsApp input)                  │
│  • Google Calendar API (sync, optional)       │
│  • Gmail API (notifications, optional)        │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| NLP | Custom regex-based parser |
| Voice | Browser Speech Recognition API |
| WhatsApp | OpenClaw Gateway |
| State | React Context + SWR |

## Database Schema

### family_members
```sql
CREATE TABLE public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,  -- 'dad', 'mom', 'son', 'daughter'
  color TEXT NOT NULL,    -- hex color for calendar
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### calendar_events
```sql
CREATE TABLE public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL CHECK (category IN ('activity', 'meal', 'chore', 'appointment', 'other')),
  family_member_id UUID REFERENCES public.family_members,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,  -- RRULE format
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### family_commands
```sql
CREATE TABLE public.family_commands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_text TEXT NOT NULL,
  parsed_intent TEXT NOT NULL,
  extracted_data JSONB,
  calendar_event_id UUID REFERENCES public.calendar_events,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### notifications
```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  family_member_id UUID REFERENCES public.family_members,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'schedule_update', 'command_response')),
  message TEXT NOT NULL,
  event_id UUID REFERENCES public.calendar_events,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Command Parser

### Intent Detection

```typescript
type CommandIntent = 
  | 'add_event'
  | 'check_schedule'
  | 'modify_event'
  | 'delete_event'
  | 'set_reminder'
  | 'ask_question'
  | 'unknown';

const INTENT_PATTERNS: Record<CommandIntent, RegExp[]> = {
  add_event: [
    /add\s+(a\s+)?(.*?)\s+on\s+(.*)/i,
    /schedule\s+(.*?)\s+for\s+(.*)/i,
    /put\s+(.*?)\s+on\s+(the\s+)?calendar/i,
    /we\s+(have|are\s+going\s+to)\s+(.*?)\s+at\s+(.*)/i,
  ],
  check_schedule: [
    /what('?s| is)?\s+on\s+(the\s+)?schedule/i,
    /what\s+do\s+we\s+have\s+(.*?)(today|tomorrow|week)/i,
    /show\s+(me\s+)?(the\s+)?schedule/i,
  ],
  modify_event: [
    /change\s+(.*?)\s+to\s+(.*)/i,
    /move\s+(.*?)\s+to\s+(.*)/i,
    /reschedule\s+(.*?)\s+to\s+(.*)/i,
  ],
  delete_event: [
    /delete\s+(.*?)\s+from\s+(the\s+)?calendar/i,
    /remove\s+(.*?)\s+from\s+(the\s+)?calendar/i,
    /cancel\s+(.*?)\s+(on\s+)?(the\s+)?calendar/i,
  ],
  set_reminder: [
    /remind\s+(me|us)\s+to\s+(.*)/i,
    /set\s+(a\s+)?reminder\s+(for\s+)?(.*)/i,
  ],
  ask_question: [
    /when\s+is\s+(.*)/i,
    /what\s+time\s+is\s+(.*)/i,
  ],
  unknown: [],
};
```

### Entity Extraction

```typescript
interface ExtractedEntities {
  title?: string;      // Event title
  date?: string;        // YYYY-MM-DD
  time?: string;        // HH:MM
  duration?: string;    // "1 hour", "30 minutes"
  category?: string;    // activity, meal, chore, appointment
  recurrence?: string;  // RRULE format
}
```

### Response Generation

```typescript
function generateResponse(intent: CommandIntent, entities: ExtractedEntities): string {
  switch (intent) {
    case 'add_event':
      return `I'll add "${entities.title}" on ${entities.date} at ${entities.time}.`;
    case 'check_schedule':
      return `Let me check what's on the schedule${entities.date ? ` for ${entities.date}` : ' today'}...`;
    case 'modify_event':
      return `I'll update "${entities.title}" to ${entities.date} at ${entities.time}.`;
    case 'delete_event':
      return `I'll remove "${entities.title}" from the calendar.`;
    default:
      return "I'm not sure what you mean. Try saying something like 'Add soccer practice tomorrow at 4pm'.";
  }
}
```

## API Endpoints

### Events

```
GET    /api/events
  Query: start_date?, end_date?, family_member_id?, category?
  Response: { data: Event[] }

POST   /api/events
  Body: { title, description?, start_time, end_time, all_day?, category, family_member_id?, is_recurring?, recurrence_rule? }
  Response: { data: Event }

GET    /api/events/[id]
  Response: { data: Event }

PUT    /api/events/[id]
  Body: { title?, description?, start_time?, end_time?, all_day?, category?, family_member_id?, is_recurring?, recurrence_rule? }
  Response: { data: Event }

DELETE /api/events/[id]
  Response: { success: true }
```

### Family Members

```
GET    /api/family-members
  Response: { data: FamilyMember[] }

POST   /api/family-members
  Body: { name, relation, color, avatar_url? }
  Response: { data: FamilyMember }

PUT    /api/family-members/[id]
  Body: { name?, relation?, color?, avatar_url?, is_active? }
  Response: { data: FamilyMember }

DELETE /api/family-members/[id]
  Response: { success: true }
```

### Commands

```
POST   /api/commands
  Body: { original_text: string }
  Response: { 
    parsed: { intent, entities, confidence },
    response: string,
    calendar_event?: Event
  }
```

## Frontend Components

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Calendar view + voice input |
| Events | `/events` | List view, filters |
| Family | `/family` | Manage family members |
| Settings | `/settings` | User preferences |

### Components

```
src/components/
├── VoiceInput.tsx        # Speech recognition + text input
├── CalendarView.tsx      # Month/week/day calendar
├── EventCard.tsx         # Event preview
├── EventForm.tsx         # Create/edit event
├── FamilyMemberList.tsx  # Family member cards
├── CategoryFilter.tsx    # Category pills
├── CommandParser.tsx     # NLP logic (shared)
└── ResponseBubble.tsx    # Bot response display
```

## WhatsApp Integration

### OpenClaw Integration

```typescript
// When command received via WhatsApp
async function handleWhatsAppCommand(text: string) {
  // 1. Parse command
  const parsed = parseCommand(text);
  
  // 2. Create calendar event if applicable
  if (parsed.intent === 'add_event') {
    await createCalendarEvent(parsed.entities);
  }
  
  // 3. Generate response
  const response = generateResponse(parsed.intent, parsed.entities);
  
  // 4. Send back via WhatsApp
  await sendWhatsAppMessage(response);
}
```

### Voice Command Flow

```
User (WhatsApp) → OpenClaw → Parent OS API → Command Parser → Calendar API → Response → User
```

## Browser Speech Recognition

```typescript
function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    handleVoiceInput(text);
  };
  
  recognition.start();
}
```

## Security

### Authentication
- Supabase Auth (email/password)
- Optional: WhatsApp number verification

### Authorization (RLS Policies)

```sql
-- Family members: Only authenticated users
CREATE POLICY "Users manage family" ON family_members 
  FOR ALL USING (auth.role() = 'authenticated');

-- Calendar events: Family access
CREATE POLICY "Family access events" ON calendar_events 
  FOR ALL USING (auth.role() = 'authenticated');

-- Commands: Only authenticated users
CREATE POLICY "Users create commands" ON family_commands 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENCLAW_URL=http://localhost:3000
GOOGLE_CALENDAR_API_KEY=optional
GMAIL_API_KEY=optional
```

## Performance

### Optimization Strategies
1. **SWR** for data caching and revalidation
2. **Optimistic updates** for event creation
3. **Lazy loading** for calendar views
4. **Debounced** voice input

### Caching
- Calendar events: 30-second cache
- Family members: 5-minute cache
- Command results: No cache (immediate)

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Cloudflare Pages
```bash
npx wrangler pages deploy out
```

## Monitoring

### Metrics
- Voice commands per day
- Command success rate
- Calendar events created
- Active family members

### Logging
- Command parsing results
- Event creation/update/delete
- Errors and failures

## Future Enhancements

### Phase 2
- [ ] Google Calendar sync
- [ ] Email reminders
- [ ] Push notifications
- [ ] Recurring events (RRULE)
- [ ] Activity suggestions
- [ ] Meal planning integration
- [ ] Chore tracking

### Phase 3
- [ ] iOS/Android shortcuts
- [ ] Wearable integration
- [ ] Location-based reminders
- [ ] Family chat
- [ ] Photo sharing
