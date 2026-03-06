// Kids Reading App - Progress Section
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getProgress, saveProgress } from '../storage';
import { KidProfile, KidProgress } from '../types';
import { badges } from '../content';

export default function ProgressPage() {
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
    if (prog) setProgress(prog);
  }, [router]);

  if (!profile || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
        <div className="text-4xl">Loading...</div>
      </div>
    );
  }

  // Calculate earned badges
  const earnedBadges = badges.filter((badge) => {
    switch (badge.id) {
      case 'first_lesson':
        return progress.completedLessons.length >= badge.requirement;
      case 'word_master':
        return progress.wordsLearned >= badge.requirement;
      case 'story_reader':
        return progress.storiesRead >= badge.requirement;
      case 'level_5':
        return progress.currentLevel >= 5;
      case 'level_10':
        return progress.currentLevel >= 10;
      case 'level_20':
        return progress.currentLevel >= 20;
      case 'streak_7':
        return progress.streaks >= 7;
      case 'streak_30':
        return progress.streaks >= 30;
      case 'perfect_quiz':
        return Object.values(progress.quizScores).some((score) => score === 100);
      default:
        return false;
    }
  });

  // Convert seconds to readable time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 to-pink-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/kids/menu')} className="text-2xl">
              ⬅️
            </button>
            <h1 className="text-2xl font-bold text-purple-700">⭐ My Progress</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 text-center">
          <div className="text-8xl mb-4">{profile.avatar}</div>
          <div className="text-3xl font-bold text-gray-800">{profile.name}</div>
          <div className="text-xl text-purple-600 font-bold mt-2">Level {progress.currentLevel}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard emoji="📚" value={progress.wordsLearned} label="Words Learned" color="bg-blue-100" />
          <StatCard emoji="📖" value={progress.storiesRead} label="Stories Read" color="bg-green-100" />
          <StatCard emoji="🔥" value={progress.streaks} label="Day Streak" color="bg-orange-100" />
          <StatCard emoji="⏱️" value={formatTime(progress.totalTimeSpent)} label="Time Reading" color="bg-purple-100" />
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🏆 My Badges</h2>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {badges.map((badge) => {
              const isEarned = earnedBadges.includes(badge);
              return (
                <div
                  key={badge.id}
                  className={`
                    rounded-2xl p-4 text-center transition-all
                    ${isEarned ? 'bg-gradient-to-br from-yellow-100 to-orange-100' : 'bg-gray-100 opacity-50'}
                  `}
                >
                  <div className="text-4xl mb-2">{isEarned ? badge.icon : '🔒'}</div>
                  <div className="text-sm font-bold text-gray-800">{badge.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{badge.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress to Next Level */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Level Progress</h2>
          
          <div className="mb-4">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Level {progress.currentLevel}</span>
              <span>Level {progress.currentLevel + 1}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-6 rounded-full transition-all"
                style={{ width: '30%' }}
              />
            </div>
          </div>
          
          <p className="text-gray-500 text-center">
            Complete more lessons to reach the next level!
          </p>
        </div>

        {/* Achievements Summary */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-white text-center">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-2xl font-bold mb-2">
            {earnedBadges.length} / {badges.length} Badges Earned!
          </div>
          <div className="text-white/80">
            Keep reading to earn more badges!
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  emoji,
  value,
  label,
  color,
}: {
  emoji: string;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-2xl p-6 text-center shadow-lg`}>
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
