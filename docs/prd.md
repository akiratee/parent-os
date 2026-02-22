# Parent OS PRD

**Product Requirements Document**

## Overview

**Parent OS** is a voice-first family coordination platform that allows families to manage schedules, tasks, and communication through natural language voice commands via WhatsApp and a web dashboard.

## Problem Statement

- Family schedules are fragmented across multiple apps
- Voice commands are not well-supported for family coordination
- Difficulty coordinating with kids (ages 5 and 7) who can't use complex apps
- Need simple way to add events to family calendar

## Solution

Voice-first family coordination with:
- Natural language command parsing
- WhatsApp integration for voice input
- Visual calendar dashboard
- Family member management
- Simple enough for kids to use via voice

## Target Users

1. **Vincent** - Primary user, Engineering Manager
2. **Sam** - Spouse, co-parent
3. **Kids (5, 7)** - Voice-only users
4. **Extended family** - Occasional users

## User Stories

### MVP

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-1 | Parent | Add events via voice | Quick calendar updates while busy |
| US-2 | Parent | Check schedule via voice | Know what's coming up |
| US-3 | Parent | See calendar on web | Visual overview of family plans |
| US-4 | Parent | Add family members | Track who has what events |
| US-5 | Kid | Say "what's on the schedule" | Know my activities |

### Phase 2

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-6 | Parent | Get reminders | Don't forget events |
| US-7 | Parent | Set recurring events | Don't re-enter weekly activities |
| US-8 | Parent | Share calendar with spouse | Coordinated planning |
| US-9 | Kid | Get voice reminders | Know when activities start |

## Features

### MVP Features

#### 1. Voice Command Input
- Natural language parsing (NLP)
- Supported intents:
  - "Add soccer practice tomorrow at 4pm"
  - "What's on the schedule for today?"
  - "Schedule dentist on Friday at 2pm"
  - "Change dinner to 6pm"

#### 2. Calendar Dashboard
- Visual calendar view (month/week/day)
- Color-coded by category
- Event details (title, time, description)
- Add/edit/delete events

#### 3. Family Members
- Add family members with names and colors
- Assign events to family members
- Filter calendar by person

#### 4. Categories
- 🏃 Activity (sports, lessons)
- 🍽️ Meal (dinner, lunch)
- 🧹 Chore (homework, tasks)
- 🏥 Appointment (doctor, dentist)
- 📋 Other

#### 5. WhatsApp Integration
- Send commands via WhatsApp
- Receive confirmations
- Get schedule summaries

### Phase 2 Features

- [ ] Recurring events (daily, weekly, monthly)
- [ ] Reminders (15 min before event)
- [ ] Email summaries
- [ ] Activity suggestions
- [ ] Meal planning
- [ ] Chore tracking
- [ ] Shared calendar with spouse

## Non-Functional Requirements

### Performance
- Command parsing < 500ms
- Calendar load < 1 second
- Real-time sync < 1 second

### Security
- Private family data
- No public access
- Encrypted storage

### Usability
- Simple enough for 5-year-old
- Works hands-free
- Works while driving

### Availability
- 99.9% uptime
- Works offline (cached data)

## Success Metrics

| Metric | Target |
|--------|--------|
| Voice commands per day | 10+ |
| Calendar events added | 5+/week |
| Family member usage | 100% |
| Voice command accuracy | 90%+ |

## Out of Scope (MVP)

- Direct messaging between family members
- Location sharing
- Expense tracking
- Photo sharing
- Custom categories

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| MVP | 1 week | Voice commands, calendar, family members |
| Phase 2 | 2 weeks | Reminders, recurring, sharing |

## Dependencies

- Supabase (database, auth)
- OpenClaw (WhatsApp integration)
- Google Calendar API (optional, sync)
- Browser Speech Recognition (web input)

## Voice Command Examples

### Add Events
```
"Add soccer practice tomorrow at 4pm"
"Schedule piano lesson on Friday at 3pm"
"Put dentist appointment on March 15th at 2pm"
"We have dinner at 6pm tonight"
"Add swimming on Saturday morning"
```

### Check Schedule
```
"What's on the schedule for today?"
"What do we have tomorrow?"
"Show me this week's activities"
"When is soccer practice?"
"What's planned for Friday?"

### Modify Events
```
"Change soccer to 5pm"
"Move dinner to 7pm"
"Cancel piano lesson"
"Reschedule dentist to next week"

### Delete Events
```
"Remove soccer from Saturday"
"Delete the dentist appointment"
"Clear all activities for tomorrow"
```

## Open Questions

1. Should events sync with Google Calendar?
2. What's the reminder behavior (push notification, WhatsApp)?
3. How to handle conflicting events?
4. Should kids have limited visibility (e.g., hide chore results)?
