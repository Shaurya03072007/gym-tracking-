import { ExerciseDefinition } from '../types';

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // 1. Squat
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Calves'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (45°)',
    description: 'Fundamental lower body compound movement building quad and hip extension strength.',
    instructions: [
      'Stand with feet shoulder-width apart, toes pointed slightly outward.',
      'Brace your core and initiate the movement by hinging hips back and bending knees.',
      'Descend until thighs are parallel or below parallel with the floor (hip crease below knee).',
      'Keep chest elevated and knees tracking outward in line with your toes.',
      'Drive through your mid-foot to return to full upright lockout.'
    ],
    checklist: [
      'Knees track over second toe without collapsing inward (valgus)',
      'Hips sink below knee level for full range of motion',
      'Torso remains upright without excessive forward lean',
      'Heels stay firmly planted on the ground'
    ],
    commonMistakes: [
      'Knees caving inward during ascent',
      'Cutting depth short before 90 degrees',
      'Rising onto toes or lifting heels',
      'Chest collapsing forward causing excessive spinal stress'
    ],
    safetyWarnings: [
      'If you experience sharp knee or lower-back pinching, stop immediately.',
      'Do not allow knees to collapse inward under load.'
    ],
    primaryJointAngle: 'Knee Angle',
    startAngle: 170,
    peakAngle: 85,
    toleranceAngle: 15,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.2,
      maxTorsoLeanAngle: 35,
      maxKneeCaveRatio: 0.1,
      hipAlignmentRequired: true
    }
  },

  // 2. Front Squat
  {
    id: 'front_squat',
    name: 'Front Squat',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Core'],
    secondaryMuscles: ['Upper Back', 'Glutes'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (45°)',
    description: 'Squat variation with anterior loading requiring vertical torso and high quad activation.',
    instructions: [
      'Rack weight across anterior deltoids with elbows driven high.',
      'Keep torso near vertical as you sit down between your hips.',
      'Descend to deep parallel position with elbows staying up.',
      'Ascend smoothly maintaining upright posture.'
    ],
    checklist: ['Elbows remain horizontal', 'Torso angle under 20 degrees lean', 'Full depth reached'],
    commonMistakes: ['Elbows dropping', 'Torso pitching forward', 'Heels lifting'],
    safetyWarnings: ['Keep thoracic spine extended; do not round forward.'],
    primaryJointAngle: 'Knee Angle',
    startAngle: 170,
    peakAngle: 80,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.5,
      maxTorsoLeanAngle: 22
    }
  },

  // 3. Back Squat
  {
    id: 'back_squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Erector Spinae', 'Core'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (45°)',
    description: 'The king of leg exercises for maximum posterior chain and quad recruitment.',
    instructions: [
      'Barbell positioned across upper traps or rear delts with tight upper back shelf.',
      'Hinge hips and bend knees simultaneously.',
      'Reach crease of hip below top of knee.',
      'Drive hips up and forward out of the hole.'
    ],
    checklist: ['Neutral spine throughout', 'Bar travels in vertical path over midfoot', 'Controlled tempo'],
    commonMistakes: ['Good-morning squat (hips shooting up first)', 'Knee cave', 'Butt wink'],
    safetyWarnings: ['Never hyperextend or heavily flex the lumbar spine during heavy loads.'],
    primaryJointAngle: 'Knee Angle',
    startAngle: 170,
    peakAngle: 85,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.5,
      maxTorsoLeanAngle: 38
    }
  },

  // 4. Lunges
  {
    id: 'lunges',
    name: 'Walking / Forward Lunges',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Unilateral leg strength builder developing pelvic stability and balance.',
    instructions: [
      'Step forward smoothly with one leg.',
      'Lower hips until both front and rear knees form approximately 90-degree angles.',
      'Front knee stays stacked over ankle; rear knee gently hovers an inch above ground.',
      'Push firmly through front heel to step back to starting standing position.'
    ],
    checklist: ['Front shin roughly vertical', 'Hips square and level', 'Torso perpendicular to floor'],
    commonMistakes: ['Front knee drifting excessively past toes', 'Torso swaying laterally', 'Slamming rear knee into floor'],
    safetyWarnings: ['Maintain knee alignment with foot; avoid inward twisting.'],
    primaryJointAngle: 'Front Knee Angle',
    startAngle: 170,
    peakAngle: 90,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.2
    }
  },

  // 5. Reverse Lunges
  {
    id: 'reverse_lunges',
    name: 'Reverse Lunges',
    category: 'Legs',
    targetMuscles: ['Glutes', 'Hamstrings', 'Quadriceps'],
    secondaryMuscles: ['Core', 'Adductors'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Knee-friendly unilateral lower body movement emphasizing glute activation.',
    instructions: [
      'Stand tall, take a controlled step backward with one leg.',
      'Lower into lunge until back knee is just above the floor.',
      'Drive through front heel to return to tall standing.'
    ],
    checklist: ['Weight centered on front foot', 'Controlled step back', 'Hips level'],
    commonMistakes: ['Over-striding backward', 'Leaning back', 'Loss of balance'],
    safetyWarnings: ['Keep front foot flat; avoid rolling to the inner arch.'],
    primaryJointAngle: 'Front Knee Angle',
    startAngle: 170,
    peakAngle: 90,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 6. Bulgarian Split Squat
  {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian Split Squat',
    category: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Hip Flexors'],
    equipment: 'Bench',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (90°)',
    description: 'Elevated single-leg squat for supreme unilateral hypertrophy and knee stability.',
    instructions: [
      'Place top of rear foot on a bench behind you.',
      'Descend until rear knee approaches floor and front thigh is parallel.',
      'Drive through front foot to stand.'
    ],
    checklist: ['Front knee tracks straight', 'Slight natural forward torso lean', 'Deep hip flexion'],
    commonMistakes: ['Standing too close to bench', 'Front heel lifting', 'Extreme lumbar arching'],
    safetyWarnings: ['Keep torso engaged to prevent hip flexor strain.'],
    primaryJointAngle: 'Front Knee Angle',
    startAngle: 165,
    peakAngle: 85,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.5
    }
  },

  // 7. Push-ups
  {
    id: 'pushups',
    name: 'Standard Push-ups',
    category: 'Chest',
    targetMuscles: ['Pectoralis Major', 'Triceps Brachii'],
    secondaryMuscles: ['Anterior Deltoids', 'Core', 'Serratus Anterior'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (45°)',
    description: 'Classic upper-body horizontal push testing pressing strength and plank stability.',
    instructions: [
      'Place hands slightly wider than shoulder-width, fingers pointing forward or slightly outward.',
      'Set body in rigid high plank: glutes squeezed, core braced, neutral neck.',
      'Lower chest towards floor by tucking elbows at 45-degree angle to torso.',
      'Touch chest or come within an inch of the floor.',
      'Push the floor away powerfully until arms reach full extension with scapulae protracted.'
    ],
    checklist: [
      'Rigid straight line from ears, shoulders, hips to ankles',
      'Elbows tucked 45° (no T-flare at 90°)',
      'Full depth with chest reaching floor',
      'Zero hip sagging or piking'
    ],
    commonMistakes: [
      'Sagging hips (lumbar hyperextension)',
      'Piking hips into a teepee shape',
      'Flaring elbows 90 degrees stressing shoulders',
      'Head drooping forward to fake depth'
    ],
    safetyWarnings: [
      'Do not allow lower back to sag downward; squeeze glutes and abs to protect lumbar spine.',
      'Avoid elbow flaring above shoulder height.'
    ],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 80,
    toleranceAngle: 15,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0,
      hipAlignmentRequired: true
    }
  },

  // 8. Diamond Push-ups
  {
    id: 'diamond_pushups',
    name: 'Diamond Push-ups',
    category: 'Arms',
    targetMuscles: ['Triceps Brachii', 'Inner Chest'],
    secondaryMuscles: ['Anterior Deltoids', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (45°)',
    description: 'Close-grip push-up emphasizing tricep extension and sternal pectoral fibers.',
    instructions: [
      'Form a diamond/triangle shape with index fingers and thumbs directly beneath sternum.',
      'Lower chest toward your hands with elbows tracking closely beside ribs.',
      'Press up locking out triceps.'
    ],
    checklist: ['Hands centered under chest', 'Elbows track close to ribs', 'Straight body line'],
    commonMistakes: ['Wrist hyperextension pain', 'Elbow flaring', 'Incomplete lockout'],
    safetyWarnings: ['If wrists feel pinched, widen hands slightly to neutral close grip.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 85,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.2
    }
  },

  // 9. Wide Push-ups
  {
    id: 'wide_pushups',
    name: 'Wide-Grip Push-ups',
    category: 'Chest',
    targetMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Front',
    description: 'Wide hand placement isolating outer pectoral stretch and horizontal adduction.',
    instructions: [
      'Place hands 1.5x shoulder width apart.',
      'Lower torso smoothly feeling stretch across the chest.',
      'Press through the palms to full arm extension.'
    ],
    checklist: ['Wrists aligned under forearms at bottom', 'Core braced', 'Full chest descent'],
    commonMistakes: ['Shrugging shoulders into ears', 'Dropping head', 'Hip sag'],
    safetyWarnings: ['Do not over-flare shoulders if you have rotator cuff history.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 160,
    peakAngle: 90,
    coachingRules: {
      minRangeOfMotion: 70,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 10. Bench Press
  {
    id: 'bench_press',
    name: 'Barbell / Dumbbell Bench Press',
    category: 'Chest',
    targetMuscles: ['Pectoralis Major', 'Triceps'],
    secondaryMuscles: ['Anterior Deltoid'],
    equipment: 'Bench',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (45°)',
    description: 'Foundational horizontal press for upper body power and pectoral mass.',
    instructions: [
      'Lie with eyes under bar, retract and depress scapulae into bench, plant feet firmly.',
      'Unrack and lower bar with controlled descent to lower sternum.',
      'Press back and up in slight arc to full arm extension over shoulders.'
    ],
    checklist: ['Wrists stacked over elbows', 'Arch maintained with feet driven into floor', 'Controlled touch'],
    commonMistakes: ['Bouncing bar off ribs', 'Elbows flared 90 degrees', 'Hips lifting off bench'],
    safetyWarnings: ['Always ensure secure grip with thumbs wrapped around bar.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 170,
    peakAngle: 75,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.2
    }
  },

  // 11. Shoulder Press
  {
    id: 'shoulder_press',
    name: 'Overhead Shoulder Press',
    category: 'Shoulders',
    targetMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Traps', 'Core'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    cameraAngle: 'Front',
    description: 'Vertical pressing compound movement for boulder shoulders and overhead strength.',
    instructions: [
      'Stand or sit tall with weights at shoulder height, elbows slightly in front of body.',
      'Brace core and press weights overhead in smooth arc until arms are locked out.',
      'Avoid hyperextending lower back.',
      'Lower under control back to ear/shoulder level.'
    ],
    checklist: ['Full overhead lockout directly above ears', 'Ribcage pulled down', 'Wrists stacked'],
    commonMistakes: ['Leaning backward excessively', 'Partial reps not locking overhead', 'Flaring elbows excessively'],
    safetyWarnings: ['Avoid excessive lumbar extension; maintain tight glutes and abs.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 80,
    peakAngle: 170,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.2
    }
  },

  // 12. Bicep Curls
  {
    id: 'bicep_curls',
    name: 'Dumbbell Bicep Curls',
    category: 'Arms',
    targetMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    cameraAngle: 'Front',
    description: 'Arm isolation exercise isolating elbow flexion with minimal torso momentum.',
    instructions: [
      'Stand tall holding dumbbells at sides with palms facing forward or neutral.',
      'Keep elbows pinned directly under shoulders against your ribcage.',
      'Flex elbows to curl weights upward until biceps are fully contracted.',
      'Squeeze hard at top without letting elbows drift forward.',
      'Lower slowly over 2-3 seconds to full extension.'
    ],
    checklist: [
      'Elbows remain static at your sides without swinging',
      'Torso stays upright with zero backward rocking',
      'Full extension achieved at the bottom of every rep',
      'Smooth controlled tempo'
    ],
    commonMistakes: [
      'Swinging torso to generate momentum (cheat curl)',
      'Elbows drifting forward turning it into a front raise',
      'Stopping short of full extension at the bottom'
    ],
    safetyWarnings: ['Do not hyperextend spine or swing torso to avoid lower back strain.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 45,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.2
    }
  },

  // 13. Hammer Curls
  {
    id: 'hammer_curls',
    name: 'Dumbbell Hammer Curls',
    category: 'Arms',
    targetMuscles: ['Brachialis', 'Brachioradialis'],
    secondaryMuscles: ['Biceps Brachii', 'Forearms'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    cameraAngle: 'Front',
    description: 'Neutral grip curl targeting arm thickness and grip strength.',
    instructions: [
      'Hold dumbbells with palms facing each other (neutral grip).',
      'Pin elbows and curl weights up towards chest.',
      'Pause and squeeze brachialis, then lower with control.'
    ],
    checklist: ['Neutral wrist orientation maintained throughout', 'Elbows pinned', 'No swinging'],
    commonMistakes: ['Rotating wrists outward', 'Using shoulder momentum', 'Dropping weights fast'],
    safetyWarnings: ['Maintain neutral wrists to prevent tendonitis.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 50,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.2
    }
  },

  // 14. Tricep Extensions
  {
    id: 'tricep_extensions',
    name: 'Overhead Tricep Extensions',
    category: 'Arms',
    targetMuscles: ['Triceps Brachii (Long Head)'],
    secondaryMuscles: ['Core'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (90°)',
    description: 'Overhead isolation movement placing maximum stretch on long head of triceps.',
    instructions: [
      'Hold weight overhead with arms extended vertically.',
      'Hinge at elbows to lower weight behind head while keeping upper arms vertical.',
      'Extend elbows back to lockout overhead.'
    ],
    checklist: ['Upper arms stay perpendicular to floor', 'Full stretch at bottom', 'Core braced'],
    commonMistakes: ['Elbows flaring wide', 'Arching lower back', 'Partial extension'],
    safetyWarnings: ['Do not drop weight behind neck uncontrolled.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 65,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.2
    }
  },

  // 15. Tricep Pushdowns
  {
    id: 'tricep_pushdowns',
    name: 'Cable / Band Tricep Pushdowns',
    category: 'Arms',
    targetMuscles: ['Triceps Brachii (Lateral & Medial Heads)'],
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Constant tension isolation exercise targeting the lateral horseshoe of triceps.',
    instructions: [
      'Grip bar or rope with elbows bent at 90 degrees tucked by sides.',
      'Extend arms downward until elbows are fully locked.',
      'Squeeze triceps hard, return under control to 90 degrees.'
    ],
    checklist: ['Elbows remain anchored to sides', 'Full lockout at bottom', 'Upright posture'],
    commonMistakes: ['Letting elbows rise up on return', 'Leaning over the weight', 'Wrist flexion'],
    safetyWarnings: ['Avoid using momentum or body weight to push down.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 85,
    peakAngle: 165,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 16. Lateral Raises
  {
    id: 'lateral_raises',
    name: 'Dumbbell Lateral Raises',
    category: 'Shoulders',
    targetMuscles: ['Lateral Deltoid'],
    secondaryMuscles: ['Trapezius', 'Supraspinatus'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    cameraAngle: 'Front',
    description: 'Key exercise for shoulder width, sculpting the side deltoid head.',
    instructions: [
      'Stand with weights at sides, slight bend in elbows, slight forward hinge (10°).',
      'Raise arms laterally leading with elbows until parallel to the floor (shoulder height).',
      'Pause briefly at top; lower slowly over 2 seconds.'
    ],
    checklist: ['Elbows level with wrists at peak', 'No shrugging traps up', 'Controlled descent'],
    commonMistakes: ['Swinging weights with hips', 'Raising hands higher than elbows', 'Shrugging neck'],
    safetyWarnings: ['Do not raise weights above parallel to avoid shoulder impingement.'],
    primaryJointAngle: 'Shoulder Angle',
    startAngle: 20,
    peakAngle: 90,
    coachingRules: {
      minRangeOfMotion: 70,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 17. Front Raises
  {
    id: 'front_raises',
    name: 'Dumbbell Front Raises',
    category: 'Shoulders',
    targetMuscles: ['Anterior Deltoid'],
    secondaryMuscles: ['Upper Chest', 'Serratus'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Isolation exercise targeting front shoulder head with strict strict form.',
    instructions: [
      'Hold weights in front of thighs.',
      'Lift arms straight forward to shoulder height without swinging.',
      'Lower smoothly back to thighs.'
    ],
    checklist: ['Lift strictly with shoulders', 'Stop at parallel/chin height', 'Zero torso swing'],
    commonMistakes: ['Rocking hips backward', 'Arching back', 'Dropping weights fast'],
    safetyWarnings: ['Maintain neutral spine.'],
    primaryJointAngle: 'Shoulder Angle',
    startAngle: 15,
    peakAngle: 90,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 18. Pull-ups
  {
    id: 'pullups',
    name: 'Pull-ups (Overhand)',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Upper Back'],
    secondaryMuscles: ['Biceps', 'Forearms', 'Core'],
    equipment: 'Pull-up Bar',
    difficulty: 'Advanced',
    cameraAngle: 'Front',
    description: 'Gold standard vertical pulling movement for massive back width and grip endurance.',
    instructions: [
      'Grip bar slightly wider than shoulder width with palms facing away (pronated).',
      'Start from a dead hang with lats engaged.',
      'Drive elbows down and back to pull chin cleanly over the bar.',
      'Lower under control to complete dead hang.'
    ],
    checklist: ['Chin clears bar', 'Full extension at dead hang', 'Minimal kipping'],
    commonMistakes: ['Kicking legs/kipping', 'Half reps without chin over bar', 'Dropping without control'],
    safetyWarnings: ['Control the descent to protect shoulder labrum.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 170,
    peakAngle: 60,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.5
    }
  },

  // 19. Chin-ups
  {
    id: 'chinups',
    name: 'Chin-ups (Underhand)',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Biceps Brachii'],
    secondaryMuscles: ['Upper Back', 'Core'],
    equipment: 'Pull-up Bar',
    difficulty: 'Intermediate',
    cameraAngle: 'Front',
    description: 'Supinated vertical pull recruiting high bicep activation alongside lats.',
    instructions: [
      'Grip bar shoulder-width with palms facing you (supinated).',
      'Pull chest up towards bar leading with elbows.',
      'Clear chin over bar and squeeze biceps and lats.',
      'Lower smoothly to full arm extension.'
    ],
    checklist: ['Full stretch at bottom', 'Elbows pulled down hard', 'Clean chin clearance'],
    commonMistakes: ['Swinging legs', 'Partial reps', 'Reaching neck forward'],
    safetyWarnings: ['Maintain full control throughout range.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 170,
    peakAngle: 55,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.2
    }
  },

  // 20. Deadlift
  {
    id: 'deadlift',
    name: 'Conventional Barbell Deadlift',
    category: 'Back',
    targetMuscles: ['Hamstrings', 'Glutes', 'Erector Spinae'],
    secondaryMuscles: ['Latissimus Dorsi', 'Traps', 'Forearms', 'Core'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    cameraAngle: 'Side (90°)',
    description: 'The ultimate test of whole-body posterior chain raw pulling power.',
    instructions: [
      'Stand with feet hip-width apart, bar over midfoot touching shins.',
      'Hinge at hips, grip bar outside legs, pull slack out of bar with lats engaged.',
      'Chest high, back flat (neutral spine), hips between knees and shoulders.',
      'Push the floor away through midfoot, keeping bar glued to shins and thighs.',
      'Lock out hips and knees simultaneously standing tall without hyperextending.'
    ],
    checklist: [
      'Neutral spine from lumbar to cervical throughout pull',
      'Bar path vertical directly over midfoot',
      'Hips and chest rise at same rate off floor',
      'Powerful lockout with glute contraction'
    ],
    commonMistakes: [
      'Rounding lumbar spine under load (dangerous spinal flexion)',
      'Bar drifting away from shins',
      'Hips shooting up before chest (stiff-legging)',
      'Hyperextending lower back at lockout'
    ],
    safetyWarnings: [
      'CRITICAL: If lumbar flexion or spinal rounding occurs under load, STOP immediately.',
      'Do not jerk the bar from the floor; pull tension first.'
    ],
    primaryJointAngle: 'Hip Angle',
    startAngle: 65,
    peakAngle: 170,
    coachingRules: {
      minRangeOfMotion: 85,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.5,
      maxTorsoLeanAngle: 45
    }
  },

  // 21. Romanian Deadlift
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    targetMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back', 'Forearms'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (90°)',
    description: 'Hip hinge movement maximizing eccentric hamstring stretch and glute hypertrophy.',
    instructions: [
      'Hold weights against thighs, soft knees unlocked (15-20° bend).',
      'Push hips backward towards the wall behind you keeping back completely flat.',
      'Lower weights along shins until maximum hamstring stretch is reached (mid-shin).',
      'Drive hips forward to return tall.'
    ],
    checklist: ['Shins stay vertical', 'Hips drive straight back', 'Spine completely flat'],
    commonMistakes: ['Squatting instead of hinging', 'Rounding lower back to touch floor', 'Weights drifting away'],
    safetyWarnings: ['Do not round lower back; stop hinge when hips stop traveling backward.'],
    primaryJointAngle: 'Hip Angle',
    startAngle: 170,
    peakAngle: 85,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 3.0,
      recommendedConcentricSec: 1.2
    }
  },

  // 22. Barbell Row
  {
    id: 'barbell_row',
    name: 'Bent-Over Barbell Row',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Mid Traps'],
    secondaryMuscles: ['Biceps', 'Rear Deltoids', 'Erectors'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (90°)',
    description: 'Horizontal pulling staple creating upper back density and isometric hip stability.',
    instructions: [
      'Hinge hips back to 45-degree torso angle with flat spine.',
      'Pull bar towards lower ribcage/navel, driving elbows up and back.',
      'Squeeze scapulae at top; lower bar under control.'
    ],
    checklist: ['Torso angle steady at ~45 degrees', 'Back flat', 'Elbows pulled past torso'],
    commonMistakes: ['Standing up with each rep', 'Rounding back', 'Yanking bar with biceps only'],
    safetyWarnings: ['Maintain core brace to protect lower back during bent posture.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 75,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0,
      maxTorsoLeanAngle: 50
    }
  },

  // 23. Dumbbell Row
  {
    id: 'dumbbell_row',
    name: 'Single-Arm Dumbbell Row',
    category: 'Back',
    targetMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Rhomboids', 'Biceps', 'Rear Delts'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Unilateral row eliminating lower back strain while fixing muscle imbalances.',
    instructions: [
      'Support knee and hand on bench or brace on knee.',
      'With flat back, row dumbbell towards hip crease.',
      'Squeeze lat at top and lower with full stretch.'
    ],
    checklist: ['Flat spine', 'Elbow tracks close to torso towards hip', 'Full stretch at bottom'],
    commonMistakes: ['Twisting torso violently', 'Pulling to shoulder instead of hip', 'Rounding shoulders'],
    safetyWarnings: ['Keep core braced; avoid excessive spinal rotation.'],
    primaryJointAngle: 'Elbow Angle',
    startAngle: 165,
    peakAngle: 75,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 24. Plank
  {
    id: 'plank',
    name: 'Forearm Plank',
    category: 'Core',
    targetMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
    secondaryMuscles: ['Shoulders', 'Glutes', 'Quadriceps'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    isIsometric: true,
    targetDurationSeconds: 45,
    description: 'Foundational anti-extension core endurance exercise protecting the spine.',
    instructions: [
      'Support body on forearms and toes with elbows directly under shoulders.',
      'Tuck pelvis into posterior pelvic tilt (squeezing glutes and drawing navel in).',
      'Maintain continuous rigid horizontal line from head to heels.',
      'Breathe steadily into abdomen while holding maximum tension.'
    ],
    checklist: [
      'Straight horizontal alignment (ears, shoulders, hips, knees)',
      'Glutes actively clenched',
      'No hip sagging toward floor',
      'No piking hips toward ceiling'
    ],
    commonMistakes: [
      'Sagging hips causing lumbar extension strain',
      'Piking hips into tent shape to relieve core tension',
      'Dropping head forward'
    ],
    safetyWarnings: [
      'If your lower back begins sagging and pinching, immediately stop and reset.'
    ],
    primaryJointAngle: 'Hip Angle',
    startAngle: 180,
    peakAngle: 180,
    coachingRules: {
      minRangeOfMotion: 95,
      recommendedEccentricSec: 0,
      recommendedConcentricSec: 0,
      hipAlignmentRequired: true
    }
  },

  // 25. Side Plank
  {
    id: 'side_plank',
    name: 'Side Plank',
    category: 'Core',
    targetMuscles: ['Obliques', 'Quadratus Lumborum'],
    secondaryMuscles: ['Gluteus Medius', 'Shoulders'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    cameraAngle: 'Front',
    isIsometric: true,
    targetDurationSeconds: 30,
    description: 'Lateral core endurance exercise building rotational resilience and hip abductor strength.',
    instructions: [
      'Lie on side, propped on forearm directly beneath shoulder.',
      'Stack feet and lift hips off ground until body forms straight diagonal line.',
      'Hold position with top hip elevated.'
    ],
    checklist: ['Hips lifted high', 'Body in straight line', 'Shoulder packed'],
    commonMistakes: ['Hips dipping toward floor', 'Torso rotating forward', 'Shoulder collapsing'],
    safetyWarnings: ['Keep supporting shoulder active and pushed away from ear.'],
    primaryJointAngle: 'Torso Angle',
    startAngle: 180,
    peakAngle: 180,
    coachingRules: {
      minRangeOfMotion: 90,
      recommendedEccentricSec: 0,
      recommendedConcentricSec: 0
    }
  },

  // 26. Mountain Climbers
  {
    id: 'mountain_climbers',
    name: 'Mountain Climbers',
    category: 'Cardio/Full Body',
    targetMuscles: ['Core', 'Hip Flexors'],
    secondaryMuscles: ['Shoulders', 'Cardiovascular System'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Dynamic plank variation pairing cardiovascular conditioning with core stability.',
    instructions: [
      'Start in high push-up plank position.',
      'Drive one knee forward towards chest while keeping hips down.',
      'Rapidly switch legs in rhythmic running motion.',
      'Maintain solid hand placement and flat back throughout.'
    ],
    checklist: ['Hips stay low and stable', 'Hands planted under shoulders', 'Knees drive forward'],
    commonMistakes: ['Bouncing hips high in air', 'Weight drifting back off hands', 'Shallow knee drive'],
    safetyWarnings: ['Keep wrists under shoulders; do not let hips pike excessively.'],
    primaryJointAngle: 'Knee Angle',
    startAngle: 170,
    peakAngle: 70,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 0.5,
      recommendedConcentricSec: 0.5
    }
  },

  // 27. Jumping Jacks
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    category: 'Cardio/Full Body',
    targetMuscles: ['Calves', 'Deltoids'],
    secondaryMuscles: ['Cardiovascular System', 'Core'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Front',
    description: 'Classic calisthenic movement elevating heart rate and warming up shoulder and hip joints.',
    instructions: [
      'Stand with feet together, arms resting at sides.',
      'Jump feet outward while raising arms laterally until hands clap or meet overhead.',
      'Jump back to starting position landing softly on balls of feet.'
    ],
    checklist: ['Hands reach overhead', 'Feet spread wider than shoulder width', 'Soft athletic landing'],
    commonMistakes: ['Stiff-legged landing', 'Arms only reaching shoulder height', 'Landing loudly'],
    safetyWarnings: ['Land softly with bent knees to protect joints.'],
    primaryJointAngle: 'Shoulder Angle',
    startAngle: 20,
    peakAngle: 165,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 0.4,
      recommendedConcentricSec: 0.4
    }
  },

  // 28. Sit-ups
  {
    id: 'situps',
    name: 'Full Sit-ups',
    category: 'Core',
    targetMuscles: ['Rectus Abdominis', 'Hip Flexors'],
    secondaryMuscles: ['Obliques'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Classic abdominal exercise training spinal flexion through complete range of motion.',
    instructions: [
      'Lie on back with knees bent at 90 degrees and feet flat on floor.',
      'Cross arms on chest or place fingertips gently at temples (do not yank neck).',
      'Flex abs to roll spine upward until torso is vertical beside thighs.',
      'Lower back down segment by segment with control.'
    ],
    checklist: ['Abdominal contraction initiates movement', 'No pulling on neck', 'Controlled descent'],
    commonMistakes: ['Yanking cervical spine with hands', 'Feet lifting off floor', 'Flopping down unassisted'],
    safetyWarnings: ['Do not pull head forward with hands; lead with chest.'],
    primaryJointAngle: 'Hip Angle',
    startAngle: 160,
    peakAngle: 65,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.0,
      recommendedConcentricSec: 1.0
    }
  },

  // 29. Crunches
  {
    id: 'crunches',
    name: 'Abdominal Crunches',
    category: 'Core',
    targetMuscles: ['Upper Rectus Abdominis'],
    secondaryMuscles: ['Transverse Abdominis'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Targeted abdominal isolation keeping lower back pressed safely to the floor.',
    instructions: [
      'Lie on back with knees bent and feet planted.',
      'Curl shoulders off floor towards hips, feeling upper abs contract hard.',
      'Keep lower back pinned to mat; pause at peak for 1 second.',
      'Lower until shoulder blades graze mat.'
    ],
    checklist: ['Lower back glued to ground', 'Shoulder blades clear floor', 'Peak squeeze'],
    commonMistakes: ['Tucking chin to chest', 'Using hip flexors', 'Bouncing off ground'],
    safetyWarnings: ['Maintain space between chin and chest (imagine holding an orange).'],
    primaryJointAngle: 'Torso Angle',
    startAngle: 175,
    peakAngle: 140,
    coachingRules: {
      minRangeOfMotion: 70,
      recommendedEccentricSec: 1.5,
      recommendedConcentricSec: 1.0
    }
  },

  // 30. Leg Raises
  {
    id: 'leg_raises',
    name: 'Lying Leg Raises',
    category: 'Core',
    targetMuscles: ['Lower Rectus Abdominis', 'Hip Flexors'],
    secondaryMuscles: ['Transverse Abdominis'],
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    cameraAngle: 'Side (90°)',
    description: 'Anti-extension lower abdominal builder focusing on posterior pelvic control.',
    instructions: [
      'Lie supine on mat with hands under glutes or flat at sides.',
      'Press lower back flat into mat; lift straight legs up to 90 degrees.',
      'Slowly lower legs towards floor without allowing lumbar spine to arch off mat.',
      'Reverse upward just before touching the ground.'
    ],
    checklist: ['Lower back stays flat against floor at all times', 'Legs straight or slightly soft', 'Controlled lowering'],
    commonMistakes: ['Lower back arching off mat (pelvic tilt loss)', 'Swinging legs with momentum', 'Bending knees excessively'],
    safetyWarnings: ['If your lower back arches up, stop before that depth to protect lumbar discs.'],
    primaryJointAngle: 'Hip Angle',
    startAngle: 170,
    peakAngle: 85,
    coachingRules: {
      minRangeOfMotion: 80,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.2
    }
  },

  // 31. Calf Raises
  {
    id: 'calf_raises',
    name: 'Standing Calf Raises',
    category: 'Legs',
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    secondaryMuscles: ['Tibialis Posterior', 'Ankle Stabilizers'],
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    cameraAngle: 'Side (90°)',
    description: 'Ankle plantarflexion exercise sculpting lower leg muscularity and ankle stiffness.',
    instructions: [
      'Stand tall on flat ground or edge of a step with balls of feet.',
      'Drive through big toes to elevate heels as high as possible into full plantarflexion.',
      'Pause for 1 second at apex contraction.',
      'Lower slowly over 2-3 seconds until full stretch is achieved.'
    ],
    checklist: ['Weight distributed through big toe joint', 'Full ankle extension at top', 'Controlled negative stretch'],
    commonMistakes: ['Rolling ankles outward to pinky toe', 'Bouncing with Achilles tendon elasticity', 'Partial range of motion'],
    safetyWarnings: ['Maintain controlled tempo to avoid sudden Achilles strain.'],
    primaryJointAngle: 'Ankle Angle',
    startAngle: 90,
    peakAngle: 135,
    coachingRules: {
      minRangeOfMotion: 75,
      recommendedEccentricSec: 2.5,
      recommendedConcentricSec: 1.0
    }
  }
];

export const GET_EXERCISE_BY_ID = (id: string): ExerciseDefinition => {
  const found = EXERCISE_LIBRARY.find((e) => e.id === id);
  return found || EXERCISE_LIBRARY[0];
};
