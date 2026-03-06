// Kids Voice Assistant - Simple Voice Interface
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile } from '../storage';
import { getVoiceCommands, saveVoiceCommand, parseKidsCommand, generateKidsResponse, VoiceCommand } from './voice';

export default function KidsVoicePage() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    // Check for active profile
    const profile = getActiveProfile();
    if (!profile) {
      router.push('/kids');
      return;
    }

    // Load recent commands
    setRecentCommands(getVoiceCommands().slice(0, 5));

    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          processCommand(result);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          speak("Sorry, I didn't catch that. Try again!");
        };
      }

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [router]);

  function startListening() {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setResponse('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }

  function stopListening() {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }

  function speak(text: string) {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for kids
    utterance.pitch = 1.1; // Friendly tone
    utterance.volume = 1;

    // Try to find a friendly voice
    const voices = synthRef.current.getVoices();
    const friendlyVoice = voices.find((v: any) => 
      v.name.includes('Samantha') || 
      v.name.includes('Google') ||
      v.name.includes('English') ||
      v.name.includes('Female')
    );
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }

  function processCommand(text: string) {
    const parsed = parseKidsCommand(text);
    
    // Save command
    const command: VoiceCommand = {
      id: Date.now().toString(),
      type: parsed.type,
      title: parsed.title,
      date: parsed.date,
      time: parsed.time,
      createdAt: new Date().toISOString(),
    };
    saveVoiceCommand(command);

    // Generate response based on command type
    let responseText = '';
    
    if (parsed.type === 'view_schedule') {
      const today = new Date().toISOString().split('T')[0];
      const todayCommands = getVoiceCommands().filter((c: VoiceCommand) => c.date === today);
      const count = todayCommands.length;
      const firstTitle = todayCommands[0]?.title || 'nothing';
      responseText = generateKidsResponse('view_schedule', { title: firstTitle, count });
    } else if (parsed.type === 'set_reminder') {
      responseText = generateKidsResponse('set_reminder', { title: parsed.title });
    } else {
      responseText = generateKidsResponse('add_event', { title: parsed.title, date: parsed.date });
    }

    setResponse(responseText);
    speak(responseText);
    setRecentCommands(getVoiceCommands().slice(0, 5));
  }

  // Quick action buttons for kids
  function handleQuickAction(action: 'add_event' | 'view_schedule' | 'set_reminder') {
    const questions: Record<string, string> = {
      add_event: "What do you want to add?",
      view_schedule: "Let me check your schedule...",
      set_reminder: "What should I remind you about?",
    };
    
    speak(questions[action]);
    
    // After question, start listening
    setTimeout(() => {
      startListening();
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={() => router.push('/kids/menu')}
            className="text-2xl"
          >
            ⬅️
          </button>
          <h1 className="text-2xl font-bold text-purple-600">
            🎤 Voice Helper
          </h1>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-2xl"
          >
            ☰
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Main Voice Button */}
        <div className="text-center mb-8">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`
              w-48 h-48 rounded-full transition-all transform hover:scale-105 shadow-2xl
              ${isListening 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-purple-500 hover:bg-purple-600'
              }
            `}
          >
            <div className="text-6xl">
              {isListening ? '🛑' : '🎤'}
            </div>
          </button>
          <p className="mt-4 text-xl font-bold text-white">
            {isListening ? 'Tap to stop' : 'Tap to talk!'}
          </p>
        </div>

        {/* Status Indicators */}
        {isListening && (
          <div className="bg-white/90 rounded-3xl p-6 mb-6 text-center shadow-xl">
            <div className="text-4xl mb-2">👂 Listening...</div>
            <div className="text-gray-600">Speak now!</div>
          </div>
        )}

        {isSpeaking && (
          <div className="bg-white/90 rounded-3xl p-6 mb-6 text-center shadow-xl">
            <div className="text-4xl mb-2">🔊 Speaking...</div>
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="bg-white/90 rounded-3xl p-6 mb-6 shadow-xl">
            <div className="text-sm text-gray-500 mb-1">You said:</div>
            <div className="text-xl font-bold text-gray-800">"{transcript}"</div>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="bg-purple-100 rounded-3xl p-6 mb-6 shadow-xl">
            <div className="text-sm text-purple-600 mb-1">Voice Helper says:</div>
            <div className="text-xl font-bold text-purple-800">"{response}"</div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => handleQuickAction('add_event')}
            className="bg-green-400 hover:bg-green-500 rounded-3xl p-6 shadow-xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-2">➕</div>
            <div className="text-white font-bold">Add</div>
          </button>

          <button
            onClick={() => handleQuickAction('view_schedule')}
            className="bg-blue-400 hover:bg-blue-500 rounded-3xl p-6 shadow-xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-2">📅</div>
            <div className="text-white font-bold">Schedule</div>
          </button>

          <button
            onClick={() => handleQuickAction('set_reminder')}
            className="bg-orange-400 hover:bg-orange-500 rounded-3xl p-6 shadow-xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-2">🔔</div>
            <div className="text-white font-bold">Remind</div>
          </button>
        </div>

        {/* Recent Activity */}
        {recentCommands.length > 0 && (
          <div className="bg-white/80 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Recent Activity</h2>
            <div className="space-y-2">
              {recentCommands.map((cmd) => (
                <div key={cmd.id} className="flex items-center gap-2 text-gray-600">
                  <span className="text-xl">
                    {cmd.type === 'add_event' ? '➕' : cmd.type === 'view_schedule' ? '📅' : '🔔'}
                  </span>
                  <span className="font-medium">{cmd.title}</span>
                  <span className="text-sm text-gray-400">
                    {cmd.date ? new Date(cmd.date).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Help Text */}
      <div className="text-center pb-8">
        <p className="text-white/80 text-sm">
          Try saying: "Add soccer practice" or "What's on today?"
        </p>
      </div>
    </div>
  );
}
