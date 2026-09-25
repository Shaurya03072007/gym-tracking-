"""
session_manager.py — Thread-safe session store for concurrent phone sessions.
Each session has: a frame queue, a state machine, latest annotated JPEG, and latest metrics.
"""

import uuid
import time
import threading
import queue
from typing import Optional, Dict, Any, List
from state_machine import ExerciseStateMachine, CoachingMessage
from exercises import get_exercise


class GymSession:
    """Holds all state for one mobile phone session."""

    def __init__(self, session_id: str, exercise_id: str = "squat"):
        self.session_id = session_id
        self.exercise_id = exercise_id
        self.created_at = time.time()
        self.last_activity = time.time()

        # Frame pipeline
        self.frame_queue: queue.Queue[bytes] = queue.Queue(maxsize=4)
        self.latest_annotated_jpeg: Optional[bytes] = None
        self.latest_metrics: Optional[Dict[str, Any]] = None
        self.latest_coach_messages: List[Dict[str, Any]] = []

        # State machine
        exercise = get_exercise(exercise_id)
        self.state_machine = ExerciseStateMachine(exercise)
        self.state_machine.on_coach_message(self._on_coach_msg)

        # Metrics WebSocket queues (one per connected client)
        self.metrics_ws_queues: List[queue.Queue] = []
        self.lock = threading.Lock()

        # FPS tracking
        self._frame_count = 0
        self._fps_window_start = time.time()
        self.fps = 0.0

    def _on_coach_msg(self, msg: CoachingMessage):
        d = msg.to_dict()
        with self.lock:
            self.latest_coach_messages.append(d)
            if len(self.latest_coach_messages) > 20:
                self.latest_coach_messages = self.latest_coach_messages[-20:]
            for q in self.metrics_ws_queues:
                try:
                    q.put_nowait({"type": "coach", "message": d})
                except queue.Full:
                    pass

    def push_annotated_frame(self, jpeg_bytes: bytes):
        with self.lock:
            self.latest_annotated_jpeg = jpeg_bytes
            self.last_activity = time.time()

        # FPS accounting
        self._frame_count += 1
        now = time.time()
        elapsed = now - self._fps_window_start
        if elapsed >= 2.0:
            self.fps = self._frame_count / elapsed
            self._frame_count = 0
            self._fps_window_start = now

    def push_metrics(self, metrics: Dict[str, Any]):
        with self.lock:
            self.latest_metrics = metrics
            for q in self.metrics_ws_queues:
                try:
                    q.put_nowait({"type": "metrics", "data": metrics, "fps": round(self.fps, 1)})
                except queue.Full:
                    pass

    def add_metrics_ws_queue(self, q: queue.Queue):
        with self.lock:
            self.metrics_ws_queues.append(q)

    def remove_metrics_ws_queue(self, q: queue.Queue):
        with self.lock:
            if q in self.metrics_ws_queues:
                self.metrics_ws_queues.remove(q)

    def change_exercise(self, exercise_id: str):
        exercise = get_exercise(exercise_id)
        with self.lock:
            self.exercise_id = exercise_id
            self.state_machine.set_exercise(exercise)

    def is_stale(self, timeout_seconds: float = 120.0) -> bool:
        return time.time() - self.last_activity > timeout_seconds

    def to_info(self) -> Dict[str, Any]:
        return {
            "sessionId": self.session_id,
            "exerciseId": self.exercise_id,
            "createdAt": self.created_at,
            "fps": round(self.fps, 1),
            "active": not self.is_stale(30)
        }


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, GymSession] = {}
        self._lock = threading.Lock()
        # Start cleanup daemon
        t = threading.Thread(target=self._cleanup_loop, daemon=True)
        t.start()

    def create_session(self, exercise_id: str = "squat") -> GymSession:
        session_id = str(uuid.uuid4())[:8].upper()
        session = GymSession(session_id, exercise_id)
        with self._lock:
            self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[GymSession]:
        with self._lock:
            return self._sessions.get(session_id)

    def list_sessions(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [s.to_info() for s in self._sessions.values()]

    def _cleanup_loop(self):
        """Remove sessions inactive for > 2 minutes."""
        while True:
            time.sleep(30)
            with self._lock:
                stale = [sid for sid, s in self._sessions.items() if s.is_stale(120)]
                for sid in stale:
                    del self._sessions[sid]


# Singleton
session_manager = SessionManager()
