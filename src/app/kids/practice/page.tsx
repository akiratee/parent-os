// Kids Reading App - Practice Section
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getProgress, saveProgress } from '../storage';
import { KidProfile, KidProgress } from '../types';

export default function PracticePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [progress, setProgress] = useState<KidProgress | null>(null);
  const [practiceType, setPracticeType] = useState<string | null>(null);

  useEffect(() => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) {
      router.push('/kids');
      return;
    }
    setProfile(activeProfile);
    const prog = getProgress(activeProfile.id);
    if (prog) setProgress(prog);
  }, [router]);

  if (!profile || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center">
        <div className="text-4xl">Loading...</div>
      </div>
    );
  }

  if (practiceType === 'flashcards') {
    return <FlashcardsPractice onBack={() => setPracticeType(null)} />;
  }

  if (practiceType === 'spelling') {
    return <SpellingPractice onBack={() => setPracticeType(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-cyan-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/kids/menu')} className="text-2xl">
              ⬅️
            </button>
            <h1 className="text-2xl font-bold text-blue-700">✏️ Practice</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          What do you want to practice?
        </h2>

        <div className="space-y-6">
          {/* Flashcards */}
          <button
            onClick={() => setPracticeType('flashcards')}
            className="w-full bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-left"
          >
            <div className="flex items-center gap-6">
              <div className="text-6xl">🃏</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">Flashcards</div>
                <div className="text-gray-500">Learn words with flashcards!</div>
              </div>
              <div className="ml-auto text-4xl">▶️</div>
            </div>
          </button>

          {/* Spelling */}
          <button
            onClick={() => setPracticeType('spelling')}
            className="w-full bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-left"
          >
            <div className="flex items-center gap-6">
              <div className="text-6xl">✍️</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">Spelling Practice</div>
                <div className="text-gray-500">Practice writing words!</div>
              </div>
              <div className="ml-auto text-4xl">▶️</div>
            </div>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 bg-white/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Practice Tips</h3>
          <ul className="text-gray-600 space-y-2">
            <li>• Practice a little bit every day!</li>
            <li>• Try to read out loud</li>
            <li>• Don't be afraid to make mistakes</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// Flashcards Practice Component
function FlashcardsPractice({ onBack }: { onBack: () => void }) {
  const words = [
    { word: 'cat', hint: 'A furry pet that says meow' },
    { word: 'dog', hint: 'A furry pet that says woof' },
    { word: 'sun', hint: 'It shines in the sky' },
    { word: 'run', hint: 'What you do with your legs' },
    { word: 'big', hint: 'The opposite of small' },
    { word: 'red', hint: 'A color like an apple' },
    { word: 'tree', hint: 'It has leaves and branches' },
    { word: 'fish', hint: 'It swims in water' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);

  const currentWord = words[currentIndex];

  function nextWord() {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowHint(false);
    } else {
      // Reset
      setCurrentIndex(0);
      setShowHint(false);
    }
  }

  function markKnown() {
    if (!knownWords.includes(currentIndex)) {
      setKnownWords([...knownWords, currentIndex]);
    }
    nextWord();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-cyan-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-2xl">⬅️</button>
            <h1 className="text-xl font-bold text-blue-700">🃏 Flashcards</h1>
            <div className="text-lg">{currentIndex + 1}/{words.length}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Progress */}
        <div className="w-full bg-white rounded-full h-3 mb-8">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <div
            onClick={() => setShowHint(!showHint)}
            className="bg-white rounded-3xl p-12 shadow-2xl text-center cursor-pointer min-h-[300px] flex flex-col items-center justify-center"
          >
            <div className="text-6xl font-bold text-gray-800 mb-4">
              {currentWord.word}
            </div>
            {showHint && (
              <div className="text-lg text-gray-500 mt-4 animate-fade-in">
                💡 {currentWord.hint}
              </div>
            )}
            {!showHint && (
              <div className="text-sm text-gray-400 mt-4">Tap for hint!</div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={nextWord}
              className="flex-1 py-4 px-6 rounded-2xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
            >
              Skip ⏭️
            </button>
            <button
              onClick={markKnown}
              className="flex-1 py-4 px-6 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 text-xl"
            >
              I Know This! ✅
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 text-center text-gray-600">
          You've learned {knownWords.length} words this session!
        </div>
      </main>
    </div>
  );
}

// Spelling Practice Component
function SpellingPractice({ onBack }: { onBack: () => void }) {
  const words = ['cat', 'dog', 'sun', 'run', 'big', 'red', 'tree', 'fish', 'book', 'play'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  const currentWord = words[currentIndex];

  function checkSpelling() {
    if (input.toLowerCase().trim() === currentWord) {
      setResult('correct');
      setTimeout(() => {
        nextWord();
      }, 1000);
    } else {
      setResult('wrong');
      setTimeout(() => {
        setResult(null);
        setInput('');
      }, 1500);
    }
  }

  function nextWord() {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
    setResult(null);
    setInput('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-cyan-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-2xl">⬅️</button>
            <h1 className="text-xl font-bold text-blue-700">✍️ Spelling Practice</h1>
            <div className="text-lg">{currentIndex + 1}/{words.length}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Progress */}
        <div className="w-full bg-white rounded-full h-3 mb-8">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>

        {/* Hint */}
        <div className="bg-white/50 rounded-2xl px-8 py-4 mb-8">
          <div className="text-lg text-gray-600">Spell this word:</div>
        </div>

        {/* Word Display */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8 w-full max-w-md text-center">
          <div className="text-4xl mb-2">🤔</div>
          <div className="text-2xl text-gray-500">What's this word?</div>
          <div className="text-sm text-gray-400 mt-4">Clue: It has {currentWord.length} letters</div>
        </div>

        {/* Input */}
        <div className="w-full max-w-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkSpelling()}
            placeholder="Type the word..."
            className={`
              w-full px-6 py-4 rounded-2xl text-center text-2xl font-bold border-4
              ${result === 'correct' ? 'border-green-500 bg-green-100' : ''}
              ${result === 'wrong' ? 'border-red-500 bg-red-100' : ''}
              ${!result ? 'border-blue-300 bg-white' : ''}
              focus:outline-none
            `}
          />

          <button
            onClick={checkSpelling}
            disabled={!input.trim()}
            className="w-full mt-4 py-4 px-6 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:bg-gray-300 text-xl"
          >
            Check ✓
          </button>
        </div>

        {/* Result Message */}
        {result === 'correct' && (
          <div className="mt-8 text-4xl">🎉 Correct!</div>
        )}
        {result === 'wrong' && (
          <div className="mt-8 text-4xl">❌ Try Again!</div>
        )}
      </main>
    </div>
  );
}
