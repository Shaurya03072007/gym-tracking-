import { UserProfile, WorkoutSessionRecord } from '../types';

const PROFILE_KEY = 'fitvision_user_profile';
const WORKOUTS_KEY = 'fitvision_workout_history';

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user_default_1',
  name: 'Alex Rivera',
  age: 27,
  sex: 'male',
  heightCm: 178,
  weightKg: 74.5,
  targetWeightKg: 78,
  fitnessLevel: 'Intermediate',
  primaryGoal: 'muscle_gain',
  trainingFrequencyDays: 4,
  availableEquipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Bench'],
  dietaryPreference: 'balanced',
  allergies: [],
  foodPreferences: ['Chicken', 'Paneer', 'Dal', 'Rice', 'Oats', 'Eggs'],
  activityLevel: 'moderately_active',
  sleepDurationHours: 7.5,
  workoutExperienceYears: 2.5,
  estimatedBmr: 1735,
  estimatedTdee: 2690,
  targetCalories: 2950,
  targetProteinGrams: 160,
  targetCarbsGrams: 350,
  targetFatGrams: 80
};

export const INITIAL_WORKOUT_HISTORY: WorkoutSessionRecord[] = [
  {
    id: 'w_1',
    date: '2026-09-19',
    exerciseId: 'squat',
    exerciseName: 'Bodyweight Squat',
    sets: [
      { setNumber: 1, reps: 12, averageFormScore: 88, durationSeconds: 38, tempoAvg: '2.5s / 1.0s' },
      { setNumber: 2, reps: 12, averageFormScore: 92, durationSeconds: 40, tempoAvg: '2.6s / 1.1s' },
      { setNumber: 3, reps: 10, averageFormScore: 84, durationSeconds: 36, tempoAvg: '2.2s / 1.2s' }
    ],
    totalReps: 34,
    totalDurationSeconds: 114,
    averageFormScore: 88,
    issuesEncountered: ['Slight knee cave on rep 8 of set 3']
  },
  {
    id: 'w_2',
    date: '2026-09-17',
    exerciseId: 'pushups',
    exerciseName: 'Standard Push-ups',
    sets: [
      { setNumber: 1, reps: 15, averageFormScore: 94, durationSeconds: 32, tempoAvg: '1.8s / 1.0s' },
      { setNumber: 2, reps: 15, averageFormScore: 90, durationSeconds: 34, tempoAvg: '2.0s / 1.0s' },
      { setNumber: 3, reps: 12, averageFormScore: 82, durationSeconds: 29, tempoAvg: '1.7s / 1.1s' }
    ],
    totalReps: 42,
    totalDurationSeconds: 95,
    averageFormScore: 89,
    issuesEncountered: ['Minor hip sag on last 2 reps']
  },
  {
    id: 'w_3',
    date: '2026-09-15',
    exerciseId: 'deadlift',
    exerciseName: 'Conventional Barbell Deadlift',
    sets: [
      { setNumber: 1, reps: 8, averageFormScore: 90, durationSeconds: 26, tempoAvg: '2.0s / 1.2s' },
      { setNumber: 2, reps: 8, averageFormScore: 86, durationSeconds: 28, tempoAvg: '2.1s / 1.4s' }
    ],
    totalReps: 16,
    totalDurationSeconds: 54,
    averageFormScore: 88,
    issuesEncountered: ['Torso forward lean flagged']
  }
];

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function loadWorkoutHistory(): WorkoutSessionRecord[] {
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return INITIAL_WORKOUT_HISTORY;
}

export function saveWorkoutSession(session: WorkoutSessionRecord): void {
  try {
    const history = loadWorkoutHistory();
    const updated = [session, ...history];
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save workout session', e);
  }
}

export function clearWorkoutHistory(): void {
  try {
    localStorage.removeItem(WORKOUTS_KEY);
  } catch (e) {}
}

export function clearAllUserData(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(WORKOUTS_KEY);
  } catch (e) {}
}
