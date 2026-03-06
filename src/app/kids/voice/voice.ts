// Kids Voice Command - LocalStorage utilities
// Simple voice commands for kids (no Supabase needed)

export interface VoiceCommand {
  id: string;
  type: 'add_event' | 'view_schedule' | 'set_reminder';
  title: string;
  date?: string;
  time?: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  VOICE_COMMANDS: 'kids_voice_commands',
};

export function getVoiceCommands(): VoiceCommand[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.VOICE_COMMANDS);
  return data ? JSON.parse(data) : [];
}

export function saveVoiceCommand(command: VoiceCommand): void {
  const commands = getVoiceCommands();
  commands.unshift(command); // Add to beginning
  // Keep only last 50 commands
  const trimmed = commands.slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.VOICE_COMMANDS, JSON.stringify(trimmed));
}

export function getTodayCommands(): VoiceCommand[] {
  const today = new Date().toISOString().split('T')[0];
  return getVoiceCommands().filter(c => c.createdAt.startsWith(today));
}

export function getUpcomingCommands(): VoiceCommand[] {
  const today = new Date().toISOString().split('T')[0];
  return getVoiceCommands().filter(c => c.date && c.date >= today);
}

// Simple parsers for kids
export function parseKidsCommand(text: string): { type: VoiceCommand['type']; title: string; date?: string; time?: string } {
  const lower = text.toLowerCase();
  
  // Check schedule keywords
  if (lower.includes('what') && (lower.includes('schedule') || lower.includes('plan') || lower.includes('doing') || lower.includes('today') || lower.includes('tomorrow'))) {
    return { type: 'view_schedule', title: 'Check Schedule' };
  }
  
  // Check reminder keywords
  if (lower.includes('remind') || lower.includes('tell me') || lower.includes('remember')) {
    // Extract what to remind
    const title = lower.replace(/.*(remind|tell|remember)\s*(me|us)?\s*(to)?\s*/i, '').trim() || 'Reminder';
    return { type: 'set_reminder', title: title.slice(0, 100) };
  }
  
  // Default to add event
  // Remove common prefixes
  let title = lower
    .replace(/^(add|schedule|put|create|new)\s+(a\s+)?(event\s+)?/i, '')
    .replace(/\s+(on|at|for|tomorrow|today)\s+.*$/i, '')
    .trim();
  
  // Handle "next [day]"  
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { type: 'add_event', title: title || 'Event', date: tomorrow.toISOString().split('T')[0] };
  }
  
  return { type: 'add_event', title: title || 'New Event', date: new Date().toISOString().split('T')[0] };
}

// Generate simple response for kids
export function generateKidsResponse(type: VoiceCommand['type'], data: { title: string; date?: string; time?: string; count?: number }): string {
  switch (type) {
    case 'view_schedule':
      if (data.count === 0) {
        return "You don't have anything planned today! Want to add something?";
      } else if (data.count === 1) {
        return `You have 1 thing today: ${data.title}!`;
      } else {
        return `You have ${data.count} things today!`;
      }
    case 'set_reminder':
      return `OK! I'll remind you about ${data.title}!`;
    case 'add_event':
    default:
      return `Added ${data.title} to your schedule!`;
  }
}
