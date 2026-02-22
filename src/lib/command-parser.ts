// Natural Language Parser for Family Commands
// Extracts intent and structured data from natural language voice commands

export type CommandIntent = 
  | 'add_event'
  | 'check_schedule'
  | 'modify_event'
  | 'delete_event'
  | 'set_reminder'
  | 'ask_question'
  | 'unknown';

export interface ParsedCommand {
  intent: CommandIntent;
  confidence: number;
  entities: {
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    duration?: string;
    family_member?: string;
    category?: string;
    recurrence?: string;
  };
  originalText: string;
}

// Intent patterns (regex-based for MVP)
const INTENT_PATTERNS: Record<CommandIntent, RegExp[]> = {
  add_event: [
    /add\s+(a\s+)?(.*?)to\s+(the\s+)?calendar/i,
    /schedule\s+(.*?)for\s+(.*)/i,
    /put\s+(.*?)\son\s+(the\s+)?calendar/i,
    /remind\s+(?:me|us|.*?)\sto\s+(.*?)\s(?:on\s+|at\s+)(.*)/i,
    /create\s+(.*?)\s(?:event\s+)?(?:for\s+|on\s+|at\s+)(.*)/i,
    /we\s+(?:have|are\s+going\s+to|will\s+).*?at\s+(.*)/i,
  ],
  check_schedule: [
    /what'?s?\s+(?:on\s+)?(?:the\s+)?schedule/i,
    /what\s+do\s+we\s+have\s+(?:on\s+)?(?:the\s+)?(?:.*?)(?:today|tomorrow|this\s+week)/i,
    /any\s+plans?\s+(?:for\s+)?(?:.*?)(?:today|tomorrow|week)/i,
    /show\s+(?:me\s+)?(?:the\s+)?(?:.*?)(?:schedule|calendar|plans)/i,
  ],
  modify_event: [
    /change\s+(.*?)\s(?:to\s+|from\s+|at\s+|on\s+)(.*)/i,
    /move\s+(.*?)\s(?:to\s+|to\s+be\s+at\s+|to\s+be\s+on\s+)(.*)/i,
    /reschedule\s+(.*?)\s(?:to\s+|for\s+)(.*)/i,
    /update\s+(.*?)\s(?:to\s+|with\s+)(.*)/i,
  ],
  delete_event: [
    /delete\s+(.*?)\s(?:from\s+)?(?:the\s+)?(?:.*?)(?:calendar|schedule)/i,
    /remove\s+(.*?)\s(?:from\s+)?(?:the\s+)?(?:.*?)(?:calendar|schedule)/i,
    /cancel\s+(.*?)\s(?:on\s+)?(?:the\s+)?(?:.*?)(?:calendar|schedule)/i,
  ],
  set_reminder: [
    /remind\s+(?:me|us|.*?)\sto\s+(.*)/i,
    /set\s+(?:a\s+)?reminder\s+(?:for\s+|to\s+|about\s+)(.*)/i,
  ],
  ask_question: [
    /what(?:\'s| is)?\s+(.*)/i,
    /when\s+(?:is|does|are|will)\s+(.*)/i,
    /where\s+(.*)/i,
    /who\s+(.*)/i,
    /why\s+(.*)/i,
    /how\s+(.*)/i,
  ],
  unknown: [],
};

// Time extraction patterns
const TIME_PATTERNS = [
  { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i, extractor: (m: RegExpMatchArray) => `${m[1].padStart(2, '0')}:${m[2]}:00` },
  { pattern: /(\d{1,2})\s*(am|pm)/i, extractor: (m: RegExpMatchArray) => `${parseInt(m[1]) % 12 + (m[2].toLowerCase() === 'pm' ? 12 : 0)}:00:00` },
  { pattern: /at\s+(\d{1,2})\s*(am|pm)?/i, extractor: (m: RegExpMatchArray) => `${parseInt(m[1]) % 12 + (m[2]?.toLowerCase() === 'pm' ? 12 : 0)}:00:00` },
];

// Date extraction patterns
const DATE_PATTERNS = [
  { pattern: /today/i, extractor: () => new Date().toISOString().split('T')[0] },
  { pattern: /tomorrow/i, extractor: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }},
  { pattern: /on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, extractor: (m: RegExpMatchArray) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(m[1].toLowerCase());
    const d = new Date();
    const currentDay = d.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) daysToAdd += 7;
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  }},
  { pattern: /on\s+(\d{1,2})\/(\d{1,2})/i, extractor: (m: RegExpMatchArray) => {
    const d = new Date();
    d.setMonth(parseInt(m[1]) - 1);
    d.setDate(parseInt(m[2]));
    return d.toISOString().split('T')[0];
  }},
];

// Category keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  activity: ['play', 'game', 'park', 'swim', 'movie', 'activity', 'outing', 'trip'],
  meal: ['eat', 'dinner', 'lunch', 'breakfast', 'meal', 'food', 'restaurant'],
  chore: ['clean', 'chore', 'homework', 'practice', 'lesson'],
  appointment: ['doctor', 'dentist', 'checkup', 'appointment', 'visit'],
  other: [],
};

export function parseCommand(text: string): ParsedCommand {
  const normalizedText = text.trim();
  
  // Detect intent
  let detectedIntent: CommandIntent = 'unknown';
  let maxScore = 0;

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unknown') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        const score = pattern.test(normalizedText) ? 1 : 0;
        if (score > maxScore) {
          maxScore = score;
          detectedIntent = intent as CommandIntent;
        }
      }
    }
  }

  // Extract entities
  const entities: ParsedCommand['entities'] = {};

  // Extract time
  for (const { pattern, extractor } of TIME_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      entities.time = extractor(match);
      break;
    }
  }

  // Extract date
  for (const { pattern, extractor } of DATE_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      entities.date = extractor(match);
      break;
    }
  }

  // Extract title (simplified: take longest phrase not matched by patterns)
  const words = normalizedText.split(/\s+/);
  if (detectedIntent === 'add_event') {
    // Try to extract event title from common patterns
    const titleMatch = normalizedText.match(/(?:add|schedule|put|create)\s+(?:a\s+)?(?:.*?)\s+(?:to|for|on|at)\s+(?:the\s+)?(?:.*?)$/i);
    if (titleMatch) {
      entities.title = titleMatch[0].replace(/(?:add|schedule|put|create)\s+(?:a\s+)?(?:.*?)\s+(?:to|for|on|at)\s+(?:the\s+)?/i, '').trim();
    }
  }

  // Extract category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => normalizedText.includes(kw))) {
      entities.category = category;
      break;
    }
  }

  // Extract duration
  const durationMatch = normalizedText.match(/(\d+)\s*(hour|minute|day)s?/i);
  if (durationMatch) {
    entities.duration = `${durationMatch[1]} ${durationMatch[2]}${parseInt(durationMatch[1]) > 1 ? 's' : ''}`;
  }

  // Detect recurrence
  if (/every|weekly|daily|weekly|monthly/i.test(normalizedText)) {
    if (/daily|every\s+day/i.test(normalizedText)) {
      entities.recurrence = 'FREQ=DAILY';
    } else if (/weekly|every\s+week/i.test(normalizedText)) {
      entities.recurrence = 'FREQ=WEEKLY';
    } else if (/monthly|every\s+month/i.test(normalizedText)) {
      entities.recurrence = 'FREQ=MONTHLY';
    }
  }

  // Calculate confidence based on what we extracted
  let confidence = 0.3; // Base confidence
  if (detectedIntent !== 'unknown') confidence += 0.3;
  if (entities.title) confidence += 0.2;
  if (entities.date || entities.time) confidence += 0.2;
  if (entities.category) confidence += 0.1;

  return {
    intent: detectedIntent,
    confidence: Math.min(1, confidence),
    entities,
    originalText: text,
  };
}

// Generate natural language response
export function generateResponse(parsed: ParsedCommand): string {
  switch (parsed.intent) {
    case 'add_event':
      return `I'll add "${parsed.entities.title}" to the calendar${parsed.entities.date ? ` on ${parsed.entities.date}` : ''}${parsed.entities.time ? ` at ${parsed.entities.time}` : ''}.`;
    
    case 'check_schedule':
      return `Let me check what's on the schedule${parsed.entities.date ? ` for ${parsed.entities.date}` : ' for today'}...`;
    
    case 'modify_event':
      return `I'll update the event to ${parsed.entities.date ? `on ${parsed.entities.date}` : ''}${parsed.entities.time ? `at ${parsed.entities.time}` : ''}.`;
    
    case 'delete_event':
      return `I'll remove that from the calendar.`;
    
    case 'set_reminder':
      return `I'll set a reminder to ${parsed.entities.title}.`;
    
    case 'ask_question':
      return `Let me find out about "${parsed.entities.title || 'that'}" for you.`;
    
    default:
      return "I'm not sure what you mean. Try saying something like 'Add soccer practice tomorrow at 4pm'.";
  }
}
