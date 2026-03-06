// Kids Reading App - Reading Section
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getProgress, saveProgress } from '../storage';
import { KidProfile, KidProgress, ReadingLevel, Lesson } from '../types';
import { readingLevels } from '../content';

export default function ReadPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<KidProfile | null>(null);
  const [progress, setProgress] = useState<KidProgress | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

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
      // Set current level as default selection
      const currentLevel = readingLevels.find(l => l.id === prog.currentLevel);
      if (currentLevel) {
        setSelectedLevel(currentLevel);
      }
    }
  }, [router]);

  if (!profile || !progress || !selectedLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center">
        <div className="text-4xl">Loading...</div>
      </div>
    );
  }

  // If a lesson is selected, show the lesson content
  if (selectedLesson) {
    return (
      <LessonView
        lesson={selectedLesson}
        level={selectedLevel}
        onBack={() => setSelectedLesson(null)}
        onComplete={() => {
          // Mark lesson as complete
          if (progress && !progress.completedLessons.includes(selectedLesson.id)) {
            const newProgress = {
              ...progress,
              completedLessons: [...progress.completedLessons, selectedLesson.id],
              wordsLearned: progress.wordsLearned + (selectedLesson.words?.length || 0),
              storiesRead: selectedLesson.type === 'reading' ? progress.storiesRead + 1 : progress.storiesRead,
            };
            saveProgress(newProgress);
            setProgress(newProgress);
          }
          setSelectedLesson(null);
        }}
      />
    );
  }

  // If a level is selected but not lesson, show lessons
  if (selectedLevel) {
    return (
      <LessonsView
        level={selectedLevel}
        completedLessons={progress.completedLessons}
        onSelectLesson={(lesson) => setSelectedLesson(lesson)}
        onBack={() => router.push('/kids/menu')}
        currentLevel={progress.currentLevel}
      />
    );
  }

  // Show level selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 to-emerald-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/kids/menu')} className="text-2xl">
              ⬅️
            </button>
            <h1 className="text-2xl font-bold text-green-700">📖 Reading Lessons</h1>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Choose Your Level!
        </h2>

        <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
          {readingLevels.slice(0, 15).map((level) => {
            const isUnlocked = level.id <= progress.currentLevel;
            const isCompleted = level.id < progress.currentLevel;
            
            return (
              <button
                key={level.id}
                onClick={() => isUnlocked && setSelectedLevel(level)}
                disabled={!isUnlocked}
                className={`
                  relative rounded-2xl p-4 text-center transition-all
                  ${isUnlocked 
                    ? 'bg-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer' 
                    : 'bg-gray-200 cursor-not-allowed opacity-50'}
                  ${isCompleted ? 'ring-4 ring-green-400' : ''}
                `}
              >
                <div className="text-3xl font-bold text-gray-800">{level.id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {level.title.split(' ')[0]}
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="absolute -top-2 -right-2 text-xl">✅</div>
                )}
              </button>
            );
          })}
        </div>

        {/* More levels indicator */}
        {progress.currentLevel > 15 && (
          <div className="text-center mt-8 text-gray-600">
            <p>More levels coming soon! 🎉</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Lessons View Component
function LessonsView({
  level,
  completedLessons,
  onSelectLesson,
  onBack,
  currentLevel,
}: {
  level: ReadingLevel;
  completedLessons: string[];
  onSelectLesson: (lesson: Lesson) => void;
  onBack: () => void;
  currentLevel: number;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 to-emerald-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-2xl">⬅️</button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-green-700">Level {level.id}</h1>
              <p className="text-sm text-gray-600">{level.title}</p>
            </div>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600 mb-8">{level.description}</p>

        <div className="space-y-4">
          {level.lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const typeEmoji = lesson.type === 'phonics' ? '🔤' : lesson.type === 'sight-words' ? '👁️' : '📚';
            
            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson)}
                className="w-full bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{typeEmoji}</div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-800">
                      {index + 1}. {lesson.title}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{lesson.type}</div>
                  </div>
                  {isCompleted ? (
                    <div className="text-2xl">✅</div>
                  ) : (
                    <div className="text-2xl">▶️</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// Lesson View Component
function LessonView({
  lesson,
  level,
  onBack,
  onComplete,
}: {
  lesson: Lesson;
  level: ReadingLevel;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const typeEmoji = lesson.type === 'phonics' ? '🔤' : lesson.type === 'sight-words' ? '👁️' : '📚';

  if (showQuiz && lesson.quiz) {
    return (
      <QuizView
        quiz={lesson.quiz}
        onComplete={(score) => {
          setQuizScore(score);
        }}
        onFinish={() => {
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 to-emerald-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-2xl">⬅️</button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-green-700">{level.title}</h1>
              <p className="text-sm text-gray-600">{lesson.title}</p>
            </div>
            <div className="text-2xl">{typeEmoji}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Lesson Content */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8">
          <div className="prose max-w-none whitespace-pre-wrap text-lg leading-relaxed text-gray-700">
            {lesson.content}
          </div>
        </div>

        {/* Words Learned */}
        {lesson.words && lesson.words.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Words in this lesson:</h3>
            <div className="flex flex-wrap gap-2">
              {lesson.words.map((word, i) => (
                <span
                  key={i}
                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-4 px-6 rounded-2xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
          >
            ⬅️ Back
          </button>
          <button
            onClick={() => setShowQuiz(true)}
            className="flex-1 py-4 px-6 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 text-xl"
          >
            Take Quiz! 🎯
          </button>
        </div>
      </main>
    </div>
  );
}

// Quiz View Component
function QuizView({
  quiz,
  onComplete,
  onFinish,
}: {
  quiz: { questions: { id: string; question: string; options: string[]; correctAnswer: number }[] };
  onComplete: (score: number) => void;
  onFinish: () => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const question = quiz.questions[currentQuestion];

  function handleAnswer(index: number) {
    setSelectedAnswer(index);
    
    setTimeout(() => {
      if (index === question.correctAnswer) {
        setScore(score + 1);
      }
      
      setSelectedAnswer(null);
      
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
        onComplete(Math.round(((score + (index === question.correctAnswer ? 1 : 0)) / quiz.questions.length) * 100));
      }
    }, 1000);
  }

  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const isPerfect = percentage === 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md">
          <div className="text-6xl mb-4">{isPerfect ? '🏆' : '🌟'}</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {isPerfect ? 'Perfect Score!' : 'Great Job!'}
          </h2>
          <div className="text-6xl font-bold text-purple-600 mb-4">{percentage}%</div>
          <p className="text-gray-600 mb-8">
            You got {score} out of {quiz.questions.length} questions right!
          </p>
          <button
            onClick={onFinish}
            className="w-full py-4 px-6 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 text-xl"
          >
            Continue 📚
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 to-pink-200">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">Question {currentQuestion + 1}/{quiz.questions.length}</div>
            <div className="text-purple-600 font-bold">Score: {score}</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            {question.question}
          </h2>

          <div className="space-y-4">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = selectedAnswer !== null && isCorrect;
              const showWrong = isSelected && !isCorrect;
              
              return (
                <button
                  key={index}
                  onClick={() => !selectedAnswer && handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`
                    w-full p-4 rounded-2xl text-lg font-bold transition-all
                    ${showCorrect ? 'bg-green-500 text-white' : ''}
                    ${showWrong ? 'bg-red-500 text-white' : ''}
                    ${!selectedAnswer ? 'bg-purple-100 hover:bg-purple-200 text-purple-700' : ''}
                    ${isSelected ? 'ring-4 ring-purple-300' : ''}
                  `}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
