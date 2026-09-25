"""
state_machine.py — Python port of state-machine.ts
Rep counting state machine with full phase tracking.
"""

import time
import random
import string
from typing import Optional, Callable, Dict, Any, List
from biomechanics import (
    JointAngles, FormScoreBreakdown,
    extract_joint_angles, evaluate_rep_form, LandmarkPoint
)


class RepCompletedEvent:
    def __init__(
        self,
        exercise_id: str,
        exercise_name: str,
        rep_number: int,
        set_number: int,
        form_score: FormScoreBreakdown,
        tempo: Dict[str, float],
        duration_seconds: float,
        primary_joint_angle: float,
        joint_angles: JointAngles
    ):
        self.exercise_id = exercise_id
        self.exercise_name = exercise_name
        self.rep_number = rep_number
        self.set_number = set_number
        self.form_score = form_score
        self.tempo = tempo
        self.duration_seconds = duration_seconds
        self.primary_joint_angle = primary_joint_angle
        self.joint_angles = joint_angles

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exerciseId": self.exercise_id,
            "exerciseName": self.exercise_name,
            "repNumber": self.rep_number,
            "setNumber": self.set_number,
            "formScore": self.form_score.to_dict(),
            "tempo": self.tempo,
            "durationSeconds": self.duration_seconds,
            "primaryJointAngle": self.primary_joint_angle,
            "jointAngles": self.joint_angles.to_dict()
        }


class CoachingMessage:
    def __init__(self, msg_id: str, timestamp: float, severity: str, text: str, exercise: str, rep_number: int = 0):
        self.id = msg_id
        self.timestamp = timestamp
        self.severity = severity
        self.text = text
        self.exercise = exercise
        self.rep_number = rep_number

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "severity": self.severity,
            "text": self.text,
            "exercise": self.exercise,
            "repNumber": self.rep_number
        }


class LiveWorkoutMetrics:
    def __init__(
        self,
        current_rep: int,
        current_set: int,
        reps_completed_in_set: int,
        current_phase: str,
        phase_progress: float,
        rep_duration_seconds: float,
        tempo: Dict[str, float],
        range_of_motion_percent: float,
        current_joint_angles: JointAngles,
        form_score: FormScoreBreakdown,
        active_seconds: float,
        rest_seconds: float,
        is_resting: bool
    ):
        self.current_rep = current_rep
        self.current_set = current_set
        self.reps_completed_in_set = reps_completed_in_set
        self.current_phase = current_phase
        self.phase_progress = phase_progress
        self.rep_duration_seconds = rep_duration_seconds
        self.tempo = tempo
        self.range_of_motion_percent = range_of_motion_percent
        self.current_joint_angles = current_joint_angles
        self.form_score = form_score
        self.active_seconds = active_seconds
        self.rest_seconds = rest_seconds
        self.is_resting = is_resting

    def to_dict(self) -> Dict[str, Any]:
        return {
            "currentRep": self.current_rep,
            "currentSet": self.current_set,
            "repsCompletedInSet": self.reps_completed_in_set,
            "currentPhase": self.current_phase,
            "phaseProgress": self.phase_progress,
            "repDurationSeconds": round(self.rep_duration_seconds, 1),
            "tempo": self.tempo,
            "rangeOfMotionPercent": self.range_of_motion_percent,
            "currentJointAngles": self.current_joint_angles.to_dict(),
            "formScore": self.form_score.to_dict(),
            "activeSeconds": round(self.active_seconds),
            "restSeconds": round(self.rest_seconds),
            "isResting": self.is_resting
        }


class ExerciseStateMachine:
    def __init__(self, exercise: Dict[str, Any]):
        self.exercise = exercise
        self.current_phase = "PREPARING"
        self.rep_count = 0
        self.current_set = 1
        self.set_reps = 0

        self.phase_start_time = time.time()
        self.rep_start_time = time.time()
        self.eccentric_duration = 0.0
        self.pause_duration = 0.0
        self.concentric_duration = 0.0

        self.extreme_angle_reached = float(exercise["startAngle"])
        self.last_angles = JointAngles()

        self.last_coach_message_time = 0.0
        self.coach_cooldown_ms = 3.5

        self.isometric_hold_seconds = 0.0
        self.last_iso_tick = time.time()

        self.on_rep_complete_cb: Optional[Callable[[RepCompletedEvent], None]] = None
        self.on_coach_message_cb: Optional[Callable[[CoachingMessage], None]] = None

    def set_exercise(self, new_exercise: Dict[str, Any]):
        self.exercise = new_exercise
        self.reset()

    def reset(self):
        self.current_phase = "PREPARING"
        self.rep_count = 0
        self.set_reps = 0
        self.extreme_angle_reached = float(self.exercise["startAngle"])
        self.eccentric_duration = 0.0
        self.pause_duration = 0.0
        self.concentric_duration = 0.0
        self.isometric_hold_seconds = 0.0
        self.phase_start_time = time.time()
        self.rep_start_time = time.time()

    def next_set(self):
        self.current_set += 1
        self.set_reps = 0
        self.current_phase = "PREPARING"

    def on_rep_complete(self, cb: Callable[[RepCompletedEvent], None]):
        self.on_rep_complete_cb = cb

    def on_coach_message(self, cb: Callable[[CoachingMessage], None]):
        self.on_coach_message_cb = cb

    def _get_primary_angle(self, angles: JointAngles) -> float:
        pa = self.exercise["primaryJointAngle"]
        if pa in ("Knee Angle", "Front Knee Angle"):
            return round((angles.left_knee + angles.right_knee) / 2)
        elif pa == "Elbow Angle":
            return round((angles.left_elbow + angles.right_elbow) / 2)
        elif pa == "Hip Angle":
            return round((angles.left_hip + angles.right_hip) / 2)
        elif pa == "Shoulder Angle":
            return round((angles.left_shoulder + angles.right_shoulder) / 2)
        elif pa == "Torso Angle":
            return angles.torso_angle
        return round((angles.left_knee + angles.right_knee) / 2)

    def _trigger_coach(self, text: str, severity: str):
        now = time.time()
        if now - self.last_coach_message_time < self.coach_cooldown_ms and severity != "WARNING":
            return
        self.last_coach_message_time = now
        if self.on_coach_message_cb:
            rand_suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=5))
            msg = CoachingMessage(
                msg_id=f"coach-{int(now * 1000)}-{rand_suffix}",
                timestamp=now * 1000,
                severity=severity,
                text=text,
                exercise=self.exercise["name"],
                rep_number=self.rep_count + 1
            )
            self.on_coach_message_cb(msg)

    def update(self, landmarks: List[Optional[LandmarkPoint]]) -> LiveWorkoutMetrics:
        now = time.time()
        angles = extract_joint_angles(landmarks)
        self.last_angles = angles
        current_angle = self._get_primary_angle(angles)

        start = self.exercise["startAngle"]
        target = self.exercise["peakAngle"]
        total_span = abs(start - target)
        progress_raw = (abs(current_angle - start) / total_span * 100) if total_span > 0 else 0
        phase_progress = max(0, min(100, round(progress_raw)))

        # ── Isometric Exercise ──────────────────────────────────────
        if self.exercise.get("isIsometric"):
            dt = now - self.last_iso_tick
            self.last_iso_tick = now

            avg_hip = (angles.left_hip + angles.right_hip) / 2
            is_in_hold = 145 <= avg_hip <= 195

            if is_in_hold:
                self.current_phase = "HOLDING"
                self.isometric_hold_seconds += dt
                hold_int = int(self.isometric_hold_seconds)
                if hold_int > 0 and hold_int % 15 == 0 and hold_int != self.rep_count:
                    self.rep_count = hold_int
                    self._trigger_coach(f"Holding strong! {hold_int}s elapsed. Keep core tight.", "INFO")
            else:
                self.current_phase = "PREPARING"
                if avg_hip < 145:
                    self._trigger_coach("Hips are piked up. Lower into flat plank.", "CORRECTION")
                elif avg_hip > 195:
                    self._trigger_coach("Caution: Hips sagging! Pull navel in to protect lumbar spine.", "WARNING")

            form_score = evaluate_rep_form(self.exercise, angles, current_angle, self.isometric_hold_seconds, 0, landmarks)
            target_dur = self.exercise.get("targetDurationSeconds") or 45
            return LiveWorkoutMetrics(
                current_rep=int(self.isometric_hold_seconds),
                current_set=self.current_set,
                reps_completed_in_set=int(self.isometric_hold_seconds),
                current_phase=self.current_phase,
                phase_progress=min(100, round((self.isometric_hold_seconds / target_dur) * 100)),
                rep_duration_seconds=round(self.isometric_hold_seconds),
                tempo={"eccentric": 0, "pause": round(self.isometric_hold_seconds), "concentric": 0},
                range_of_motion_percent=100 if is_in_hold else 50,
                current_joint_angles=angles,
                form_score=form_score,
                active_seconds=round(self.isometric_hold_seconds),
                rest_seconds=0,
                is_resting=False
            )

        # ── Dynamic Rep-based State Machine ────────────────────────
        is_decreasing = target < start
        tolerance = self.exercise.get("toleranceAngle") or 15

        if self.current_phase in ("PREPARING", "START_POSITION"):
            at_start = (current_angle >= start - tolerance) if is_decreasing else (current_angle <= start + tolerance)
            if at_start:
                self.current_phase = "START_POSITION"
                self.extreme_angle_reached = current_angle

            has_started = (current_angle < start - 20) if is_decreasing else (current_angle > start + 20)
            if has_started:
                self.current_phase = "ECCENTRIC"
                self.phase_start_time = now
                self.rep_start_time = now
                self.extreme_angle_reached = current_angle
                self._trigger_coach("Descent initiated. Control the tempo.", "INFO")

        elif self.current_phase == "ECCENTRIC":
            if is_decreasing:
                if current_angle < self.extreme_angle_reached:
                    self.extreme_angle_reached = current_angle
            else:
                if current_angle > self.extreme_angle_reached:
                    self.extreme_angle_reached = current_angle

            reached_peak = (current_angle <= target + tolerance) if is_decreasing else (current_angle >= target - tolerance)
            if reached_peak:
                self.eccentric_duration = now - self.phase_start_time
                self.current_phase = "PEAK_CONTRACTION"
                self.phase_start_time = now
                self._trigger_coach("Good depth! Now drive back up.", "INFO")

        elif self.current_phase == "PEAK_CONTRACTION":
            is_reversing = (current_angle > self.extreme_angle_reached + 15) if is_decreasing else (current_angle < self.extreme_angle_reached - 15)
            if is_reversing:
                self.pause_duration = now - self.phase_start_time
                self.current_phase = "CONCENTRIC"
                self.phase_start_time = now

        elif self.current_phase == "CONCENTRIC":
            back_to_start = (current_angle >= start - tolerance) if is_decreasing else (current_angle <= start + tolerance)
            if back_to_start:
                self.concentric_duration = now - self.phase_start_time
                self.current_phase = "COMPLETED_REP"
                self.rep_count += 1
                self.set_reps += 1

                form_score = evaluate_rep_form(
                    self.exercise, angles, self.extreme_angle_reached,
                    self.eccentric_duration, self.concentric_duration, landmarks
                )

                if form_score.quality == "GOOD FORM":
                    self._trigger_coach(f"Rep {self.rep_count} complete! Solid form ({form_score.total_score:.0f}/100).", "INFO")
                elif form_score.issues:
                    top = form_score.issues[0]
                    self._trigger_coach(f"Rep {self.rep_count}: {top.message}", top.severity)

                if self.on_rep_complete_cb:
                    depth_desc = "Full/Deep" if phase_progress >= 95 else ("Good" if phase_progress >= 80 else "Shallow")
                    total_rep_sec = self.eccentric_duration + self.pause_duration + self.concentric_duration
                    event = RepCompletedEvent(
                        exercise_id=self.exercise["id"],
                        exercise_name=self.exercise["name"],
                        rep_number=self.rep_count,
                        set_number=self.current_set,
                        form_score=form_score,
                        tempo={
                            "eccentric": round(self.eccentric_duration, 1),
                            "pause": round(self.pause_duration, 1),
                            "concentric": round(self.concentric_duration, 1)
                        },
                        duration_seconds=round(total_rep_sec, 1),
                        primary_joint_angle=current_angle,
                        joint_angles=angles
                    )
                    self.on_rep_complete_cb(event)

                # Reset for next rep after a brief window
                def _reset_phase():
                    import time as _time
                    _time.sleep(0.3)
                    if self.current_phase == "COMPLETED_REP":
                        self.current_phase = "START_POSITION"
                        self.extreme_angle_reached = float(start)
                        self.phase_start_time = _time.time()

                import threading
                threading.Thread(target=_reset_phase, daemon=True).start()

        # Real-time form evaluation for live HUD
        current_form_score = evaluate_rep_form(
            self.exercise, angles, self.extreme_angle_reached,
            self.eccentric_duration or 1.5,
            self.concentric_duration or 1.0,
            landmarks
        )

        rep_duration = now - self.rep_start_time

        return LiveWorkoutMetrics(
            current_rep=self.rep_count,
            current_set=self.current_set,
            reps_completed_in_set=self.set_reps,
            current_phase=self.current_phase,
            phase_progress=phase_progress,
            rep_duration_seconds=round(rep_duration, 1),
            tempo={
                "eccentric": round(self.eccentric_duration, 1),
                "pause": round(self.pause_duration, 1),
                "concentric": round(self.concentric_duration, 1)
            },
            range_of_motion_percent=phase_progress,
            current_joint_angles=angles,
            form_score=current_form_score,
            active_seconds=round(rep_duration),
            rest_seconds=0,
            is_resting=False
        )
