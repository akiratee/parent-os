// Kids Reading App - Main Page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles, getActiveProfile, setActiveProfile, deleteProfile, getProgress, initializeProgress } from './storage';
import { KidProfile } from './types';

export default function KidsReadingApp() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<KidProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  function loadProfiles() {
    const allProfiles = getProfiles();
    setProfiles(allProfiles);
  }

  function handleSelectProfile(profile: KidProfile) {
    setSelectedProfile(profile);
    // Ensure progress exists
    const progress = getProgress(profile.id);
    if (!progress) {
      initializeProgress(profile.id);
    }
    setActiveProfile(profile);
    router.push('/kids/menu');
  }

  function handleDeleteProfile(profileId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this profile? All progress will be lost.')) {
      deleteProfile(profileId);
      loadProfiles();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-purple-600">
            📚 Kids Reading Adventure! 🌟
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Selection */}
        {!showCreate ? (
          <div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Who is reading today?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="bg-white rounded-3xl p-6 shadow-xl cursor-pointer transform hover:scale-105 transition-all hover:shadow-2xl border-4 border-yellow-300"
                >
                  <div className="text-6xl text-center mb-4">{profile.avatar}</div>
                  <div className="text-2xl font-bold text-center text-gray-800">{profile.name}</div>
                  <div className="text-center text-gray-500">Age {profile.age}</div>
                  <button
                    onClick={(e) => handleDeleteProfile(profile.id, e)}
                    className="mt-4 w-full text-red-500 text-sm hover:text-red-700"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}

              {/* Add New Profile Button */}
              <div
                onClick={() => setShowCreate(true)}
                className="bg-white/50 rounded-3xl p-6 shadow-xl cursor-pointer transform hover:scale-105 transition-all border-4 border-dashed border-purple-300 flex items-center justify-center min-h-[200px]"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">➕</div>
                  <div className="text-xl font-bold text-purple-600">Add New Kid</div>
                </div>
              </div>
            </div>

            {/* Parent Access */}
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/kids/parent')}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                👨‍👩‍👧 Parent Settings
              </button>
            </div>
          </div>
        ) : (
          <CreateProfile onBack={() => setShowCreate(false)} onCreated={loadProfiles} />
        )}
      </main>
    </div>
  );
}

// Create Profile Component
function CreateProfile({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [avatar, setAvatar] = useState('🐻');

  const avatarOptions = ['🐻', '🐱', '🐶', '🐰', '🐼', '🦁', '🐘', '🐵', '🐧', '🦄', '🦋', '🦉'];

  function handleCreate() {
    if (!name.trim()) return;

    const { saveProfile, generateId } = require('./storage');
    const profile: KidProfile = {
      id: generateId(),
      name: name.trim(),
      avatar,
      age,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    onCreated();
    router.push('/kids/menu');
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center text-purple-600 mb-8">
        Create Your Profile! 🎉
      </h2>

      {/* Name Input */}
      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">What is your name?</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name..."
          className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-xl"
        />
      </div>

      {/* Age Input */}
      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">How old are you?</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAge(Math.max(3, age - 1))}
            className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold hover:bg-purple-200"
          >
            -
          </button>
          <span className="text-3xl font-bold text-purple-600 w-12 text-center">{age}</span>
          <button
            onClick={() => setAge(Math.min(10, age + 1))}
            className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold hover:bg-purple-200"
          >
            +
          </button>
        </div>
      </div>

      {/* Avatar Selection */}
      <div className="mb-8">
        <label className="block text-gray-700 font-bold mb-2">Choose your animal!</label>
        <div className="grid grid-cols-6 gap-2">
          {avatarOptions.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-4xl p-2 rounded-xl transition-all ${
                avatar === a
                  ? 'bg-purple-100 scale-110 ring-2 ring-purple-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6 text-center">
        <div className="text-6xl mb-2">{avatar}</div>
        <div className="text-2xl font-bold text-gray-800">{name || 'Your Name'}</div>
        <div className="text-gray-500">Age {age}</div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-6 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
        >
          ⬅️ Back
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex-1 py-3 px-6 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Start Reading! 📚
        </button>
      </div>
    </div>
  );
}
