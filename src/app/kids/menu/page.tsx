// Kids Reading App - Main Menu
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getProgress, updateStreak } from '../storage';
import { KidProfile, KidProgress } from '../types';

export default function MainMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [progress, setProgress] = useState<KidProgress | null>(null);

  useEffect(() => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) {
      router.push('/kids');
      return;
    }
    setProfile(activeProfile);
    
    const prog = getProgress(activeProfile.id);
    if (prog) {
      setProgress(prog);
      updateStreak(activeProfile.id);
    }
  }, [router]);

  if (!profile || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-200 flex items-center justify-center">
        <div className="text-4xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-200">
      {/* Header with Profile */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/kids')}
              className="text-2xl"
            >
              ⬅️
            </button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{profile.avatar}</span>
              <div>
                <div className="text-xl font-bold text-gray-800">{profile.name}</div>
                <div className="text-sm text-gray-500">Level {progress.currentLevel}</div>
              </div>
            </div>
            <div className="text-2xl">
              🔥 {progress.streaks}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Words Learned</span>
            <span>{progress.wordsLearned}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all"
              style={{ width: `${Math.min(100, (progress.wordsLearned / 200) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Stories Read</span>
            <span>{progress.storiesRead}</span>
          </div>
        </div>

        {/* Main Menu Buttons */}
        <div className="grid grid-cols-2 gap-6">
          {/* Read Button */}
          <MenuButton
            emoji="📖"
            title="Read"
            subtitle="Stories & Lessons"
            color="from-green-400 to-emerald-500"
            onClick={() => router.push('/kids/read')}
          />

          {/* Practice Button */}
          <MenuButton
            emoji="✏️"
            title="Practice"
            subtitle="Writing & Phonics"
            color="from-blue-400 to-cyan-500"
            onClick={() => router.push('/kids/practice')}
          />

          {/* Games Button */}
          <MenuButton
            emoji="🎮"
            title="Games"
            subtitle="Fun & Learning"
            color="from-orange-400 to-red-500"
            onClick={() => router.push('/kids/games')}
          />

          {/* Progress Button */}
          <MenuButton
            emoji="⭐"
            title="My Progress"
            subtitle="Badges & Stars"
            color="from-purple-400 to-pink-500"
            onClick={() => router.push('/kids/progress')}
          />

          {/* Voice Assistant Button - NEW */}
          <MenuButton
            emoji="🎤"
            title="Voice Helper"
            subtitle="Talk to add events"
            color="from-indigo-400 to-purple-500"
            onClick={() => router.push('/kids/voice')}
          />
        </div>

        {/* Current Level Info */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">📚 Current Level</h3>
          <div className="text-3xl font-bold text-purple-600">Level {progress.currentLevel}</div>
          <p className="text-gray-500 mt-2">Keep reading to level up!</p>
        </div>
      </main>
    </div>
  );
}

// Menu Button Component
function MenuButton({
  emoji,
  title,
  subtitle,
  color,
  onClick,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all text-white`}
    >
      <div className="text-6xl mb-4">{emoji}</div>
      <div className="text-2xl font-bold">{title}</div>
      <div className="text-white/80">{subtitle}</div>
    </button>
  );
}
