// Kids Reading App - Parent Settings
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, getActiveProfile, setActiveProfile, deleteProfile, getProgress, initializeProgress } from '../storage';
import { KidProfile, KidProgress } from '../types';

export default function ParentSettings() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<KidProfile | null>(null);
  const [progress, setProgress] = useState<KidProgress | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const allProfiles = getProfiles();
    setProfiles(allProfiles);
    const active = getActiveProfile();
    if (active) {
      setActiveProfileState(active);
      const prog = getProgress(active.id);
      if (prog) setProgress(prog);
    }
  }

  function handleSwitchProfile(profile: KidProfile) {
    setActiveProfile(profile);
    const prog = getProgress(profile.id);
    if (!prog) {
      initializeProgress(profile.id);
    }
    router.push('/kids/menu');
  }

  function handleResetProgress() {
    if (!activeProfile) return;
    initializeProgress(activeProfile.id);
    loadData();
    alert('Progress has been reset!');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-gray-300">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/kids')} className="text-2xl">
              ⬅️
            </button>
            <h1 className="text-2xl font-bold text-gray-700">👨‍👩‍👧 Parent Settings</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Profile Info */}
        {activeProfile && progress && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Current Profile</h2>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{activeProfile.avatar}</span>
              <div>
                <div className="text-2xl font-bold text-gray-800">{activeProfile.name}</div>
                <div className="text-gray-500">Age {activeProfile.age}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{progress.currentLevel}</div>
                <div className="text-sm text-gray-500">Level</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{progress.wordsLearned}</div>
                <div className="text-sm text-gray-500">Words</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{progress.storiesRead}</div>
                <div className="text-sm text-gray-500">Stories</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{progress.streaks}</div>
                <div className="text-sm text-gray-500">Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Switch Profile */}
        {profiles.length > 1 && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Switch Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSwitchProfile(profile)}
                  className={`
                    p-4 rounded-2xl text-center transition-all
                    ${profile.id === activeProfile?.id
                      ? 'bg-purple-100 ring-2 ring-purple-500'
                      : 'bg-gray-100 hover:bg-gray-200'}
                  `}
                >
                  <div className="text-4xl mb-2">{profile.avatar}</div>
                  <div className="font-bold text-gray-800">{profile.name}</div>
                  {profile.id === activeProfile?.id && (
                    <div className="text-sm text-purple-600">Active</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reset Progress */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Reset Progress</h2>
          <p className="text-gray-600 mb-4">
            This will reset all progress for {activeProfile?.name}. This cannot be undone.
          </p>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600"
            >
              🗑️ Reset Progress
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
              >
                Yes, Reset Everything
              </button>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">About</h2>
          <div className="text-gray-600 space-y-2">
            <p>📚 Kids Reading Adventure</p>
            <p>Version 1.0.0</p>
            <p>All data is stored locally on this device.</p>
          </div>
        </div>

        {/* Back to Kids App */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/kids')}
            className="px-8 py-4 bg-purple-500 text-white rounded-2xl font-bold hover:bg-purple-600 text-xl"
          >
            Go to Kids App 📚
          </button>
        </div>
      </main>
    </div>
  );
}
