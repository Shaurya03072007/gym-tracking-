import {
  FormIssue,
  FormQuality,
  FormScoreBreakdown,
  JointAngles,
  LandmarkPoint,
  NormalizedLandmarks,
  ExerciseDefinition
} from '../types';

/**
 * Calculates angle in degrees formed by three points (A -> B -> C) with B as vertex
 */
export function calculateJointAngle(
  a?: LandmarkPoint,
  b?: LandmarkPoint,
  c?: LandmarkPoint
): number {
  if (!a || !b || !c) return 180;
  
  // Vector BA
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  
  // Vector BC
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  
  if (mag1 === 0 || mag2 === 0) return 180;
  
  let cosine = dot / (mag1 * mag2);
  cosine = Math.max(-1, Math.min(1, cosine));
  
  const radians = Math.acos(cosine);
  return Math.round((radians * 180) / Math.PI);
}

/**
 * Calculates angle between a segment and the vertical axis (e.g. Torso lean)
 */
export function calculateVerticalAngle(top?: LandmarkPoint, bottom?: LandmarkPoint): number {
  if (!top || !bottom) return 0;
  const dx = Math.abs(top.x - bottom.x);
  const dy = Math.abs(top.y - bottom.y);
  if (dy === 0) return 90;
  const radians = Math.atan(dx / dy);
  return Math.round((radians * 180) / Math.PI);
}

/**
 * MediaPipe standard landmark indices:
 * 11: left_shoulder, 12: right_shoulder
 * 13: left_elbow, 14: right_elbow
 * 15: left_wrist, 16: right_wrist
 * 23: left_hip, 24: right_hip
 * 25: left_knee, 26: right_knee
 * 27: left_ankle, 28: right_ankle
 * 0: nose
 */
export function extractJointAngles(landmarks: NormalizedLandmarks): JointAngles {
  if (!landmarks || landmarks.length < 29) {
    return {
      leftKnee: 180,
      rightKnee: 180,
      leftHip: 180,
      rightHip: 180,
      leftElbow: 180,
      rightElbow: 180,
      leftShoulder: 0,
      rightShoulder: 0,
      torsoAngle: 0,
      neckAngle: 0,
      symmetryScore: 100
    };
  }

  // Joint Angles
  const leftKnee = calculateJointAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightKnee = calculateJointAngle(landmarks[24], landmarks[26], landmarks[28]);

  const leftHip = calculateJointAngle(landmarks[11], landmarks[23], landmarks[25]);
  const rightHip = calculateJointAngle(landmarks[12], landmarks[24], landmarks[26]);

  const leftElbow = calculateJointAngle(landmarks[11], landmarks[13], landmarks[15]);
  const rightElbow = calculateJointAngle(landmarks[12], landmarks[14], landmarks[16]);

  const leftShoulder = calculateJointAngle(landmarks[23], landmarks[11], landmarks[13]);
  const rightShoulder = calculateJointAngle(landmarks[24], landmarks[12], landmarks[14]);

  // Midpoints for Torso
  const midShoulder: LandmarkPoint = {
    x: (landmarks[11].x + landmarks[12].x) / 2,
    y: (landmarks[11].y + landmarks[12].y) / 2
  };
  const midHip: LandmarkPoint = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2
  };

  const torsoAngle = calculateVerticalAngle(midShoulder, midHip);
  const neckAngle = landmarks[0] ? calculateVerticalAngle(landmarks[0], midShoulder) : 0;

  // Symmetry score calculation
  const kneeDiff = Math.abs(leftKnee - rightKnee);
  const hipDiff = Math.abs(leftHip - rightHip);
  const elbowDiff = Math.abs(leftElbow - rightElbow);
  const avgAsymmetry = (kneeDiff + hipDiff + elbowDiff) / 3;
  const symmetryScore = Math.max(0, Math.min(100, Math.round(100 - avgAsymmetry * 1.5)));

  return {
    leftKnee,
    rightKnee,
    leftHip,
    rightHip,
    leftElbow,
    rightElbow,
    leftShoulder,
    rightShoulder,
    torsoAngle,
    neckAngle,
    symmetryScore
  };
}

/**
 * Computes transparent, deterministic biomechanical form score (0-100)
 */
export function evaluateRepForm(
  exercise: ExerciseDefinition,
  angles: JointAngles,
  peakAngleReached: number,
  eccentricTimeSec: number,
  concentricTimeSec: number,
  landmarks?: NormalizedLandmarks
): FormScoreBreakdown {
  let jointAlignment = 25;
  let rangeOfMotion = 25;
  let movementControl = 20;
  let symmetry = 15;
  let tempo = 15;

  const issues: FormIssue[] = [];
  const positiveFeedback: string[] = [];

  // 1. Evaluate Range of Motion (Max 25 pts)
  const targetRomDelta = Math.abs(exercise.startAngle - exercise.peakAngle);
  const achievedDelta = Math.abs(exercise.startAngle - peakAngleReached);
  const romRatio = targetRomDelta > 0 ? Math.min(1.2, achievedDelta / targetRomDelta) : 1;

  if (romRatio >= 0.95) {
    positiveFeedback.push('Full depth & complete range of motion achieved');
  } else if (romRatio >= 0.8) {
    rangeOfMotion -= 6;
    issues.push({
      severity: 'CORRECTION',
      joint: exercise.primaryJointAngle,
      issue: 'Shallow Depth',
      message: `Aim for full range of motion. Peak angle reached was ${peakAngleReached}°, target is ${exercise.peakAngle}°.`,
      scoreDeduction: 6
    });
  } else {
    rangeOfMotion -= 15;
    issues.push({
      severity: 'WARNING',
      joint: exercise.primaryJointAngle,
      issue: 'Significantly Incomplete ROM',
      message: `Movement stopped prematurely at ${peakAngleReached}°. Focus on deep controlled reps.`,
      scoreDeduction: 15
    });
  }

  // 2. Evaluate Joint Alignment & Safety (Max 25 pts)
  if (exercise.id.includes('squat')) {
    // Torso lean check
    if (angles.torsoAngle > (exercise.coachingRules.maxTorsoLeanAngle || 35)) {
      jointAlignment -= 10;
      issues.push({
        severity: 'WARNING',
        joint: 'Torso / Spine',
        issue: 'Excessive Forward Lean',
        message: `Torso leaning forward at ${angles.torsoAngle}°. Keep chest proud and brace core to prevent lumbar shear.`,
        scoreDeduction: 10
      });
    } else {
      positiveFeedback.push('Good upright torso posture');
    }

    // Knee tracking (Valgus check if landmarks present)
    if (landmarks && landmarks.length > 28) {
      const leftAnkleX = landmarks[27].x;
      const rightAnkleX = landmarks[28].x;
      const leftKneeX = landmarks[25].x;
      const rightKneeX = landmarks[26].x;
      const ankleSpread = Math.abs(leftAnkleX - rightAnkleX);
      const kneeSpread = Math.abs(leftKneeX - rightKneeX);

      if (ankleSpread > 0 && kneeSpread / ankleSpread < 0.82) {
        jointAlignment -= 12;
        issues.push({
          severity: 'WARNING',
          joint: 'Knees',
          issue: 'Knee Cave (Valgus)',
          message: 'Knees are caving inward! Actively push knees outward in line with your toes.',
          scoreDeduction: 12
        });
      } else {
        positiveFeedback.push('Knees tracked properly over toes');
      }
    }
  } else if (exercise.id.includes('pushup') || exercise.id === 'plank') {
    // Hip alignment (Sagging vs Piking)
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (avgHip < 155) {
      jointAlignment -= 12;
      issues.push({
        severity: 'CORRECTION',
        joint: 'Hips / Pelvis',
        issue: 'Piked Hips',
        message: 'Hips are elevated too high. Lower into a flat plank from shoulders to heels.',
        scoreDeduction: 12
      });
    } else if (avgHip > 200 || (landmarks && landmarks[23] && landmarks[11] && landmarks[27] && landmarks[23].y > Math.max(landmarks[11].y, landmarks[27].y))) {
      jointAlignment -= 14;
      issues.push({
        severity: 'WARNING',
        joint: 'Lumbar Spine',
        issue: 'Hip Sagging',
        message: 'Hips are sagging toward floor! Clench glutes and pull abs tight to protect lower back.',
        scoreDeduction: 14
      });
    } else {
      positiveFeedback.push('Solid horizontal plank line maintained');
    }
  } else if (exercise.id.includes('curl')) {
    // Torso stability in curls
    if (angles.torsoAngle > 18) {
      jointAlignment -= 12;
      issues.push({
        severity: 'CORRECTION',
        joint: 'Spine / Torso',
        issue: 'Torso Momentum (Cheat Curl)',
        message: 'Avoid swinging torso backward to lift weight. Lock elbows to sides and isolate biceps.',
        scoreDeduction: 12
      });
    } else {
      positiveFeedback.push('Strict elbow isolation with zero torso swing');
    }
  } else if (exercise.id.includes('deadlift')) {
    // Spine alignment
    if (angles.torsoAngle > 55) {
      jointAlignment -= 12;
      issues.push({
        severity: 'WARNING',
        joint: 'Lumbar Spine',
        issue: 'Spinal Flexion Risk',
        message: 'Keep back flat with lats engaged! Stop pull immediately if spine begins rounding.',
        scoreDeduction: 12
      });
    } else {
      positiveFeedback.push('Neutral back angle maintained');
    }
  }

  // 3. Evaluate Movement Control & Smoothness (Max 20 pts)
  const totalRepTime = eccentricTimeSec + concentricTimeSec;
  if (totalRepTime < 1.0 && !exercise.isIsometric && exercise.id !== 'jumping_jacks') {
    movementControl -= 8;
    issues.push({
      severity: 'CORRECTION',
      joint: 'Tempo',
      issue: 'Rushing Repetition',
      message: 'Movement was too fast. Avoid bouncing out of the bottom; control the load.',
      scoreDeduction: 8
    });
  } else {
    positiveFeedback.push('Controlled transition without ballistic bounce');
  }

  // 4. Evaluate Symmetry (Max 15 pts)
  if (angles.symmetryScore < 75) {
    const diff = 15 - Math.round((angles.symmetryScore / 100) * 15);
    symmetry -= diff;
    issues.push({
      severity: 'CORRECTION',
      joint: 'Bilateral Balance',
      issue: 'Asymmetrical Push/Pull',
      message: `Uneven side-to-side force distribution (Symmetry: ${angles.symmetryScore}%). Press equally with both sides.`,
      scoreDeduction: diff
    });
  } else {
    positiveFeedback.push('Clean bilateral symmetry between limbs');
  }

  // 5. Evaluate Tempo (Max 15 pts)
  const targetEcc = exercise.coachingRules.recommendedEccentricSec;
  if (targetEcc > 0 && eccentricTimeSec < targetEcc * 0.6) {
    tempo -= 6;
    issues.push({
      severity: 'CORRECTION',
      joint: 'Cadence',
      issue: 'Fast Eccentric Phase',
      message: `Slow down the lowering phase (${eccentricTimeSec.toFixed(1)}s vs target ${targetEcc}s) for hypertrophy and joint safety.`,
      scoreDeduction: 6
    });
  } else if (targetEcc > 0) {
    positiveFeedback.push(`Smooth eccentric tempo (${eccentricTimeSec.toFixed(1)}s)`);
  }

  // Clamping
  jointAlignment = Math.max(0, Math.min(25, jointAlignment));
  rangeOfMotion = Math.max(0, Math.min(25, rangeOfMotion));
  movementControl = Math.max(0, Math.min(20, movementControl));
  symmetry = Math.max(0, Math.min(15, symmetry));
  tempo = Math.max(0, Math.min(15, tempo));

  const totalScore = jointAlignment + rangeOfMotion + movementControl + symmetry + tempo;

  let quality: FormQuality = 'GOOD FORM';
  if (totalScore < 60) {
    quality = 'POOR FORM';
  } else if (totalScore < 80) {
    quality = 'WARNING';
  }

  return {
    totalScore,
    quality,
    jointAlignment,
    rangeOfMotion,
    movementControl,
    symmetry,
    tempo,
    positiveFeedback,
    issues
  };
}
