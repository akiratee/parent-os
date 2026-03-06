// Kids Reading App - LocalStorage utilities
import { KidProfile, KidProgress, ReadingLevel, Lesson, Badge } from './types';

const STORAGE_KEYS = {
  PROFILES: 'kids_reading_profiles',
  PROGRESS: 'kids_reading_progress',
  ACTIVE_PROFILE: 'kids_reading_active_profile',
};

// Profile functions
export function getProfiles(): KidProfile[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
  return data ? JSON.parse(data) : [];
}

export function saveProfile(profile: KidProfile): void {
  const profiles = getProfiles();
  profiles.push(profile);
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

export function deleteProfile(profileId: string): void {
  const profiles = getProfiles().filter(p => p.id !== profileId);
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  
  // Also delete progress
  const progress = getProgress(profileId);
  if (progress) {
    localStorage.removeItem(`${STORAGE_KEYS.PROGRESS}_${profileId}`);
  }
  
  // Clear active if it was this profile
  const active = getActiveProfile();
  if (active?.id === profileId) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
  }
}

export function setActiveProfile(profile: KidProfile | null): void {
  if (profile) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, JSON.stringify(profile));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
  }
}

export function getActiveProfile(): KidProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
  return data ? JSON.parse(data) : null;
}

// Progress functions
export function getProgress(profileId: string): KidProgress | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`${STORAGE_KEYS.PROGRESS}_${profileId}`);
  return data ? JSON.parse(data) : null;
}

export function saveProgress(progress: KidProgress): void {
  localStorage.setItem(`${STORAGE_KEYS.PROGRESS}_${progress.profileId}`, JSON.stringify(progress));
}

export function initializeProgress(profileId: string): KidProgress {
  const progress: KidProgress = {
    profileId,
    currentLevel: 1,
    wordsLearned: 0,
    storiesRead: 0,
    totalTimeSpent: 0,
    completedLessons: [],
    quizScores: {},
    badges: [],
    streaks: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
  };
  saveProgress(progress);
  return progress;
}

export function updateStreak(profileId: string): void {
  const progress = getProgress(profileId);
  if (!progress) return;
  
  const today = new Date().toISOString().split('T')[0];
  const lastActive = progress.lastActiveDate;
  
  if (lastActive === today) return;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastActive === yesterdayStr) {
    progress.streaks += 1;
  } else {
    progress.streaks = 1;
  }
  
  progress.lastActiveDate = today;
  saveProgress(progress);
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
