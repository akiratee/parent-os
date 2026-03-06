// Kids Reading App - Types and Interfaces

export interface KidProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  createdAt: string;
}

export interface KidProgress {
  profileId: string;
  currentLevel: number;
  wordsLearned: number;
  storiesRead: number;
  totalTimeSpent: number; // in seconds
  completedLessons: string[];
  quizScores: Record<string, number>;
  badges: string[];
  streaks: number;
  lastActiveDate: string;
}

export interface ReadingLevel {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'phonics' | 'sight-words' | 'reading';
  content: string;
  words?: string[];
  quiz?: Quiz;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
}
