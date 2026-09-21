import {
  CoachingMessage,
  ExerciseDefinition,
  FormScoreBreakdown,
  JointAngles,
  LiveWorkoutMetrics,
  NormalizedLandmarks,
  RepPhase
} from '../types';
import { evaluateRepForm, extractJointAngles } from './biomechanics';

export interface RepCompletedEvent {
  exerciseId: string;
  exerciseName: string;
  repNumber: number;
  setNumber: number;
  formScore: FormScoreBreakdown;
  tempo: {
    eccentric: number;
    pause: number;
    concentric: number;
  };
  durationSeconds: number;
  primaryJointAngle: number;
  jointAngles: JointAngles;
  rawEventForGemini: {
    exercise: string;
    rep: number;
    knee_angle: number;
    hip_angle: number;
    torso_angle: number;
    depth: string;
    tempo: number;
    form_score: number;
    issues: string[];
    positive: string[];
  };
}

export class ExerciseStateMachine {
  private exercise: ExerciseDefinition;
  private currentPhase: RepPhase = 'PREPARING';
  private repCount = 0;
  private currentSet = 1;
  private setReps = 0;
  
  // Timing
  private phaseStartTime = Date.now();
  private repStartTime = Date.now();
  private eccentricDuration = 0;
  private pauseDuration = 0;
  private concentricDuration = 0;
  
  // Angle tracking
  private extremeAngleReached = 180;
  private lastAngles: JointAngles = {
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

  // Coaching cooldown
  private lastCoachMessageTime = 0;
  private coachCooldownMs = 3500; // 3.5s cooldown between voice/visual coaching notifications
  
  // Isometric hold tracking
  private isometricHoldSeconds = 0;
  private lastIsoTick = Date.now();

  private onRepCompleteCallback?: (event: RepCompletedEvent) => void;
  private onCoachMessageCallback?: (message: CoachingMessage) => void;

  constructor(exercise: ExerciseDefinition) {
    this.exercise = exercise;
    this.reset();
  }

  public setExercise(newExercise: ExerciseDefinition) {
    this.exercise = newExercise;
    this.reset();
  }

  public reset() {
    this.currentPhase = 'PREPARING';
    this.repCount = 0;
    this.setReps = 0;
    this.extremeAngleReached = this.exercise.startAngle;
    this.eccentricDuration = 0;
    this.pauseDuration = 0;
    this.concentricDuration = 0;
    this.isometricHoldSeconds = 0;
    this.phaseStartTime = Date.now();
    this.repStartTime = Date.now();
  }

  public nextSet() {
    this.currentSet++;
    this.setReps = 0;
    this.currentPhase = 'PREPARING';
  }

  public onRepComplete(cb: (event: RepCompletedEvent) => void) {
    this.onRepCompleteCallback = cb;
  }

  public onCoachMessage(cb: (msg: CoachingMessage) => void) {
    this.onCoachMessageCallback = cb;
  }

  private getPrimaryAngle(angles: JointAngles): number {
    switch (this.exercise.primaryJointAngle) {
      case 'Knee Angle':
      case 'Front Knee Angle':
        return Math.round((angles.leftKnee + angles.rightKnee) / 2);
      case 'Elbow Angle':
        return Math.round((angles.leftElbow + angles.rightElbow) / 2);
      case 'Hip Angle':
        return Math.round((angles.leftHip + angles.rightHip) / 2);
      case 'Shoulder Angle':
        return Math.round((angles.leftShoulder + angles.rightShoulder) / 2);
      case 'Torso Angle':
        return angles.torsoAngle;
      default:
        return Math.round((angles.leftKnee + angles.rightKnee) / 2);
    }
  }

  private triggerCoachMessage(text: string, severity: 'INFO' | 'CORRECTION' | 'WARNING') {
    const now = Date.now();
    if (now - this.lastCoachMessageTime < this.coachCooldownMs && severity !== 'WARNING') {
      return;
    }
    this.lastCoachMessageTime = now;
    if (this.onCoachMessageCallback) {
      this.onCoachMessageCallback({
        id: `coach-${now}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: now,
        severity,
        text,
        exercise: this.exercise.name,
        repNumber: this.repCount + 1
      });
    }
  }

  /**
   * Main step function called on every video frame (or simulated landmark update)
   */
  public update(landmarks: NormalizedLandmarks): LiveWorkoutMetrics {
    const now = Date.now();
    const angles = extractJointAngles(landmarks);
    this.lastAngles = angles;
    const currentAngle = this.getPrimaryAngle(angles);

    // Calculate ROM progress (0 to 100%)
    const start = this.exercise.startAngle;
    const target = this.exercise.peakAngle;
    const totalSpan = Math.abs(start - target);
    const currentProgressRaw = totalSpan > 0 ? (Math.abs(currentAngle - start) / totalSpan) * 100 : 0;
    const phaseProgress = Math.max(0, Math.min(100, Math.round(currentProgressRaw)));

    // Handle Isometric Exercises (e.g. Plank)
    if (this.exercise.isIsometric) {
      const dt = (now - this.lastIsoTick) / 1000;
      this.lastIsoTick = now;

      // Check if user is in valid plank posture
      const avgHip = (angles.leftHip + angles.rightHip) / 2;
      const isInHold = avgHip >= 145 && avgHip <= 195;

      if (isInHold) {
        this.currentPhase = 'HOLDING';
        this.isometricHoldSeconds += dt;
        
        // Every 10 seconds cue encouragement
        if (Math.floor(this.isometricHoldSeconds) > 0 && Math.floor(this.isometricHoldSeconds) % 15 === 0 && Math.floor(this.isometricHoldSeconds) !== this.repCount) {
          this.repCount = Math.floor(this.isometricHoldSeconds);
          this.triggerCoachMessage(`Holding strong! ${Math.floor(this.isometricHoldSeconds)}s elapsed. Keep core tight.`, 'INFO');
        }
      } else {
        this.currentPhase = 'PREPARING';
        if (avgHip < 145) {
          this.triggerCoachMessage('Hips are piked up. Lower into flat plank.', 'CORRECTION');
        } else if (avgHip > 195) {
          this.triggerCoachMessage('Caution: Hips are sagging! Pull navel in to protect lumbar spine.', 'WARNING');
        }
      }

      const formScore = evaluateRepForm(
        this.exercise,
        angles,
        currentAngle,
        this.isometricHoldSeconds,
        0,
        landmarks
      );

      return {
        currentRep: Math.floor(this.isometricHoldSeconds),
        currentSet: this.currentSet,
        repsCompletedInSet: Math.floor(this.isometricHoldSeconds),
        currentPhase: this.currentPhase,
        phaseProgress: Math.min(100, Math.round((this.isometricHoldSeconds / (this.exercise.targetDurationSeconds || 45)) * 100)),
        repDurationSeconds: Math.round(this.isometricHoldSeconds),
        tempo: { eccentric: 0, pause: Math.round(this.isometricHoldSeconds), concentric: 0 },
        rangeOfMotionPercent: isInHold ? 100 : 50,
        currentJointAngles: angles,
        formScore,
        activeSeconds: Math.round(this.isometricHoldSeconds),
        restSeconds: 0,
        isResting: false
      };
    }

    // Dynamic Rep-based State Machine
    const isDecreasing = target < start; // E.g., Squat starts at 170°, peaks at 85° (decreasing)
    const tolerance = this.exercise.toleranceAngle || 15;

    switch (this.currentPhase) {
      case 'PREPARING':
      case 'START_POSITION': {
        const atStart = isDecreasing
          ? currentAngle >= start - tolerance
          : currentAngle <= start + tolerance;

        if (atStart) {
          this.currentPhase = 'START_POSITION';
          this.extremeAngleReached = currentAngle;
        }

        // Detection of movement starting
        const hasStartedMoving = isDecreasing
          ? currentAngle < start - 20
          : currentAngle > start + 20;

        if (hasStartedMoving) {
          this.currentPhase = 'ECCENTRIC';
          this.phaseStartTime = now;
          this.repStartTime = now;
          this.extremeAngleReached = currentAngle;
          this.triggerCoachMessage('Descent initiated. Control the tempo.', 'INFO');
        }
        break;
      }

      case 'ECCENTRIC': {
        // Track deepest / highest inflection angle
        if (isDecreasing) {
          if (currentAngle < this.extremeAngleReached) {
            this.extremeAngleReached = currentAngle;
          }
        } else {
          if (currentAngle > this.extremeAngleReached) {
            this.extremeAngleReached = currentAngle;
          }
        }

        // Check if reached target depth / peak
        const reachedPeak = isDecreasing
          ? currentAngle <= target + tolerance
          : currentAngle >= target - tolerance;

        if (reachedPeak) {
          this.eccentricDuration = (now - this.phaseStartTime) / 1000;
          this.currentPhase = 'PEAK_CONTRACTION';
          this.phaseStartTime = now;
          this.triggerCoachMessage('Good depth! Now drive back up.', 'INFO');
        }
        break;
      }

      case 'PEAK_CONTRACTION': {
        // Pause detection & reversal into concentric
        const isReversing = isDecreasing
          ? currentAngle > this.extremeAngleReached + 15
          : currentAngle < this.extremeAngleReached - 15;

        if (isReversing) {
          this.pauseDuration = (now - this.phaseStartTime) / 1000;
          this.currentPhase = 'CONCENTRIC';
          this.phaseStartTime = now;
        }
        break;
      }

      case 'CONCENTRIC': {
        // Check if returned to start position lockout
        const backToStart = isDecreasing
          ? currentAngle >= start - tolerance
          : currentAngle <= start + tolerance;

        if (backToStart) {
          this.concentricDuration = (now - this.phaseStartTime) / 1000;
          this.currentPhase = 'COMPLETED_REP';
          this.repCount++;
          this.setReps++;

          // Form evaluation of completed rep
          const formScore = evaluateRepForm(
            this.exercise,
            angles,
            this.extremeAngleReached,
            this.eccentricDuration,
            this.concentricDuration,
            landmarks
          );

          // Coach feedback on rep
          if (formScore.quality === 'GOOD FORM') {
            this.triggerCoachMessage(`Rep ${this.repCount} complete! Solid form (${formScore.totalScore}/100).`, 'INFO');
          } else if (formScore.issues.length > 0) {
            const topIssue = formScore.issues[0];
            this.triggerCoachMessage(`Rep ${this.repCount}: ${topIssue.message}`, topIssue.severity);
          }

          // Trigger rep completed event for logging & Gemini AI
          if (this.onRepCompleteCallback) {
            const depthDesc = phaseProgress >= 95 ? 'Full/Deep' : phaseProgress >= 80 ? 'Good' : 'Shallow';
            const totalRepSec = this.eccentricDuration + this.pauseDuration + this.concentricDuration;

            this.onRepCompleteCallback({
              exerciseId: this.exercise.id,
              exerciseName: this.exercise.name,
              repNumber: this.repCount,
              setNumber: this.currentSet,
              formScore,
              tempo: {
                eccentric: Number(this.eccentricDuration.toFixed(1)),
                pause: Number(this.pauseDuration.toFixed(1)),
                concentric: Number(this.concentricDuration.toFixed(1))
              },
              durationSeconds: Number(totalRepSec.toFixed(1)),
              primaryJointAngle: currentAngle,
              jointAngles: angles,
              rawEventForGemini: {
                exercise: this.exercise.id,
                rep: this.repCount,
                knee_angle: Math.round((angles.leftKnee + angles.rightKnee) / 2),
                hip_angle: Math.round((angles.leftHip + angles.rightHip) / 2),
                torso_angle: angles.torsoAngle,
                depth: depthDesc,
                tempo: Number(totalRepSec.toFixed(1)),
                form_score: formScore.totalScore,
                issues: formScore.issues.map((i) => i.message),
                positive: formScore.positiveFeedback
              }
            });
          }

          // Reset for next rep after small lockout buffer
          setTimeout(() => {
            if (this.currentPhase === 'COMPLETED_REP') {
              this.currentPhase = 'START_POSITION';
              this.extremeAngleReached = start;
              this.phaseStartTime = Date.now();
            }
          }, 300);
        }
        break;
      }

      case 'COMPLETED_REP':
        // Brief state before next rep
        break;
    }

    const currentFormScore = evaluateRepForm(
      this.exercise,
      angles,
      this.extremeAngleReached,
      this.eccentricDuration || 1.5,
      this.concentricDuration || 1.0,
      landmarks
    );

    const repDuration = (now - this.repStartTime) / 1000;

    return {
      currentRep: this.repCount,
      currentSet: this.currentSet,
      repsCompletedInSet: this.setReps,
      currentPhase: this.currentPhase,
      phaseProgress,
      repDurationSeconds: Number(repDuration.toFixed(1)),
      tempo: {
        eccentric: Number(this.eccentricDuration.toFixed(1)),
        pause: Number(this.pauseDuration.toFixed(1)),
        concentric: Number(this.concentricDuration.toFixed(1))
      },
      rangeOfMotionPercent: phaseProgress,
      currentJointAngles: angles,
      formScore: currentFormScore,
      activeSeconds: Math.round(repDuration),
      restSeconds: 0,
      isResting: false
    };
  }
}
