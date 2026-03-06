// Kids Reading App - Games Section
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getProgress } from '../storage';
import { KidProfile, KidProgress } from '../types';

export default function GamesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [progress, setProgress] = useState<KidProgress | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

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
      <div className="min-h-screen bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
        <div className="text-4xl">Loading...</div>
      </div>
    );
  }

  if (selectedGame === 'wordMatch') {
    return <WordMatchGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === 'wordSearch') {
    return <WordSearchGame onBack={() => setSelectedGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 to-red-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/kids/menu')} className="text-2xl">
              ⬅️
            </button>
            <h1 className="text-2xl font-bold text-orange-700">🎮 Games</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Pick a Fun Game!
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Word Match */}
          <button
            onClick={() => setSelectedGame('wordMatch')}
            className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="text-6xl mb-4">🃏</div>
            <div className="text-xl font-bold text-gray-800">Word Match</div>
            <div className="text-gray-500">Match words to pictures!</div>
          </button>

          {/* Word Search */}
          <button
            onClick={() => setSelectedGame('wordSearch')}
            className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-xl font-bold text-gray-800">Word Search</div>
            <div className="text-gray-500">Find hidden words!</div>
          </button>
        </div>

        {/* More Games Coming Soon */}
        <div className="mt-12 text-center">
          <div className="bg-white/50 rounded-2xl p-6 inline-block">
            <div className="text-4xl mb-2">🚀</div>
            <div className="text-gray-600">More games coming soon!</div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Word Match Game
function WordMatchGame({ onBack }: { onBack: () => void }) {
  const words = [
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
    { word: 'sun', emoji: '☀️' },
    { word: 'tree', emoji: '🌳' },
  ];

  const [cards, setCards] = useState<{ id: number; content: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    // Create shuffled cards
    const allCards = [
      ...words.map((w) => ({ id: Math.random(), content: w.word, isFlipped: false, isMatched: false })),
      ...words.map((w) => ({ id: Math.random(), content: w.emoji, isFlipped: false, isMatched: false })),
    ];
    // Shuffle
    setCards(allCards.sort(() => Math.random() - 0.5));
  }, []);

  function handleCardClick(id: number) {
    const cardIndex = cards.findIndex((c) => c.id === id);
    if (cards[cardIndex].isFlipped || cards[cardIndex].isMatched || selected.length >= 2) return;

    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const card1 = cards.find((c) => c.id === newSelected[0]);
      const card2 = cards.find((c) => c.id === newSelected[1]);

      // Check if it's a match
      const word1 = words.find((w) => w.word === card1?.content);
      const word2 = words.find((w) => w.word === card2?.content);

      if ((word1 && card2?.content === word1.emoji) || (word2 && card1?.content === word2.emoji)) {
        // Match found!
        setTimeout(() => {
          const matchedCards = cards.map((c) =>
            c.id === newSelected[0] || c.id === newSelected[1] ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setMatches(matches + 1);
          setSelected([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const flippedCards = cards.map((c) =>
            c.id === newSelected[0] || c.id === newSelected[1] ? { ...c, isFlipped: false } : c
          );
          setCards(flippedCards);
          setSelected([]);
        }, 1000);
      }
    }
  }

  const isWin = matches === words.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 to-red-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-2xl">⬅️</button>
            <h1 className="text-xl font-bold text-orange-700">🃏 Word Match</h1>
            <div className="text-lg">Matches: {matches}/{words.length}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isWin ? (
          <div className="text-center">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-gray-800 mb-8">You Won!</div>
            <button
              onClick={onBack}
              className="py-4 px-8 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 text-xl"
            >
              Play Again ↺
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched}
                className={`
                  aspect-square rounded-2xl text-4xl font-bold transition-all
                  ${card.isFlipped || card.isMatched ? 'bg-white' : 'bg-orange-400'}
                  ${card.isMatched ? 'opacity-50' : 'hover:scale-105'}
                  flex items-center justify-center
                `}
              >
                {card.isFlipped || card.isMatched ? card.content : '❓'}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Word Search Game (Simple Version)
function WordSearchGame({ onBack }: { onBack: () => void }) {
  const grid = [
    ['C', 'A', 'T', 'X', 'Y'],
    ['D', 'O', 'G', 'Z', 'W'],
    ['S', 'U', 'N', 'Q', 'R'],
    ['T', 'R', 'E', 'E', 'P'],
    ['F', 'I', 'S', 'H', 'K'],
  ];

  const targetWords = ['CAT', 'DOG', 'SUN', 'TREE', 'FISH'];
  const [foundWords, setFoundWords] = useState<string[]>([]);

  function handleWordClick(word: string) {
    if (!foundWords.includes(word)) {
      setFoundWords([...foundWords, word]);
    }
  }

  const isWin = foundWords.length === targetWords.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 to-red-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-2xl">⬅️</button>
            <h1 className="text-xl font-bold text-orange-700">🔍 Word Search</h1>
            <div className="text-lg">{foundWords.length}/{targetWords.length}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isWin ? (
          <div className="text-center">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-gray-800 mb-8">You Found All Words!</div>
            <button
              onClick={onBack}
              className="py-4 px-8 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 text-xl"
            >
              Play Again ↺
            </button>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="bg-white rounded-2xl p-4 shadow-xl mb-8 inline-block">
              <div className="grid grid-cols-5 gap-2">
                {grid.flat().map((letter, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl font-bold text-gray-800"
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>

            {/* Word List */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Find these words:</h3>
              <div className="flex flex-wrap gap-3">
                {targetWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => handleWordClick(word)}
                    className={`
                      px-4 py-2 rounded-full font-bold transition-all
                      ${foundWords.includes(word)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                  >
                    {foundWords.includes(word) ? '✓ ' : ''}{word}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
