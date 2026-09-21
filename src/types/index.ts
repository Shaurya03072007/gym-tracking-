/**
 * FitVision AI - Core TypeScript Types & Interfaces
 */

export type LandmarkKey =
  | 'nose'
  | 'left_eye_inner'
  | 'left_eye'
  | 'left_eye_outer'
  | 'right_eye_inner'
  | 'right_eye'
  | 'right_eye_outer'
  | 'left_ear'
  | 'right_ear'
  | 'mouth_left'
  | 'mouth_right'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_pinky'
  | 'right_pinky'
  | 'left_index'
  | 'right_index'
  | 'left_thumb'
  | 'right_thumb'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle'
  | 'left_heel'
  | 'right_heel'
  | 'left_foot_index'
  | 'right_foot_index';

export interface LandmarkPoint {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  z?: number; // Normalized depth
  visibility?: number; // 0-1 confidence
}

export type NormalizedLandmarks = LandmarkPoint[];

export interface PoseDetectionResult {
  landmarks: NormalizedLandmarks;
  confidence: number;
  detected: boolean;
  timestamp: number;
}

export interface JointAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftElbow: number;
  rightElbow: number;
  leftShoulder: number;
  rightShoulder: number;
  torsoAngle: number; // Inclination from vertical (degrees)
  neckAngle: number;
  symmetryScore: number; // 0 to 100
}

export type ExerciseCategory =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Cardio/Full Body';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type EquipmentRequired =
  | 'Bodyweight'
  | 'Dumbbells'
  | 'Barbell'
  | 'Pull-up Bar'
  | 'Bench'
  | 'Cable Machine'
  | 'Kettlebell'
  | 'Bands';

export type CameraAngle = 'Front' | 'Side (45°)' | 'Side (90°)' | 'Any';

export type RepPhase =
  | 'IDLE'
  | 'PREPARING'
  | 'START_POSITION'
  | 'ECCENTRIC'
  | 'PEAK_CONTRACTION'
  | 'CONCENTRIC'
  | 'COMPLETED_REP'
  | 'HOLDING'; // For isometric exercises (planks)

export type FormQuality = 'GOOD FORM' | 'WARNING' | 'POOR FORM';

export type CoachingSeverity = 'INFO' | 'CORRECTION' | 'WARNING';

export interface FormIssue {
  severity: CoachingSeverity;
  joint: string;
  issue: string;
  message: string;
  scoreDeduction: number;
}

export interface FormScoreBreakdown {
  totalScore: number; // 0 - 100
  quality: FormQuality;
  jointAlignment: number; // max 25
  rangeOfMotion: number; // max 25
  movementControl: number; // max 20
  symmetry: number; // max 15
  tempo: number; // max 15
  positiveFeedback: string[];
  issues: FormIssue[];
  alignmentScore?: number;
  romScore?: number;
  controlScore?: number;
  symmetryScore?: number;
  tempoScore?: number;
}

export interface BiomechanicalRule {
  ruleName: string;
  issueDescription: string;
  correctiveFeedback: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetMuscles: string[];
  primaryMuscles?: string[];
  secondaryMuscles: string[];
  equipment: EquipmentRequired;
  difficulty: DifficultyLevel;
  cameraAngle: CameraAngle;
  description: string;
  instructions: string[];
  checklist: string[];
  commonMistakes: string[];
  safetyWarnings: string[];
  isIsometric?: boolean;
  targetDurationSeconds?: number;
  primaryJointAngle: string;
  biomechanicalRules?: BiomechanicalRule[];
  
  // Angle thresholds for state machine
  startAngle: number;
  peakAngle: number;
  toleranceAngle?: number;
  
  coachingRules: {
    minRangeOfMotion: number;
    recommendedEccentricSec: number;
    recommendedConcentricSec: number;
    maxTorsoLeanAngle?: number;
    maxKneeCaveRatio?: number;
    hipAlignmentRequired?: boolean;
  };
}

export interface LiveWorkoutMetrics {
  currentRep: number;
  currentSet: number;
  repsCompletedInSet: number;
  currentPhase: RepPhase;
  phaseProgress: number; // 0-100%
  repDurationSeconds: number;
  tempo: {
    eccentric: number;
    pause: number;
    concentric: number;
  };
  rangeOfMotionPercent: number;
  currentJointAngles: JointAngles;
  formScore: FormScoreBreakdown;
  activeSeconds: number;
  restSeconds: number;
  isResting: boolean;
}

export interface CoachingMessage {
  id: string;
  timestamp: number;
  severity: CoachingSeverity;
  text: string;
  exercise: string;
  repNumber?: number;
}

export interface SetRecord {
  setNumber: number;
  reps: number;
  averageFormScore: number;
  durationSeconds: number;
  notes?: string;
  tempoAvg: string;
}

export interface WorkoutSessionRecord {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  sets: SetRecord[];
  totalReps: number;
  totalVolumeKg?: number;
  totalDurationSeconds: number;
  averageFormScore: number;
  issuesEncountered: string[];
}

// User Profile & Onboarding
export type Sex = 'male' | 'female' | 'other';
export type FitnessGoal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'general_fitness'
  | 'mobility'
  | 'athletic_performance';

export type DietType =
  | 'balanced'
  | 'vegetarian'
  | 'non_vegetarian'
  | 'vegan'
  | 'eggetarian'
  | 'keto'
  | 'high_protein';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  fitnessLevel: DifficultyLevel;
  primaryGoal: FitnessGoal;
  trainingFrequencyDays: number;
  availableEquipment: EquipmentRequired[];
  dietaryPreference: DietType;
  allergies: string[];
  foodPreferences: string[];
  activityLevel: ActivityLevel;
  sleepDurationHours: number;
  workoutExperienceYears: number;
  estimatedBmr?: number;
  estimatedTdee?: number;
  targetCalories?: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
  bodyPhotos?: {
    front?: string;
    side?: string;
    back?: string;
    analyzedAt?: string;
    observations?: string[];
  };
}

// Food and Nutrition
export interface FoodItem {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  cuisine: 'Indian' | 'International' | 'Universal';
  category:
    | 'Grains & Breads'
    | 'Lentils & Dals'
    | 'Dairy & Paneer'
    | 'Meat & Poultry'
    | 'Eggs & Seafood'
    | 'Vegetables'
    | 'Fruits'
    | 'Nuts & Seeds'
    | 'Traditional Snacks'
    | 'Supplements';
  isVegetarian: boolean;
  isVegan: boolean;
  isEggetarian: boolean;
  allergens: string[];
}

export interface Meal {
  name: string;
  time: string;
  items: Array<{
    food: FoodItem;
    servings: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface MealPlanDay {
  dayName: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: Meal[];
}

// AI Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    formScore?: number;
    exercise?: string;
    recommendations?: string[];
  };
}
