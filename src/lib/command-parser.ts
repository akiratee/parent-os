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

// Command confirmation states
export type ConfirmationState = 'pending' | 'confirmed' | 'cancelled';

export interface CommandConfirmation {
  state: ConfirmationState;
  parsedCommand: ParsedCommand;
  confirmationMessage: string;
  needsConfirmation: boolean;
}

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

// Intent patterns (enhanced with more variations)
const INTENT_PATTERNS: Record<CommandIntent, RegExp[]> = {
  add_event: [
    /add\s+(a\s+)?(.*?)to\s+(the\s+)?calendar/i,
    /schedule\s+(.*?)for\s+(.*)/i,
    /put\s+(.*?)\son\s+(the\s+)?calendar/i,
    /remind\s+(?:me|us|.*?)\sto\s+(.*?)\s(?:on\s+|at\s+)(.*)/i,
    /create\s+(.*?)\s(?:event\s+)?(?:for\s+|on\s+|at\s+)(.*)/i,
    /we\s+(?:have|are\s+going\s+to|will\s+).*?at\s+(.*)/i,
    // Natural language patterns
    /add\s+(.*?)\s+(?:on\s+|at\s+|for\s+)/i,
    /add\s+(.*?)\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /add\s+(.*?)\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /schedule\s+(.*?)\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /new\s+event\s+(.*)/i,
    /create\s+event\s+(.*)/i,
    /book\s+(.*)/i,
    // Additional add patterns - more variations
    /i\s+(?:want|need|would\s+like)\s+to\s+add\s+(.*)/i,
    /let'?s\s+(?:add|schedule|put)\s+(.*)/i,
    /don'?t\s+forget\s+(?:to\s+)?(?:add\s+)?(.*)/i,
    /set\s+up\s+(.*?)\s+(?:for|on|at)/i,
    /plan\s+(.*?)\s+(?:for|on|at)/i,
    /add\s+(.*?)\s+to\s+my\s+calendar/i,
    /we\s+have\s+(.*?)\s+(?:on|at)\s+(?:the\s+)?/i,
    /mark\s+(.*?)\s+down\s+(?:for|on|at)/i,
    /add\s+(.*?)\s+appointment/i,
    /add\s+(.*?)\s+activity/i,
    // NEW: More voice-friendly patterns
    /put\s+(.*?)\s+in\s+(?:the\s+)?calendar/i,
    /i\s+have\s+(.*?)\s+(?:on|at)\s+(?:the\s+)?/i,
    /remind\s+(?:me|us)\s+(?:about|to)\s+(.*)/i,
    /schedule\s+something\s+(?:called|named)?\s*(.*)/i,
    /add\s+something\s+(?:called|named)?\s*(.*)/i,
    /we\s+need\s+to\s+(?:add|schedule)\s+(.*)/i,
    /can\s+you\s+(?:add|schedule)\s+(.*)/i,
    /please\s+(add|schedule|put)\s+(.*)/i,
  ],
  check_schedule: [
    /what'?s?\s+(?:on\s+)?(?:the\s+)?schedule/i,
    /what\s+do\s+we\s+have\s+(?:on\s+)?(?:the\s+)?(?:.*?)(?:today|tomorrow|this\s+week)/i,
    /any\s+plans?\s+(?:for\s+)?(?:.*?)(?:today|tomorrow|week)/i,
    /show\s+(?:me\s+)?(?:the\s+)?(?:.*?)(?:schedule|calendar|plans)/i,
    // Weekend patterns
    /what'?s?\s+(?:on\s+|this\s+)?weekend/i,
    /what\s+do\s+we\s+have\s+(?:this|next)\s+weekend/i,
    /any\s+plans\s+(?:for\s+)?(?:this|next)\s+weekend/i,
    /show\s+(?:me\s+)?(?:the\s+)?weekend/i,
    /what\s+is\s+(?:on\s+|happening\s+)(?:this|next)\s+weekend/i,
    /anything\s+(?:fun|planned)\s+(?:this|next)\s+weekend/i,
    // Additional check patterns
    /check\s+(?:the\s+)?(?:schedule|calendar)/i,
    /see\s+(?:what|which)\s+(?:is|are)\s+(?:on|planned)/i,
    /view\s+(?:my|our)\s+(?:schedule|calendar|plans)/i,
    /tell\s+me\s+(?:what|which)\s+(?:is|are)\s+(?:on|planned)/i,
    /any\s+events?\s+(?:on\s+)?/i,
    /show\s+(?:me\s+)?what/i,
    /what'?s\s+coming\s+up/i,
    /look\s+(?:at|up)\s+(?:the\s+)?schedule/i,
    /find\s+out\s+what/i,
    /what\s+about\s+(?:the\s+)?(?:schedule|calendar)/i,
  ],
  modify_event: [
    /reschedule\s+(.*?)\s+(?:to\s+|for\s+)/i,
    /change\s+(.*?)\s(?:to\s+|from\s+|at\s+|on\s+)(.*)/i,
    /move\s+(.*?)\s(?:to\s+|to\s+be\s+at\s+|to\s+be\s+on\s+)(.*)/i,
    /update\s+(.*?)\s(?:to\s+|with\s+)(.*)/i,
    // More natural modify patterns
    /move\s+(.*?)\s+(?:to|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /change\s+(.*?)\s+(?:to|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /postpone\s+(.*?)\s+(?:to|until)/i,
    // Fallback: reschedule to X (any day/time)
    /reschedule\s+(.+)/i,
    // Additional modify patterns
    /shift\s+(.*?)\s+(?:to|by)/i,
    /push\s+(.*?)\s+(?:to|back)/i,
    /reschedule\s+my\s+(.*)/i,
    /change\s+the\s+(.*?)\s+to/i,
    /move\s+it\s+to/i,
    /let'?s\s+(?:move|change|reschedule)\s+(.*)/i,
    /edit\s+(.*?)\s+(?:to|on|at)/i,
    /fix\s+(.*?)\s+(?:to|on|at)/i,
    /adjust\s+(.*?)\s+(?:to|on|at)/i,
    /update\s+the\s+time/i,
    /change\s+the\s+date/i,
    // NEW: More voice-friendly modify patterns
    /make\s+it\s+(.*)/i,
    /switch\s+(.*?)\s+to/i,
    /put\s+(.*?)\s+(?:instead|instead of)/i,
    /can\s+we\s+(?:move|change|reschedule)\s+(.*)/i,
    /i\s+(?:need|want)\s+to\s+(?:move|change|reschedule)\s+(.*)/i,
    /move\s+it\s+(?:to|from)/i,
    /change\s+it\s+to/i,
    /reschedule\s+it\s+(?:to|for)/i,
  ],
  delete_event: [
    /delete\s+(.*?)\s(?:from\s+)?(?:the\s+)?(?:.*?)(?:calendar|schedule)/i,
    /remove\s+(.*?)\s(?:from\s+)?(?:the\s+)?(?:.*?)(?:calendar|schedule)/i,
    /cancel\s+(.*?)\s(?:on\s+)?(?:the\s+)?(?:.*?)(?:calendar|schedule)/i,
    // More natural delete patterns
    /cancel\s+(.*)/i,
    /remove\s+(.*)/i,
    /delete\s+(.*)/i,
    /drop\s+(.*)/i,
    // Additional delete patterns
    /take\s+(.*?)\s+off\s+(?:the\s+)?calendar/i,
    /scratch\s+(.*)/i,
    /cross\s+(.*?)\s+off/i,
    /erase\s+(.*)/i,
    /clear\s+(.*?)\s+(?:from|off)/i,
    /undo\s+(.*)/i,
    /unschedule\s+(.*)/i,
    /delete\s+my\s+(.*)/i,
    /remove\s+it\s+from/i,
    /cancel\s+it/i,
    // NEW: More voice-friendly delete patterns
    /get\s+rid\s+of\s+(.*)/i,
    /i\s+(?:don|do)\'?t\s+want\s+(?:that|it)\s+anymore/i,
    /remove\s+that\s+(?:from|off)/i,
    /forget\s+(?:about|that)\s+(.*)/i,
    /don'?t\s+need\s+(?:that|it)\s+anymore/i,
    /take\s+that\s+(?:off|out)\s+(?:the\s+)?/i,
    /can\s+you\s+(?:delete|remove|cancel)\s+(.*)/i,
    /i\s+(?:need|want)\s+to\s+(?:delete|remove|cancel)\s+(.*)/i,
  ],
  set_reminder: [
    /remind\s+(?:me|us|.*?)\sto\s+(.*)/i,
    /set\s+(?:a\s+)?reminder\s+(?:for\s+|to\s+|about\s+)(.*)/i,
    /remind\s+(?:me|us)\s+(.*?)\s+(?:to|about)/i,
    // Additional reminder patterns
    /don'?t\s+forget\s+(?:to\s+)?(.*)/i,
    /make\s+sure\s+(?:we|to)\s+(.*)/i,
    /alert\s+me\s+(?:about|to)/i,
    /notify\s+me\s+(?:about|to)/i,
    /wake\s+me\s+up/i,
    /reminder\s+for\s+(.*)/i,
    /remember\s+(?:to\s+)?(.*)/i,
    /set\s+an?\s+alarm\s+(?:for|to)/i,
    /add\s+(?:a\s+)?reminder/i,
  ],
  ask_question: [
    /what(?:\'s| is)?\s+(.*)/i,
    /when\s+(?:is|does|are|will)\s+(.*)/i,
    /where\s+(.*)/i,
    /who\s+(.*)/i,
    /why\s+(.*)/i,
    /how\s+(.*)/i,
    // Additional question patterns
    /can\s+i\s+(.*)/i,
    /could\s+you\s+(.*)/i,
    /do\s+we\s+(.*)/i,
    /is\s+there\s+(.*)/i,
    /will\s+(.*)/i,
    /shall\s+(.*)/i,
    /should\s+(.*)/i,
    /may\s+(.*)/i,
    /would\s+(.*)/i,
  ],
  unknown: [],
};

// Time extraction patterns (enhanced)
const TIME_PATTERNS = [
  // Standard time formats
  { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i, extractor: (m: RegExpMatchArray) => `${m[1].padStart(2, '0')}:${m[2]}:00` },
  { pattern: /(\d{1,2})\s*(am|pm)/i, extractor: (m: RegExpMatchArray) => `${parseInt(m[1]) % 12 + (m[2].toLowerCase() === 'pm' ? 12 : 0)}:00:00` },
  { pattern: /at\s+(\d{1,2})\s*(am|pm)?/i, extractor: (m: RegExpMatchArray) => `${parseInt(m[1]) % 12 + (m[2]?.toLowerCase() === 'pm' ? 12 : 0)}:00:00` },
  // Additional time patterns
  { pattern: /(\d{1,2})\s*o'?clock/i, extractor: (m: RegExpMatchArray) => `${parseInt(m[1]) % 12}:00:00` },
  { pattern: /at\s+noon/i, extractor: () => '12:00:00' },
  { pattern: /at\s+midnight/i, extractor: () => '00:00:00' },
  { pattern: /in\s+the\s+(morning|afternoon|evening)/i, extractor: (m: RegExpMatchArray) => {
    const hour = m[1].toLowerCase() === 'morning' ? 9 : m[1].toLowerCase() === 'afternoon' ? 15 : 20;
    return `${hour.toString().padStart(2, '0')}:00:00`;
  }},
  // Time keywords
  { pattern: /early\s+(morning|afternoon|evening)?/i, extractor: (m: RegExpMatchArray) => {
    const hour = m[1]?.toLowerCase() === 'evening' ? 17 : 8;
    return `${hour.toString().padStart(2, '0')}:00:00`;
  }},
  { pattern: /late\s+(morning|afternoon|evening)?/i, extractor: (m: RegExpMatchArray) => {
    const hour = m[1]?.toLowerCase() === 'morning' ? 11 : m[1]?.toLowerCase() === 'afternoon' ? 16 : 21;
    return `${hour.toString().padStart(2, '0')}:00:00`;
  }},
];

// Date extraction patterns
const DATE_PATTERNS = [
  { pattern: /today/i, extractor: () => new Date().toISOString().split('T')[0] },
  { pattern: /tomorrow/i, extractor: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }},
  { pattern: /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, extractor: (m: RegExpMatchArray) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(m[1].toLowerCase());
    const d = new Date();
    const currentDay = d.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // If today or past, add 7 to get next week
    daysToAdd += 7; // Add extra 7 for "next" week
    d.setDate(d.getDate() + daysToAdd);
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
  // Weekend patterns
  { pattern: /(?:this|next)\s+weekend/i, extractor: (m: RegExpMatchArray) => {
    const d = new Date();
    const currentDay = d.getDay();
    // Weekend is Saturday (6) and Sunday (0)
    let daysToSaturday = 6 - currentDay;
    if (currentDay === 0) daysToSaturday = 0; // Today is Sunday, this weekend is today
    if (currentDay > 0 && currentDay < 6) {
      if (currentDay === 0) daysToSaturday = 0;
      else daysToSaturday = 6 - currentDay;
    }
    if (m[1].toLowerCase() === 'next') daysToSaturday += 7; // Next weekend
    if (currentDay === 0) daysToSaturday = 0; // Today is Sunday
    d.setDate(d.getDate() + daysToSaturday);
    return d.toISOString().split('T')[0];
  }},
  { pattern: /on\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i, extractor: (m: RegExpMatchArray) => {
    const d = new Date();
    const month = parseInt(m[1]) - 1;
    const day = parseInt(m[2]);
    const year = m[3] ? parseInt(m[3]) > 100 ? parseInt(m[3]) : 2000 + parseInt(m[3]) : d.getFullYear();
    d.setMonth(month);
    d.setDate(day);
    d.setFullYear(year);
    // If date is in the past, move to next year
    if (d < new Date(new Date().setHours(0, 0, 0, 0))) {
      d.setFullYear(d.getFullYear() + 1);
    }
    return d.toISOString().split('T')[0];
  }},
  // Additional date patterns
  { pattern: /in\s+(\d+)\s+(day|week|month)s?/i, extractor: (m: RegExpMatchArray) => {
    const d = new Date();
    const num = parseInt(m[1]);
    const unit = m[2].toLowerCase();
    if (unit === 'day') d.setDate(d.getDate() + num);
    else if (unit === 'week') d.setDate(d.getDate() + num * 7);
    else if (unit === 'month') d.setMonth(d.getMonth() + num);
    return d.toISOString().split('T')[0];
  }},
  { pattern: /this\s+(morning|afternoon|evening)/i, extractor: () => new Date().toISOString().split('T')[0] },
  { pattern: /early\s+(?:this\s+)?week/i, extractor: () => {
    const d = new Date();
    d.setDate(d.getDate() + (1 - d.getDay())); // Monday
    return d.toISOString().split('T')[0];
  }},
  { pattern: /later\s+(?:this\s+)?week/i, extractor: () => {
    const d = new Date();
    d.setDate(d.getDate() + (5 - d.getDay())); // Friday
    return d.toISOString().split('T')[0];
  }},
  { pattern: /end\s+of\s+(?:the\s+)?month/i, extractor: () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // Last day of current month
    return d.toISOString().split('T')[0];
  }},
  { pattern: /start\s+of\s+(?:the\s+)?month/i, extractor: () => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  }},
];

// Category keywords (enhanced)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  activity: ['play', 'game', 'park', 'swim', 'movie', 'activity', 'outing', 'trip', 'practice', 'soccer', 'baseball', 'basketball', 'tennis', 'dance', 'music', 'lesson', 'class', 'martial arts', 'gymnastics', 'football', 'hockey', 'skiing', 'bowling', 'hiking', 'bike', 'riding', 'art', 'craft', 'cooking', 'party', 'playdate', 'play date'],
  meal: ['eat', 'dinner', 'lunch', 'breakfast', 'meal', 'food', 'restaurant', 'brunch', 'snack', 'picnic', 'bbq', 'cookout', 'potluck', 'coffee', 'tea'],
  chore: ['clean', 'chore', 'homework', 'tidy', 'organize', 'laundry', 'dishes', 'vacuum', 'mow', 'garden', 'trash', 'recycling', 'pet', 'walk', 'feed', 'bath'],
  appointment: ['doctor', 'dentist', 'checkup', 'appointment', 'visit', 'vet', 'haircut', 'barber', 'optometrist', 'pediatrician', 'specialist', 'therapy'],
  work: ['meeting', 'call', 'conference', 'presentation', 'interview', 'deadline', 'project', 'report', 'email', 'sync', 'standup', 'review', 'demo'],
  school: ['school', 'class', 'camp', 'tutoring', 'exam', 'test', 'quiz', 'assignment', 'parent-teacher', 'pizza', 'book', 'field trip'],
  family: ['family', 'grandparent', 'grandma', 'grandpa', 'birthday', 'anniversary', 'reunion', 'visit', 'outing'],
  other: [],
};

export function parseCommand(text: string): ParsedCommand {
  const normalizedText = text.trim();
  
  // Detect intent with weighted scoring (more specific intents get higher scores)
  let detectedIntent: CommandIntent = 'unknown';
  let maxScore = 0;
  
  // Intent weights - more specific intents get higher weights
  const intentWeights: Record<string, number> = {
    modify_event: 4,
    delete_event: 4,
    set_reminder: 3,
    add_event: 2,
    check_schedule: 2, // Higher than ask_question to prioritize schedule queries
    ask_question: 1,
    unknown: 0,
  };

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unknown') continue;
    
    for (const pattern of patterns) {
      // Reset lastIndex to ensure consistent matching
      pattern.lastIndex = 0;
      const match = pattern.exec(normalizedText);
      if (match) {
        const score = intentWeights[intent] || 1;
        if (score >= maxScore) {
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

  // Extract title (improved: extract from common natural language patterns)
  if (detectedIntent === 'add_event') {
    // Pattern 1: "add [title] on/at [date/time]"
    let titleMatch = normalizedText.match(/add\s+(?:a\s+)?(.+?)\s+(?:on\s+|at\s+|for\s+|next\s+)/i);
    if (!titleMatch) {
      // Pattern 2: "add [title] today/tomorrow/[day]"
      titleMatch = normalizedText.match(/add\s+(?:a\s+)?(.+?)\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    }
    if (!titleMatch) {
      // Pattern 3: "schedule [title]"
      titleMatch = normalizedText.match(/schedule\s+(.+?)(?:\s+(?:on|at|for|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|$)/i);
    }
    if (!titleMatch) {
      // Pattern 4: "create [title]"
      titleMatch = normalizedText.match(/create\s+(?:event\s+)?(.+?)(?:\s+(?:on|at|for|tomorrow|today)|$)/i);
    }
    if (!titleMatch) {
      // Pattern 5: "new event [title]"
      titleMatch = normalizedText.match(/(?:new|create)\s+event\s+(.+)/i);
    }
    if (!titleMatch) {
      // Pattern 6: "book [title]"
      titleMatch = normalizedText.match(/book\s+(.+)/i);
    }
    if (titleMatch) {
      let title = titleMatch[1].trim();
      // Clean up trailing prepositions/time indicators
      title = title.replace(/\s+(to|on|at|for|in)\s*$/i, '').trim();
      if (title) entities.title = title;
    }
  }

  // Extract title for modify_event
  if (detectedIntent === 'modify_event') {
    const titleMatch = normalizedText.match(/(?:move|change|reschedule|update)\s+(.+?)(?:\s+(?:to|at|on|for|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|$)/i);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      title = title.replace(/\s+(to|at|on|for)\s*$/i, '').trim();
      if (title) entities.title = title;
    }
  }

  // Extract title for delete_event
  if (detectedIntent === 'delete_event') {
    const titleMatch = normalizedText.match(/(?:delete|remove|cancel|drop)\s+(.+?)(?:\s+(?:from|on|at|for|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|$)/i);
    if (titleMatch) {
      let title = titleMatch[1].trim();
      title = title.replace(/\s+(from|on|at|for)\s*$/i, '').trim();
      if (title) entities.title = title;
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
  if (/every|daily|weekly|monthly/i.test(normalizedText)) {
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
  // Check for weekend queries
  const isWeekendQuery = /weekend/i.test(parsed.originalText);
  
  switch (parsed.intent) {
    case 'add_event':
      if (!parsed.entities.title) {
        return `I'll add that to the calendar${parsed.entities.date ? ` on ${parsed.entities.date}` : ''}${parsed.entities.time ? ` at ${parsed.entities.time}` : ''}.`;
      }
      return `I'll add "${parsed.entities.title}" to the calendar${parsed.entities.date ? ` on ${parsed.entities.date}` : ''}${parsed.entities.time ? ` at ${parsed.entities.time}` : ''}.`;
    
    case 'check_schedule':
      if (isWeekendQuery) {
        return `Let me check what's planned for the weekend${parsed.entities.date ? ` starting ${parsed.entities.date}` : ''}...`;
      }
      return `Let me check what's on the schedule${parsed.entities.date ? ` for ${parsed.entities.date}` : ' for today'}...`;
    
    case 'modify_event':
      const eventName = parsed.entities.title ? ` "${parsed.entities.title}"` : 'that event';
      return `I'll update${eventName} to ${parsed.entities.date ? `on ${parsed.entities.date}` : ''}${parsed.entities.time ? `at ${parsed.entities.time}` : ''}.`;
    
    case 'delete_event':
      if (parsed.entities.title) {
        return `I'll remove "${parsed.entities.title}" from the calendar.`;
      }
      return `I'll remove that from the calendar.`;
    
    case 'set_reminder':
      return `I'll set a reminder to ${parsed.entities.title || 'remind you'}.`;
    
    case 'ask_question':
      return `Let me find out about "${parsed.entities.title || 'that'}" for you.`;
    
    default:
      return "I'm not sure what you mean. Try saying something like 'Add soccer practice tomorrow at 4pm', 'what's this weekend', or 'move meeting to tomorrow'.";
  }
}

// Command confirmation system - asks user to confirm before executing
export function createConfirmation(parsed: ParsedCommand): CommandConfirmation {
  const needsConfirmation = parsed.confidence < 0.7 || !parsed.entities.title;
  
  let confirmationMessage = '';
  
  switch (parsed.intent) {
    case 'add_event':
      confirmationMessage = needsConfirmation
        ? `I understand you want to add "${parsed.entities.title || 'an event'}"${parsed.entities.date ? ` on ${formatDate(parsed.entities.date)}` : ''}${parsed.entities.time ? ` at ${formatTime(parsed.entities.time)}` : ''}. Is that correct?`
        : `Adding "${parsed.entities.title}"${parsed.entities.date ? ` on ${formatDate(parsed.entities.date)}` : ''}${parsed.entities.time ? ` at ${formatTime(parsed.entities.time)}` : ''}. Say "yes" to confirm or "no" to cancel.`;
      break;
      
    case 'modify_event':
      confirmationMessage = needsConfirmation
        ? `I understand you want to change "${parsed.entities.title || 'an event'}" to ${parsed.entities.date ? formatDate(parsed.entities.date) : ''}${parsed.entities.time ? ` at ${formatTime(parsed.entities.time)}` : ''}. Is that correct?`
        : `Changing "${parsed.entities.title}" to ${parsed.entities.date ? formatDate(parsed.entities.date) : ''}${parsed.entities.time ? ` at ${formatTime(parsed.entities.time)}` : ''}. Say "yes" to confirm or "no" to cancel.`;
      break;
      
    case 'delete_event':
      confirmationMessage = needsConfirmation
        ? `I understand you want to remove "${parsed.entities.title || 'an event'}" from the calendar. Is that correct?`
        : `Removing "${parsed.entities.title}" from the calendar. Say "yes" to confirm or "no" to cancel.`;
      break;
      
    case 'set_reminder':
      confirmationMessage = needsConfirmation
        ? `I understand you want to set a reminder for "${parsed.entities.title || 'something'}". Is that correct?`
        : `Setting reminder for "${parsed.entities.title}". Say "yes" to confirm or "no" to cancel.`;
      break;
      
    case 'check_schedule':
      confirmationMessage = "I'll check your calendar. Is that what you want?";
      break;
      
    case 'ask_question':
      confirmationMessage = `You want to know about "${parsed.entities.title || 'something'}". Is that correct?`;
      break;
      
    default:
      confirmationMessage = "I'm not sure I understood. Could you try again?";
  }
  
  return {
    state: 'pending',
    parsedCommand: parsed,
    confirmationMessage,
    needsConfirmation,
  };
}

// Process confirmation response
export function processConfirmation(confirmation: CommandConfirmation, response: string): CommandConfirmation {
  const normalizedResponse = response.toLowerCase().trim();
  
  // Positive responses
  const positiveResponses = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'correct', 'right', 'that\'s right', 'do it', 'go ahead', 'yes please'];
  
  // Negative responses  
  const negativeResponses = ['no', 'nope', 'nah', 'cancel', 'stop', 'wait', 'wrong', 'incorrect', 'not that', 'different'];
  
  if (positiveResponses.some(r => normalizedResponse.includes(r))) {
    return {
      ...confirmation,
      state: 'confirmed',
      confirmationMessage: getConfirmationSuccessMessage(confirmation.parsedCommand),
    };
  }
  
  if (negativeResponses.some(r => normalizedResponse.includes(r))) {
    return {
      ...confirmation,
      state: 'cancelled',
      confirmationMessage: 'OK, cancelled. What would you like to do instead?',
    };
  }
  
  // Still pending - ask again
  return {
    ...confirmation,
    confirmationMessage: "I didn't catch that. Please say 'yes' to confirm or 'no' to cancel.",
  };
}

// Get success message after confirmation
function getConfirmationSuccessMessage(parsed: ParsedCommand): string {
  switch (parsed.intent) {
    case 'add_event':
      return `Done! Added "${parsed.entities.title}" to your calendar${parsed.entities.date ? ` for ${formatDate(parsed.entities.date)}` : ''}.`;
    case 'modify_event':
      return `Done! Updated "${parsed.entities.title}"${parsed.entities.date ? ` to ${formatDate(parsed.entities.date)}` : ''}.`;
    case 'delete_event':
      return `Done! Removed "${parsed.entities.title}" from your calendar.`;
    case 'set_reminder':
      return `Done! Set a reminder for "${parsed.entities.title}".`;
    case 'check_schedule':
      return "Let me check your calendar now...";
    case 'ask_question':
      return `Let me look up "${parsed.entities.title}" for you...`;
    default:
      return "Done!";
  }
}

// Helper to format date for display
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Helper to format time for display
function formatTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// Export confidence threshold constant for external use
export const CONFIDENCE_THRESHOLD = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
};
