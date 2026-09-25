"""
exercises.py — Python port of exercises.ts
All exercise definitions for the state machine.
"""

from typing import TypedDict, List, Optional


class CoachingRules(TypedDict):
    minRangeOfMotion: float
    recommendedEccentricSec: float
    recommendedConcentricSec: float
    maxTorsoLeanAngle: Optional[float]
    maxKneeCaveRatio: Optional[float]
    hipAlignmentRequired: Optional[bool]


class ExerciseDefinition(TypedDict):
    id: str
    name: str
    category: str
    targetMuscles: List[str]
    secondaryMuscles: List[str]
    equipment: str
    difficulty: str
    cameraAngle: str
    description: str
    instructions: List[str]
    checklist: List[str]
    commonMistakes: List[str]
    safetyWarnings: List[str]
    isIsometric: Optional[bool]
    targetDurationSeconds: Optional[float]
    primaryJointAngle: str
    startAngle: float
    peakAngle: float
    toleranceAngle: Optional[float]
    coachingRules: CoachingRules


EXERCISE_LIBRARY: List[ExerciseDefinition] = [
    {
        "id": "squat",
        "name": "Bodyweight Squat",
        "category": "Legs",
        "targetMuscles": ["Quadriceps", "Glutes"],
        "secondaryMuscles": ["Hamstrings", "Core", "Calves"],
        "equipment": "Bodyweight",
        "difficulty": "Beginner",
        "cameraAngle": "Side (45°)",
        "description": "Fundamental lower body compound movement building quad and hip extension strength.",
        "instructions": [
            "Stand with feet shoulder-width apart, toes pointed slightly outward.",
            "Brace your core and initiate the movement by hinging hips back and bending knees.",
            "Descend until thighs are parallel or below parallel with the floor.",
            "Keep chest elevated and knees tracking outward in line with your toes.",
            "Drive through your mid-foot to return to full upright lockout."
        ],
        "checklist": [
            "Knees track over second toe without collapsing inward",
            "Hips sink below knee level for full range of motion",
            "Torso remains upright without excessive forward lean",
            "Heels stay firmly planted on the ground"
        ],
        "commonMistakes": [
            "Knees caving inward during ascent",
            "Cutting depth short before 90 degrees",
            "Rising onto toes or lifting heels",
            "Chest collapsing forward causing excessive spinal stress"
        ],
        "safetyWarnings": [
            "If you experience sharp knee or lower-back pinching, stop immediately.",
            "Do not allow knees to collapse inward under load."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Knee Angle",
        "startAngle": 170,
        "peakAngle": 85,
        "toleranceAngle": 15,
        "coachingRules": {
            "minRangeOfMotion": 80,
            "recommendedEccentricSec": 2.5,
            "recommendedConcentricSec": 1.2,
            "maxTorsoLeanAngle": 35,
            "maxKneeCaveRatio": 0.1,
            "hipAlignmentRequired": True
        }
    },
    {
        "id": "pushup",
        "name": "Push-Up",
        "category": "Chest",
        "targetMuscles": ["Pectorals", "Triceps"],
        "secondaryMuscles": ["Anterior Deltoid", "Core", "Serratus Anterior"],
        "equipment": "Bodyweight",
        "difficulty": "Beginner",
        "cameraAngle": "Side (90°)",
        "description": "Classic upper-body compound pressing movement.",
        "instructions": [
            "Start in a high plank with hands slightly wider than shoulder-width.",
            "Keep your body in a straight line from head to heels.",
            "Lower your chest until it nearly touches the floor.",
            "Drive through your palms to lockout at the top."
        ],
        "checklist": [
            "Maintain rigid plank from head to heels",
            "Elbows track at 45° from torso, not flared",
            "Full chest-to-floor depth",
            "Complete elbow lockout at top"
        ],
        "commonMistakes": [
            "Sagging hips toward floor",
            "Piked hips in the air",
            "Partial range of motion",
            "Flaring elbows out at 90°"
        ],
        "safetyWarnings": [
            "Stop if wrists or shoulder joints cause pain.",
            "Protect lumbar by bracing core throughout."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Elbow Angle",
        "startAngle": 170,
        "peakAngle": 70,
        "toleranceAngle": 15,
        "coachingRules": {
            "minRangeOfMotion": 70,
            "recommendedEccentricSec": 2.0,
            "recommendedConcentricSec": 1.0,
            "maxTorsoLeanAngle": 10,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": True
        }
    },
    {
        "id": "plank",
        "name": "Plank Hold",
        "category": "Core",
        "targetMuscles": ["Core", "Transverse Abdominis"],
        "secondaryMuscles": ["Glutes", "Shoulders", "Quads"],
        "equipment": "Bodyweight",
        "difficulty": "Beginner",
        "cameraAngle": "Side (90°)",
        "description": "Foundational isometric core stability exercise.",
        "instructions": [
            "Place forearms on the floor, elbows under shoulders.",
            "Extend legs behind you, resting on toes.",
            "Maintain a rigid straight line from head to heels.",
            "Brace your core as if you're about to take a punch."
        ],
        "checklist": [
            "Hips level — no sagging or piking",
            "Core actively braced",
            "Head neutral, gaze at floor",
            "Breathe steadily through the hold"
        ],
        "commonMistakes": [
            "Hips sagging toward floor",
            "Hips piked toward ceiling",
            "Holding breath",
            "Head dropped or hyperextended"
        ],
        "safetyWarnings": [
            "Stop if lower back pain occurs — hips may be sagging.",
            "Do not hold breath."
        ],
        "isIsometric": True,
        "targetDurationSeconds": 45,
        "primaryJointAngle": "Hip Angle",
        "startAngle": 175,
        "peakAngle": 175,
        "toleranceAngle": 20,
        "coachingRules": {
            "minRangeOfMotion": 0,
            "recommendedEccentricSec": 0,
            "recommendedConcentricSec": 0,
            "maxTorsoLeanAngle": None,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": True
        }
    },
    {
        "id": "lunge",
        "name": "Forward Lunge",
        "category": "Legs",
        "targetMuscles": ["Quadriceps", "Glutes"],
        "secondaryMuscles": ["Hamstrings", "Core", "Hip Flexors"],
        "equipment": "Bodyweight",
        "difficulty": "Beginner",
        "cameraAngle": "Side (90°)",
        "description": "Unilateral lower body movement for balance and leg strength.",
        "instructions": [
            "Stand with feet hip-width apart.",
            "Step forward with one foot, lowering back knee toward the floor.",
            "Front thigh should reach parallel to the floor.",
            "Push through the front heel to return to start."
        ],
        "checklist": [
            "Front knee tracks over toes, not caving inward",
            "Torso upright throughout movement",
            "Back knee hovering just above the floor",
            "Controlled step and return"
        ],
        "commonMistakes": [
            "Front knee shooting past toes",
            "Torso leaning forward excessively",
            "Back knee slamming into the floor",
            "Losing balance on return"
        ],
        "safetyWarnings": [
            "Stop if knee pain is felt during the lunge.",
            "Maintain upright torso to protect lumbar spine."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Knee Angle",
        "startAngle": 170,
        "peakAngle": 90,
        "toleranceAngle": 15,
        "coachingRules": {
            "minRangeOfMotion": 75,
            "recommendedEccentricSec": 2.0,
            "recommendedConcentricSec": 1.0,
            "maxTorsoLeanAngle": 15,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": False
        }
    },
    {
        "id": "bicep_curl",
        "name": "Bicep Curl",
        "category": "Arms",
        "targetMuscles": ["Biceps Brachii"],
        "secondaryMuscles": ["Brachialis", "Forearms"],
        "equipment": "Dumbbells",
        "difficulty": "Beginner",
        "cameraAngle": "Front",
        "description": "Classic single-joint isolation exercise for bicep development.",
        "instructions": [
            "Stand holding dumbbells at arm's length, palms facing forward.",
            "Keeping upper arms stationary, curl the weights toward your shoulders.",
            "Squeeze the bicep at the top before slowly lowering.",
            "Complete full extension at the bottom."
        ],
        "checklist": [
            "Elbows locked at sides — no swinging",
            "Full range of motion from extension to peak contraction",
            "Controlled lowering phase",
            "Stable, upright torso"
        ],
        "commonMistakes": [
            "Swinging torso to generate momentum",
            "Partial range of motion",
            "Elbows drifting forward away from sides"
        ],
        "safetyWarnings": [
            "Use a weight that allows full ROM without torso momentum."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Elbow Angle",
        "startAngle": 170,
        "peakAngle": 40,
        "toleranceAngle": 15,
        "coachingRules": {
            "minRangeOfMotion": 80,
            "recommendedEccentricSec": 2.0,
            "recommendedConcentricSec": 1.0,
            "maxTorsoLeanAngle": 18,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": False
        }
    },
    {
        "id": "deadlift",
        "name": "Romanian Deadlift",
        "category": "Back",
        "targetMuscles": ["Hamstrings", "Glutes", "Erector Spinae"],
        "secondaryMuscles": ["Core", "Lats", "Forearms"],
        "equipment": "Barbell",
        "difficulty": "Intermediate",
        "cameraAngle": "Side (90°)",
        "description": "Hip hinge pulling movement for posterior chain development.",
        "instructions": [
            "Stand with barbell at hip height, grip slightly outside hip-width.",
            "Hinge at the hips, keeping back flat and bar close to legs.",
            "Lower until a hamstring stretch is felt (mid-shin level).",
            "Drive hips forward to return to standing, squeezing glutes at top."
        ],
        "checklist": [
            "Neutral spine maintained throughout",
            "Bar stays close to legs during entire movement",
            "Hip hinge — not a squat",
            "Full hip extension at lockout"
        ],
        "commonMistakes": [
            "Rounding the lower back",
            "Bar drifting away from legs",
            "Squatting instead of hinging",
            "Hyperextending spine at top"
        ],
        "safetyWarnings": [
            "Never round the lower back under load — stop immediately.",
            "Beginners should use light weight and master the hip hinge first."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Hip Angle",
        "startAngle": 170,
        "peakAngle": 60,
        "toleranceAngle": 15,
        "coachingRules": {
            "minRangeOfMotion": 70,
            "recommendedEccentricSec": 2.0,
            "recommendedConcentricSec": 1.5,
            "maxTorsoLeanAngle": 55,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": False
        }
    },
    {
        "id": "shoulder_press",
        "name": "Overhead Press",
        "category": "Shoulders",
        "targetMuscles": ["Deltoids", "Triceps"],
        "secondaryMuscles": ["Upper Traps", "Core", "Serratus Anterior"],
        "equipment": "Dumbbells",
        "difficulty": "Intermediate",
        "cameraAngle": "Front",
        "description": "Vertical pressing movement for shoulder strength and mass.",
        "instructions": [
            "Hold dumbbells at shoulder height, palms facing forward.",
            "Press weights directly overhead until arms are fully extended.",
            "Lower back to shoulder height under control."
        ],
        "checklist": [
            "Full overhead lockout at the top",
            "Core braced to prevent lumbar hyperextension",
            "Elbows track slightly forward, not flared",
            "Controlled descent"
        ],
        "commonMistakes": [
            "Excessive lower back arch",
            "Partial range of motion — not reaching full lockout",
            "Using leg drive (unless doing push-press intentionally)"
        ],
        "safetyWarnings": [
            "Stop if shoulder impingement or sharp pain occurs.",
            "Use a spotter with heavy barbell overhead press."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Shoulder Angle",
        "startAngle": 80,
        "peakAngle": 170,
        "toleranceAngle": 15,
        "coachingRules": {
            "minRangeOfMotion": 80,
            "recommendedEccentricSec": 2.0,
            "recommendedConcentricSec": 1.0,
            "maxTorsoLeanAngle": 20,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": False
        }
    },
    {
        "id": "jumping_jacks",
        "name": "Jumping Jacks",
        "category": "Cardio/Full Body",
        "targetMuscles": ["Full Body", "Cardiovascular System"],
        "secondaryMuscles": ["Deltoids", "Abductors", "Calves"],
        "equipment": "Bodyweight",
        "difficulty": "Beginner",
        "cameraAngle": "Front",
        "description": "Fundamental cardio warm-up movement.",
        "instructions": [
            "Stand with feet together, arms at sides.",
            "Jump and simultaneously spread feet and raise arms overhead.",
            "Jump back to starting position.",
            "Maintain a steady rhythm."
        ],
        "checklist": [
            "Arms reach full extension overhead",
            "Feet spread to shoulder-width on each jump",
            "Soft landing on the balls of the feet",
            "Maintain steady breathing rhythm"
        ],
        "commonMistakes": [
            "Landing flat-footed creating impact stress",
            "Arms not reaching full extension overhead"
        ],
        "safetyWarnings": [
            "Land softly to protect knees and ankles."
        ],
        "isIsometric": False,
        "targetDurationSeconds": None,
        "primaryJointAngle": "Shoulder Angle",
        "startAngle": 10,
        "peakAngle": 160,
        "toleranceAngle": 20,
        "coachingRules": {
            "minRangeOfMotion": 70,
            "recommendedEccentricSec": 0.5,
            "recommendedConcentricSec": 0.5,
            "maxTorsoLeanAngle": None,
            "maxKneeCaveRatio": None,
            "hipAlignmentRequired": False
        }
    },
]

EXERCISE_MAP = {ex["id"]: ex for ex in EXERCISE_LIBRARY}


def get_exercise(exercise_id: str) -> ExerciseDefinition:
    ex = EXERCISE_MAP.get(exercise_id)
    if not ex:
        return EXERCISE_LIBRARY[0]
    return ex
