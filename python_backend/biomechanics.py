"""
biomechanics.py — Python port of biomechanics.ts
Calculates joint angles, torso lean, and form scores from YOLO keypoints.

COCO-17 keypoint indices (from YOLOv8n-pose):
 0: nose
 1: left_eye    2: right_eye
 3: left_ear    4: right_ear
 5: left_shoulder   6: right_shoulder
 7: left_elbow      8: right_elbow
 9: left_wrist     10: right_wrist
11: left_hip       12: right_hip
13: left_knee      14: right_knee
15: left_ankle     16: right_ankle

MediaPipe/BlazePose-33 equivalents used in state machine:
  nose=0, left_shoulder=11, right_shoulder=12,
  left_elbow=13, right_elbow=14, left_wrist=15, right_wrist=16,
  left_hip=23, right_hip=24, left_knee=25, right_knee=26,
  left_ankle=27, right_ankle=28
"""

import math
from typing import List, Optional, Dict, Any, Tuple


class LandmarkPoint:
    def __init__(self, x: float, y: float, z: float = 0.0, visibility: float = 1.0):
        self.x = x
        self.y = y
        self.z = z
        self.visibility = visibility


# COCO-17 → BlazePose-33 index mapping
# We build a 33-element list where None = not available from COCO
COCO_TO_BLAZEPOSE: Dict[int, int] = {
    0: 0,    # nose → nose
    1: 2,    # left_eye → left_eye
    2: 5,    # right_eye → right_eye
    3: 7,    # left_ear → left_ear
    4: 8,    # right_ear → right_ear
    5: 11,   # left_shoulder → left_shoulder
    6: 12,   # right_shoulder → right_shoulder
    7: 13,   # left_elbow → left_elbow
    8: 14,   # right_elbow → right_elbow
    9: 15,   # left_wrist → left_wrist
    10: 16,  # right_wrist → right_wrist
    11: 23,  # left_hip → left_hip
    12: 24,  # right_hip → right_hip
    13: 25,  # left_knee → left_knee
    14: 26,  # right_knee → right_knee
    15: 27,  # left_ankle → left_ankle
    16: 28,  # right_ankle → right_ankle
}


def coco_to_blazepose(coco_kps: List[Optional[LandmarkPoint]]) -> List[Optional[LandmarkPoint]]:
    """Map COCO-17 keypoints to a 33-element BlazePose-style list."""
    bp = [None] * 33
    for coco_idx, bp_idx in COCO_TO_BLAZEPOSE.items():
        if coco_idx < len(coco_kps):
            bp[bp_idx] = coco_kps[coco_idx]
    return bp


def calculate_joint_angle(
    a: Optional[LandmarkPoint],
    b: Optional[LandmarkPoint],
    c: Optional[LandmarkPoint]
) -> float:
    """Angle at vertex B formed by rays BA and BC, in degrees."""
    if a is None or b is None or c is None:
        return 180.0

    v1x = a.x - b.x
    v1y = a.y - b.y
    v2x = c.x - b.x
    v2y = c.y - b.y

    dot = v1x * v2x + v1y * v2y
    mag1 = math.sqrt(v1x * v1x + v1y * v1y)
    mag2 = math.sqrt(v2x * v2x + v2y * v2y)

    if mag1 == 0 or mag2 == 0:
        return 180.0

    cosine = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    return round(math.degrees(math.acos(cosine)))


def calculate_vertical_angle(
    top: Optional[LandmarkPoint],
    bottom: Optional[LandmarkPoint]
) -> float:
    """Angle between a segment and the vertical axis (torso lean)."""
    if top is None or bottom is None:
        return 0.0
    dx = abs(top.x - bottom.x)
    dy = abs(top.y - bottom.y)
    if dy == 0:
        return 90.0
    return round(math.degrees(math.atan(dx / dy)))


class JointAngles:
    def __init__(
        self,
        left_knee: float = 180,
        right_knee: float = 180,
        left_hip: float = 180,
        right_hip: float = 180,
        left_elbow: float = 180,
        right_elbow: float = 180,
        left_shoulder: float = 0,
        right_shoulder: float = 0,
        torso_angle: float = 0,
        neck_angle: float = 0,
        symmetry_score: float = 100
    ):
        self.left_knee = left_knee
        self.right_knee = right_knee
        self.left_hip = left_hip
        self.right_hip = right_hip
        self.left_elbow = left_elbow
        self.right_elbow = right_elbow
        self.left_shoulder = left_shoulder
        self.right_shoulder = right_shoulder
        self.torso_angle = torso_angle
        self.neck_angle = neck_angle
        self.symmetry_score = symmetry_score

    def to_dict(self) -> Dict[str, float]:
        return {
            "leftKnee": self.left_knee,
            "rightKnee": self.right_knee,
            "leftHip": self.left_hip,
            "rightHip": self.right_hip,
            "leftElbow": self.left_elbow,
            "rightElbow": self.right_elbow,
            "leftShoulder": self.left_shoulder,
            "rightShoulder": self.right_shoulder,
            "torsoAngle": self.torso_angle,
            "neckAngle": self.neck_angle,
            "symmetryScore": self.symmetry_score,
        }


def extract_joint_angles(landmarks: List[Optional[LandmarkPoint]]) -> JointAngles:
    """
    Extract joint angles from a 33-element BlazePose-style landmark list.
    Uses the same indices as biomechanics.ts.
    """
    if not landmarks or len(landmarks) < 29:
        return JointAngles()

    lm = landmarks

    def g(i: int) -> Optional[LandmarkPoint]:
        if i < len(lm):
            return lm[i]
        return None

    left_knee = calculate_joint_angle(g(23), g(25), g(27))
    right_knee = calculate_joint_angle(g(24), g(26), g(28))

    left_hip = calculate_joint_angle(g(11), g(23), g(25))
    right_hip = calculate_joint_angle(g(12), g(24), g(26))

    left_elbow = calculate_joint_angle(g(11), g(13), g(15))
    right_elbow = calculate_joint_angle(g(12), g(14), g(16))

    left_shoulder = calculate_joint_angle(g(23), g(11), g(13))
    right_shoulder = calculate_joint_angle(g(24), g(12), g(14))

    mid_shoulder = None
    if g(11) and g(12):
        mid_shoulder = LandmarkPoint(
            (g(11).x + g(12).x) / 2,
            (g(11).y + g(12).y) / 2
        )

    mid_hip = None
    if g(23) and g(24):
        mid_hip = LandmarkPoint(
            (g(23).x + g(24).x) / 2,
            (g(23).y + g(24).y) / 2
        )

    torso_angle = calculate_vertical_angle(mid_shoulder, mid_hip)
    neck_angle = calculate_vertical_angle(g(0), mid_shoulder) if g(0) else 0.0

    knee_diff = abs(left_knee - right_knee)
    hip_diff = abs(left_hip - right_hip)
    elbow_diff = abs(left_elbow - right_elbow)
    avg_asymmetry = (knee_diff + hip_diff + elbow_diff) / 3
    symmetry_score = max(0, min(100, round(100 - avg_asymmetry * 1.5)))

    return JointAngles(
        left_knee=left_knee,
        right_knee=right_knee,
        left_hip=left_hip,
        right_hip=right_hip,
        left_elbow=left_elbow,
        right_elbow=right_elbow,
        left_shoulder=left_shoulder,
        right_shoulder=right_shoulder,
        torso_angle=torso_angle,
        neck_angle=neck_angle,
        symmetry_score=symmetry_score
    )


class FormIssue:
    def __init__(self, severity: str, joint: str, issue: str, message: str, score_deduction: float):
        self.severity = severity
        self.joint = joint
        self.issue = issue
        self.message = message
        self.score_deduction = score_deduction

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity,
            "joint": self.joint,
            "issue": self.issue,
            "message": self.message,
            "scoreDeduction": self.score_deduction
        }


class FormScoreBreakdown:
    def __init__(
        self,
        total_score: float,
        quality: str,
        joint_alignment: float,
        range_of_motion: float,
        movement_control: float,
        symmetry: float,
        tempo: float,
        positive_feedback: List[str],
        issues: List[FormIssue]
    ):
        self.total_score = total_score
        self.quality = quality
        self.joint_alignment = joint_alignment
        self.range_of_motion = range_of_motion
        self.movement_control = movement_control
        self.symmetry = symmetry
        self.tempo = tempo
        self.positive_feedback = positive_feedback
        self.issues = issues

    def to_dict(self) -> Dict[str, Any]:
        return {
            "totalScore": self.total_score,
            "quality": self.quality,
            "jointAlignment": self.joint_alignment,
            "rangeOfMotion": self.range_of_motion,
            "movementControl": self.movement_control,
            "symmetry": self.symmetry,
            "tempo": self.tempo,
            "positiveFeedback": self.positive_feedback,
            "issues": [i.to_dict() for i in self.issues]
        }


def evaluate_rep_form(
    exercise: Dict[str, Any],
    angles: JointAngles,
    peak_angle_reached: float,
    eccentric_time_sec: float,
    concentric_time_sec: float,
    landmarks: Optional[List[Optional[LandmarkPoint]]] = None
) -> FormScoreBreakdown:
    """
    Compute biomechanical form score 0–100.
    Direct port of evaluateRepForm() from biomechanics.ts.
    """
    joint_alignment = 25.0
    range_of_motion = 25.0
    movement_control = 20.0
    symmetry = 15.0
    tempo_score = 15.0

    issues: List[FormIssue] = []
    positive_feedback: List[str] = []

    coaching = exercise["coachingRules"]

    # 1. Range of Motion (max 25)
    target_delta = abs(exercise["startAngle"] - exercise["peakAngle"])
    achieved_delta = abs(exercise["startAngle"] - peak_angle_reached)
    rom_ratio = min(1.2, achieved_delta / target_delta) if target_delta > 0 else 1.0

    if rom_ratio >= 0.95:
        positive_feedback.append("Full depth & complete range of motion achieved")
    elif rom_ratio >= 0.8:
        range_of_motion -= 6
        issues.append(FormIssue(
            "CORRECTION", exercise["primaryJointAngle"], "Shallow Depth",
            f"Aim for full range of motion. Peak angle: {peak_angle_reached:.0f}°, target: {exercise['peakAngle']}°.",
            6
        ))
    else:
        range_of_motion -= 15
        issues.append(FormIssue(
            "WARNING", exercise["primaryJointAngle"], "Significantly Incomplete ROM",
            f"Movement stopped prematurely at {peak_angle_reached:.0f}°. Focus on deep controlled reps.",
            15
        ))

    # 2. Joint Alignment (max 25)
    ex_id = exercise["id"]
    if "squat" in ex_id or "lunge" in ex_id:
        max_lean = coaching.get("maxTorsoLeanAngle") or 35
        if angles.torso_angle > max_lean:
            joint_alignment -= 10
            issues.append(FormIssue(
                "WARNING", "Torso / Spine", "Excessive Forward Lean",
                f"Torso leaning at {angles.torso_angle}°. Keep chest proud and brace core.",
                10
            ))
        else:
            positive_feedback.append("Good upright torso posture")

        # Knee valgus check
        if landmarks and len(landmarks) > 28:
            lk = landmarks[25]
            rk = landmarks[26]
            la = landmarks[27]
            ra = landmarks[28]
            if lk and rk and la and ra:
                ankle_spread = abs(la.x - ra.x)
                knee_spread = abs(lk.x - rk.x)
                if ankle_spread > 0 and knee_spread / ankle_spread < 0.82:
                    joint_alignment -= 12
                    issues.append(FormIssue(
                        "WARNING", "Knees", "Knee Cave (Valgus)",
                        "Knees are caving inward! Actively push knees out in line with toes.",
                        12
                    ))
                else:
                    positive_feedback.append("Knees tracked properly over toes")

    elif "pushup" in ex_id or ex_id == "plank":
        avg_hip = (angles.left_hip + angles.right_hip) / 2
        if avg_hip < 155:
            joint_alignment -= 12
            issues.append(FormIssue(
                "CORRECTION", "Hips / Pelvis", "Piked Hips",
                "Hips elevated too high. Lower into a flat plank from shoulders to heels.",
                12
            ))
        elif avg_hip > 200:
            joint_alignment -= 14
            issues.append(FormIssue(
                "WARNING", "Lumbar Spine", "Hip Sagging",
                "Hips sagging toward floor! Clench glutes and pull abs tight.",
                14
            ))
        else:
            positive_feedback.append("Solid horizontal plank line maintained")

    elif "curl" in ex_id:
        if angles.torso_angle > 18:
            joint_alignment -= 12
            issues.append(FormIssue(
                "CORRECTION", "Spine / Torso", "Torso Momentum (Cheat Curl)",
                "Avoid swinging torso backward. Lock elbows to sides and isolate biceps.",
                12
            ))
        else:
            positive_feedback.append("Strict elbow isolation with zero torso swing")

    elif "deadlift" in ex_id:
        if angles.torso_angle > 55:
            joint_alignment -= 12
            issues.append(FormIssue(
                "WARNING", "Lumbar Spine", "Spinal Flexion Risk",
                "Keep back flat with lats engaged! Stop pull if spine rounds.",
                12
            ))
        else:
            positive_feedback.append("Neutral back angle maintained")

    # 3. Movement Control (max 20)
    total_rep_time = eccentric_time_sec + concentric_time_sec
    is_fast_exercise = exercise.get("id") == "jumping_jacks"
    if total_rep_time < 1.0 and not exercise.get("isIsometric") and not is_fast_exercise:
        movement_control -= 8
        issues.append(FormIssue(
            "CORRECTION", "Tempo", "Rushing Repetition",
            "Movement too fast. Control the load; avoid bouncing out of the bottom.",
            8
        ))
    else:
        positive_feedback.append("Controlled transition without ballistic bounce")

    # 4. Symmetry (max 15)
    if angles.symmetry_score < 75:
        diff = 15 - round((angles.symmetry_score / 100) * 15)
        symmetry -= diff
        issues.append(FormIssue(
            "CORRECTION", "Bilateral Balance", "Asymmetrical Push/Pull",
            f"Uneven side-to-side distribution (Symmetry: {angles.symmetry_score:.0f}%). Press equally with both sides.",
            diff
        ))
    else:
        positive_feedback.append("Clean bilateral symmetry between limbs")

    # 5. Tempo (max 15)
    target_ecc = coaching.get("recommendedEccentricSec", 0)
    if target_ecc and target_ecc > 0 and eccentric_time_sec < target_ecc * 0.6:
        tempo_score -= 6
        issues.append(FormIssue(
            "CORRECTION", "Cadence", "Fast Eccentric Phase",
            f"Slow down the lowering phase ({eccentric_time_sec:.1f}s vs target {target_ecc}s).",
            6
        ))
    elif target_ecc and target_ecc > 0:
        positive_feedback.append(f"Smooth eccentric tempo ({eccentric_time_sec:.1f}s)")

    # Clamp
    joint_alignment = max(0, min(25, joint_alignment))
    range_of_motion = max(0, min(25, range_of_motion))
    movement_control = max(0, min(20, movement_control))
    symmetry = max(0, min(15, symmetry))
    tempo_score = max(0, min(15, tempo_score))

    total = joint_alignment + range_of_motion + movement_control + symmetry + tempo_score

    if total < 60:
        quality = "POOR FORM"
    elif total < 80:
        quality = "WARNING"
    else:
        quality = "GOOD FORM"

    return FormScoreBreakdown(
        total_score=total,
        quality=quality,
        joint_alignment=joint_alignment,
        range_of_motion=range_of_motion,
        movement_control=movement_control,
        symmetry=symmetry,
        tempo=tempo_score,
        positive_feedback=positive_feedback,
        issues=issues
    )
