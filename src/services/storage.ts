import { UserProfile, WorkoutSessionRecord } from '../types';

const PROFILE_KEY = 'fitvision_user_profile';
const WORKOUTS_KEY = 'fitvision_workout_history';

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user_default_1',
  name: '',
  age: 25,
  sex: 'male',
  heightCm: 175,
  weightKg: 70,
  targetWeightKg: 75,
  fitnessLevel: 'Intermediate',
  primaryGoal: 'muscle_gain',
  trainingFrequencyDays: 4,
  availableEquipment: ['Bodyweight', 'Dumbbells', 'Barbell', 'Bench'],
  dietaryPreference: 'balanced',
  allergies: [],
  foodPreferences: ['Chicken', 'Paneer', 'Dal', 'Rice', 'Oats', 'Eggs'],
  activityLevel: 'moderately_active',
  sleepDurationHours: 8,
  workoutExperienceYears: 1,
  estimatedBmr: 1680,
  estimatedTdee: 2600,
  targetCalories: 2850,
  targetProteinGrams: 155,
  targetCarbsGrams: 340,
  targetFatGrams: 75
};

export const INITIAL_WORKOUT_HISTORY: WorkoutSessionRecord[] = [];

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
    if (raw) {
      const parsed = JSON.parse(raw);
      // Filter out any legacy mock workout records (id 'w_1', 'w_2', 'w_3')
      const filtered = Array.isArray(parsed)
        ? parsed.filter((item: any) => !['w_1', 'w_2', 'w_3'].includes(item.id))
        : [];
      return filtered;
    }
  } catch (e) {
    // fallback
  }
  return [];
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
