import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { WorkoutCameraPage } from './pages/WorkoutCameraPage';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { ProgressPage } from './pages/ProgressPage';
import { NutritionPage } from './pages/NutritionPage';
import { AiCoachPage } from './pages/AiCoachPage';
import { BodyScanPage } from './pages/BodyScanPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { loadUserProfile, loadWorkoutHistory, saveUserProfile } from './services/storage';
import { UserProfile, WorkoutSessionRecord } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionRecord[]>(() => loadWorkoutHistory());
  const [activeExerciseId, setActiveExerciseId] = useState<string>('squat');

  const handleStartExercise = (exerciseId: string) => {
    setActiveExerciseId(exerciseId);
    setCurrentTab('workout');
  };

  const handleProfileUpdated = (updated: UserProfile) => {
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleDataReset = () => {
    setUserProfile(loadUserProfile());
    setWorkoutHistory(loadWorkoutHistory());
  };

  // Re-sync workout history when returning to progress or dashboard
  useEffect(() => {
    setWorkoutHistory(loadWorkoutHistory());
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-emerald-500 selection:text-neutral-950 flex flex-col">
      {/* Persistent Global Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardPage
            userProfile={userProfile}
            workoutHistory={workoutHistory}
            onStartExercise={handleStartExercise}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'workout' && (
          <WorkoutCameraPage
            userProfile={userProfile}
            preselectedExerciseId={activeExerciseId}
            onNavigateToExercises={() => setCurrentTab('exercises')}
          />
        )}

        {currentTab === 'exercises' && (
          <ExerciseLibraryPage
            onSelectExerciseToTrack={handleStartExercise}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressPage
            userProfile={userProfile}
            workoutHistory={workoutHistory}
          />
        )}

        {currentTab === 'nutrition' && (
          <NutritionPage
            userProfile={userProfile}
          />
        )}

        {currentTab === 'coach' && (
          <AiCoachPage
            userProfile={userProfile}
            workoutHistory={workoutHistory}
          />
        )}

        {currentTab === 'body_scan' && (
          <BodyScanPage
            userProfile={userProfile}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            userProfile={userProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage
            onDataReset={handleDataReset}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} FitVision AI — Biomechanical Vision & Performance Engineering</p>
          <div className="flex items-center space-x-4 text-[11px] font-mono text-neutral-400">
            <span>60 FPS Edge Vision</span>
            <span>•</span>
            <span>Local Browser Privacy</span>
            <span>•</span>
            <span>Gemini Reasoning</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
