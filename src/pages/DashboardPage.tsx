import React from 'react';
import {
  Activity,
  Flame,
  Camera,
  Dumbbell,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  ChevronRight,
  Zap
} from 'lucide-react';
import { UserProfile, WorkoutSessionRecord } from '../types';

interface DashboardPageProps {
  userProfile: UserProfile;
  workoutHistory: WorkoutSessionRecord[];
  onStartExercise: (exerciseId: string) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  userProfile,
  workoutHistory,
  onStartExercise,
  onNavigate
}) => {
  // Aggregate stats
  const totalWorkouts = workoutHistory.length;
  const totalReps = workoutHistory.reduce((acc, w) => acc + w.totalReps, 0);
  const avgFormScore =
    totalWorkouts > 0
      ? Math.round(workoutHistory.reduce((acc, w) => acc + w.averageFormScore, 0) / totalWorkouts)
      : 0;

  // Dynamic streak calculation
  const streak = React.useMemo(() => {
    if (!workoutHistory.length) return 0;
    const uniqueDates = Array.from(new Set(workoutHistory.map((w) => w.date))).sort().reverse();
    if (!uniqueDates.length) return 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      let count = 1;
      let curr = new Date(uniqueDates[0]);
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          count++;
          curr = prev;
        } else {
          break;
        }
      }
      return count;
    }
    return 0;
  }, [workoutHistory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 space-y-6 sm:space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-5 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Biomechanics Vision Ready</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome{userProfile.name ? `, ${userProfile.name}` : ''}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Your real-time camera tracking and biometric feedback are calibrated for{' '}
              <strong className="text-neutral-200 uppercase">{userProfile.primaryGoal.replace('_', ' ')}</strong>.
              Ready to crush today’s session?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="dashboard-start-squat-btn"
              onClick={() => onStartExercise('squat')}
              className="flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 min-h-[44px]"
            >
              <Camera className="h-4 w-4 stroke-[2.5]" />
              <span>Launch Live Workout</span>
            </button>
            <button
              onClick={() => onNavigate('nutrition')}
              className="flex items-center justify-center space-x-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors min-h-[44px]"
            >
              <Utensils className="h-4 w-4 text-cyan-400" />
              <span>Today’s Meal Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Form Score */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span className="truncate">Form Score</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {totalWorkouts > 0 ? avgFormScore : '--'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ 100</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-300 truncate">
            {totalWorkouts > 0 ? `${totalWorkouts} verified sessions` : 'Awaiting 1st session'}
          </p>
        </div>

        {/* Total Reps */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span className="truncate">Total Reps</span>
            <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalReps}</span>
            <span className="text-xs text-neutral-500 font-mono">reps</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
            {totalWorkouts} recorded session{totalWorkouts === 1 ? '' : 's'}
          </p>
        </div>

        {/* Calorie Goal */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span className="truncate">Target Calories</span>
            <Flame className="h-4 w-4 text-amber-400 shrink-0" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {userProfile.targetCalories || 2850}
            </span>
            <span className="text-xs text-neutral-500 font-mono">kcal</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
            {userProfile.targetProteinGrams || 155}g protein target
          </p>
        </div>

        {/* Weekly Consistency */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span className="truncate">Active Streak</span>
            <Award className="h-4 w-4 text-purple-400 shrink-0" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{streak}</span>
            <span className="text-xs text-neutral-500 font-mono">days active</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-400 font-medium truncate">
            Goal: {userProfile.trainingFrequencyDays || 4} days/week
          </p>
        </div>
      </div>

      {/* Two Column Layout: Today's AI Workout & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 cols: Today's Workout Routine */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-emerald-400" />
                <span>Today’s Recommended AI Session</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Push Hypertrophy & Power Calibration • 45 min
              </p>
            </div>
            <button
              onClick={() => onNavigate('exercises')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Explore 31+ Exercises</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { id: 'squat', name: 'Barbell / Bodyweight Squat', target: 'Quads & Glutes', sets: '3 sets × 12 reps', rom: 'Hip crease below knees', tag: 'High Priority' },
              { id: 'pushups', name: 'Standard Push-ups', target: 'Chest & Core', sets: '3 sets × 15 reps', rom: 'Elbows 90° flexion', tag: 'Form Calibrated' },
              { id: 'shoulder_press', name: 'Overhead Shoulder Press', target: 'Deltoids & Traps', sets: '3 sets × 10 reps', rom: 'Full vertical lockout', tag: 'Hypertrophy' },
              { id: 'plank', name: 'Core Stability Plank', target: 'Transverse Abdominis', sets: '3 sets × 45 sec', rom: 'Flat horizontal spine', tag: 'Core Lock' }
            ].map((item) => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 hover:border-neutral-700 transition-all gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </h3>
                    <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {item.target} • <strong className="text-neutral-300">{item.sets}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-400/80 font-mono">
                    ROM standard: {item.rom}
                  </p>
                </div>

                <button
                  onClick={() => onStartExercise(item.id)}
                  className="flex items-center justify-center space-x-1.5 rounded-lg bg-neutral-800 px-3.5 py-2 text-xs font-bold text-neutral-200 hover:bg-emerald-500 hover:text-neutral-950 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Track Reps</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: Biomechanical Insights & Recent History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              <span>Biomechanical History</span>
            </h2>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Full Analytics
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            {workoutHistory.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">No Sessions Logged Yet</p>
                  <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                    Start a workout with your camera to begin generating 60 FPS form scores and joint angle logs.
                  </p>
                </div>
                <button
                  onClick={() => onStartExercise('squat')}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors min-h-[40px]"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Start Live Squat Tracking</span>
                </button>
              </div>
            ) : (
              workoutHistory.slice(0, 3).map((w) => (
                <div key={w.id} className="border-b border-neutral-800/80 pb-3 last:border-b-0 last:pb-0 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{w.exerciseName}</span>
                    <span className="font-mono text-[11px] text-neutral-400">{w.date}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-neutral-400">
                    <span>{w.totalReps} total reps</span>
                    <span>•</span>
                    <span>{w.sets.length} sets</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {w.averageFormScore}/100 form
                    </span>
                  </div>
                  {w.issuesEncountered && w.issuesEncountered.length > 0 && (
                    <p className="text-[11px] text-amber-300/80 font-mono">
                      Flagged: {w.issuesEncountered[0]}
                    </p>
                  )}
                </div>
              ))
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold uppercase font-mono text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Coach Recommendation</span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                {workoutHistory.length === 0
                  ? 'Set your phone or laptop camera roughly 6–8 feet away. The 60 FPS vision engine will track your joint angles and count reps hands-free!'
                  : 'Maintain a 2-second controlled eccentric tempo on your lowering phase to maximize motor unit recruitment.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
