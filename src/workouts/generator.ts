import { EXERCISE_LIBRARY } from '../exercise-engine/exercises';
import { DifficultyLevel, EquipmentRequired, ExerciseDefinition, FitnessGoal, UserProfile } from '../types';

export interface GeneratedWorkoutExercise {
  exercise: ExerciseDefinition;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo: string; // e.g. "3-1-1-0" (3s eccentric, 1s pause, 1s concentric, 0s top)
  formFocus: string;
  targetRpe: number;
}

export interface GeneratedWorkoutDay {
  dayName: string;
  title: string;
  focusMuscles: string[];
  estimatedMinutes: number;
  exercises: GeneratedWorkoutExercise[];
}

export interface GeneratedWeeklySplit {
  routineName: string;
  goal: FitnessGoal;
  difficulty: DifficultyLevel;
  daysPerWeek: number;
  days: GeneratedWorkoutDay[];
  monthlyProgressionNotes: string[];
}

export function generateWorkoutPlan(profile: UserProfile): GeneratedWeeklySplit {
  const goal = profile.primaryGoal || 'muscle_gain';
  const difficulty = profile.fitnessLevel || 'Intermediate';
  const days = profile.trainingFrequencyDays || 4;
  const userEquipment = profile.availableEquipment || ['Bodyweight', 'Dumbbells'];

  // Helper to filter matching exercises by equipment
  const getExercise = (id: string, fallbackCategory: string): ExerciseDefinition => {
    let found = EXERCISE_LIBRARY.find((e) => e.id === id);
    if (!found || !userEquipment.includes(found.equipment)) {
      found = EXERCISE_LIBRARY.find((e) => e.category === fallbackCategory && userEquipment.includes(e.equipment));
    }
    return found || EXERCISE_LIBRARY.find((e) => e.id === 'squat')!;
  };

  const getReps = (isCompound: boolean): { sets: number; reps: string; restSeconds: number; rest: number; tempo: string } => {
    if (goal === 'strength') {
      return isCompound
        ? { sets: 4, reps: '4 - 6', restSeconds: 150, rest: 150, tempo: '3-1-X-0' }
        : { sets: 3, reps: '6 - 8', restSeconds: 90, rest: 90, tempo: '2-1-1-0' };
    } else if (goal === 'fat_loss') {
      return isCompound
        ? { sets: 3, reps: '10 - 12', restSeconds: 60, rest: 60, tempo: '2-0-1-0' }
        : { sets: 3, reps: '12 - 15', restSeconds: 45, rest: 45, tempo: '2-0-1-0' };
    } else {
      // Muscle gain / hypertrophy
      return isCompound
        ? { sets: 4, reps: '8 - 10', restSeconds: 90, rest: 90, tempo: '3-1-1-0' }
        : { sets: 3, reps: '10 - 12', restSeconds: 60, rest: 60, tempo: '2-1-1-0' };
    }
  };

  const splitDays: GeneratedWorkoutDay[] = [];

  // Day 1: Push (Chest, Shoulders, Triceps)
  const pushExercises: GeneratedWorkoutExercise[] = [
    {
      exercise: getExercise('bench_press', 'Chest'),
      ...getReps(true),
      formFocus: 'Control eccentric descent to sternum; drive feet into floor',
      targetRpe: 8
    },
    {
      exercise: getExercise('pushups', 'Chest'),
      ...getReps(false),
      formFocus: 'Keep glutes locked, zero hip sag, elbows tucked 45 degrees',
      targetRpe: 8.5
    },
    {
      exercise: getExercise('shoulder_press', 'Shoulders'),
      ...getReps(true),
      formFocus: 'Full vertical lockout overhead without lumbar hyperextension',
      targetRpe: 8
    },
    {
      exercise: getExercise('lateral_raises', 'Shoulders'),
      ...getReps(false),
      formFocus: 'Raise elbows to shoulder plane without shrugging traps',
      targetRpe: 9
    },
    {
      exercise: getExercise('diamond_pushups', 'Arms'),
      ...getReps(false),
      formFocus: 'Strict tricep lockout at top of movement',
      targetRpe: 9
    }
  ];

  splitDays.push({
    dayName: 'Day 1 — Monday',
    title: 'Push Hypertrophy & Power',
    focusMuscles: ['Chest', 'Shoulders', 'Triceps'],
    estimatedMinutes: 50,
    exercises: pushExercises
  });

  // Day 2: Pull (Back, Biceps, Rear Delts)
  const pullExercises: GeneratedWorkoutExercise[] = [
    {
      exercise: getExercise('deadlift', 'Back'),
      ...getReps(true),
      formFocus: 'Pack lats, drag bar tight against shins, neutral spine throughout',
      targetRpe: 8
    },
    {
      exercise: getExercise('pullups', 'Back'),
      ...getReps(true),
      formFocus: 'Clear chin over bar from dead hang with zero leg kipping',
      targetRpe: 8.5
    },
    {
      exercise: getExercise('barbell_row', 'Back'),
      ...getReps(false),
      formFocus: 'Pull elbows back past ribs without standing up with torso',
      targetRpe: 8
    },
    {
      exercise: getExercise('bicep_curls', 'Arms'),
      ...getReps(false),
      formFocus: 'Pin elbows to sides with zero torso swing momentum',
      targetRpe: 8.5
    },
    {
      exercise: getExercise('hammer_curls', 'Arms'),
      ...getReps(false),
      formFocus: 'Squeeze brachialis at peak, 2-second negative stretch',
      targetRpe: 9
    }
  ];

  splitDays.push({
    dayName: 'Day 2 — Tuesday',
    title: 'Pull Strength & Back Thickness',
    focusMuscles: ['Lats', 'Upper Back', 'Biceps'],
    estimatedMinutes: 50,
    exercises: pullExercises
  });

  // Day 3: Legs & Core
  const legExercises: GeneratedWorkoutExercise[] = [
    {
      exercise: getExercise('squat', 'Legs'),
      ...getReps(true),
      formFocus: 'Hip crease below knees, knees tracking over toes, tall chest',
      targetRpe: 8
    },
    {
      exercise: getExercise('romanian_deadlift', 'Legs'),
      ...getReps(true),
      formFocus: 'Push hips backward with flat back to maximize hamstring stretch',
      targetRpe: 8
    },
    {
      exercise: getExercise('lunges', 'Legs'),
      ...getReps(false),
      formFocus: '90-degree front knee angle, smooth deceleration to floor',
      targetRpe: 8.5
    },
    {
      exercise: getExercise('calf_raises', 'Legs'),
      ...getReps(false),
      formFocus: '1-second pause on tiptoes, full ankle plantarflexion',
      targetRpe: 9
    },
    {
      exercise: getExercise('plank', 'Core'),
      sets: 3,
      reps: '45 sec hold',
      restSeconds: 60,
      tempo: 'Static Hold',
      formFocus: 'Posterior pelvic tilt, glutes clenched, level horizontal spine',
      targetRpe: 8.5
    }
  ];

  splitDays.push({
    dayName: 'Day 3 — Thursday',
    title: 'Legs & Core Fortification',
    focusMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Abs'],
    estimatedMinutes: 55,
    exercises: legExercises
  });

  // Day 4: Upper Body / Athletic Conditioning
  if (days >= 4) {
    const day4Exercises: GeneratedWorkoutExercise[] = [
      {
        exercise: getExercise('wide_pushups', 'Chest'),
        ...getReps(false),
        formFocus: 'Feel outer pectoral stretch at bottom, strict plank',
        targetRpe: 8
      },
      {
        exercise: getExercise('dumbbell_row', 'Back'),
        ...getReps(false),
        formFocus: 'Row dumbbell towards hip crease with zero spinal rotation',
        targetRpe: 8.5
      },
      {
        exercise: getExercise('lateral_raises', 'Shoulders'),
        ...getReps(false),
        formFocus: 'Constant tension without letting dumbbells collide at bottom',
        targetRpe: 9
      },
      {
        exercise: getExercise('mountain_climbers', 'Cardio/Full Body'),
        sets: 3,
        reps: '30 sec sprint',
        restSeconds: 45,
        tempo: 'High Velocity',
        formFocus: 'Fast alternating knee drives while keeping hips level',
        targetRpe: 8.5
      },
      {
        exercise: getExercise('leg_raises', 'Core'),
        sets: 3,
        reps: '12 - 15 reps',
        restSeconds: 45,
        tempo: '3-0-1-0',
        formFocus: 'Keep lumbar spine glued to mat; do not allow lower back arch',
        targetRpe: 9
      }
    ];

    splitDays.push({
      dayName: 'Day 4 — Saturday',
      title: 'Upper Hypertrophy & Core Conditioning',
      focusMuscles: ['Chest', 'Lats', 'Deltoids', 'Abs'],
      estimatedMinutes: 45,
      exercises: day4Exercises
    });
  }

  return {
    routineName: `${profile.name ? profile.name + "'s " : ''}Personalized ${goal.replace('_', ' ').toUpperCase()} Periodization`,
    goal,
    difficulty,
    daysPerWeek: days,
    days: splitDays,
    monthlyProgressionNotes: [
      'Week 1: Baseline Form Calibration — Focus on strict 85+ form score on all tracked exercises.',
      'Week 2: Volume Accretion — Add 1 rep per set or increase dumbbell load by 5% if form score exceeds 85.',
      'Week 3: Peak Intensity Overload — Aim for target RPE 8.5–9 with rigorous eccentric tempo control.',
      'Week 4: Deload & Form Perfection — Reduce total volume by 30%, perform video AI audits to refine joint angles and mobility.'
    ]
  };
}
