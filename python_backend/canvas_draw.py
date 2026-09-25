"""
canvas_draw.py — OpenCV skeleton + HUD overlay drawing
Draws the pose skeleton and workout metrics on top of the camera frame.
"""

import cv2
import numpy as np
from typing import Optional, List, Tuple, Dict, Any

# COCO-17 skeleton connections (pairs of keypoint indices)
SKELETON_CONNECTIONS = [
    (0, 1), (0, 2),          # nose → eyes
    (1, 3), (2, 4),          # eyes → ears
    (5, 6),                  # shoulders
    (5, 7), (7, 9),          # left arm
    (6, 8), (8, 10),         # right arm
    (5, 11), (6, 12),        # shoulder → hip
    (11, 12),                # hips
    (11, 13), (13, 15),      # left leg
    (12, 14), (14, 16),      # right leg
]

# Color palette (BGR)
COLOR_LEFT = (50, 220, 100)      # neon green for left side
COLOR_RIGHT = (80, 120, 255)     # electric blue for right side
COLOR_CENTER = (220, 180, 50)    # gold for center/spine
COLOR_GOOD = (50, 220, 80)
COLOR_WARN = (40, 180, 250)
COLOR_BAD = (50, 50, 230)
COLOR_OVERLAY_BG = (15, 15, 25)
COLOR_WHITE = (255, 255, 255)
COLOR_DIM = (140, 140, 160)


def _is_left(idx: int) -> bool:
    """COCO: 1,3,5,7,9,11,13,15 are left-side keypoints."""
    return idx in (1, 3, 5, 7, 9, 11, 13, 15)


def _is_right(idx: int) -> bool:
    return idx in (2, 4, 6, 8, 10, 12, 14, 16)


def _connection_color(i: int, j: int) -> Tuple[int, int, int]:
    """Return color for a skeleton connection segment."""
    if _is_left(i) or _is_left(j):
        return COLOR_LEFT
    elif _is_right(i) or _is_right(j):
        return COLOR_RIGHT
    return COLOR_CENTER


def draw_skeleton(
    frame: np.ndarray,
    raw_xy: np.ndarray,   # (17, 2) pixel coords
    kp_confs: Optional[np.ndarray] = None,  # (17,) confidence
    thickness: int = 2,
    radius: int = 5
) -> np.ndarray:
    """Draw COCO-17 skeleton joints and bones onto the frame (in-place)."""
    h, w = frame.shape[:2]

    # Draw bones
    for (i, j) in SKELETON_CONNECTIONS:
        if i >= len(raw_xy) or j >= len(raw_xy):
            continue
        xi, yi = int(raw_xy[i][0]), int(raw_xy[i][1])
        xj, yj = int(raw_xy[j][0]), int(raw_xy[j][1])
        if xi == 0 and yi == 0:
            continue
        if xj == 0 and yj == 0:
            continue
        conf_i = float(kp_confs[i]) if kp_confs is not None else 1.0
        conf_j = float(kp_confs[j]) if kp_confs is not None else 1.0
        if conf_i < 0.2 or conf_j < 0.2:
            continue
        color = _connection_color(i, j)
        # Glow effect — thick dim outer + bright inner
        cv2.line(frame, (xi, yi), (xj, yj), (color[0]//3, color[1]//3, color[2]//3), thickness * 3)
        cv2.line(frame, (xi, yi), (xj, yj), color, thickness)

    # Draw joints
    for idx in range(len(raw_xy)):
        x, y = int(raw_xy[idx][0]), int(raw_xy[idx][1])
        if x == 0 and y == 0:
            continue
        conf = float(kp_confs[idx]) if kp_confs is not None else 1.0
        if conf < 0.2:
            continue
        if _is_left(idx):
            color = COLOR_LEFT
        elif _is_right(idx):
            color = COLOR_RIGHT
        else:
            color = COLOR_CENTER
        cv2.circle(frame, (x, y), radius + 2, (color[0]//3, color[1]//3, color[2]//3), -1)
        cv2.circle(frame, (x, y), radius, color, -1)
        cv2.circle(frame, (x, y), radius, COLOR_WHITE, 1)

    return frame


def _form_color(score: float) -> Tuple[int, int, int]:
    if score >= 80:
        return COLOR_GOOD
    elif score >= 60:
        return COLOR_WARN
    return COLOR_BAD


def _phase_label(phase: str) -> str:
    labels = {
        "PREPARING": "GET READY",
        "START_POSITION": "START POS",
        "ECCENTRIC": "⬇ LOWER",
        "PEAK_CONTRACTION": "⏸ HOLD",
        "CONCENTRIC": "⬆ PUSH",
        "COMPLETED_REP": "✓ REP DONE",
        "HOLDING": "HOLDING",
        "IDLE": "IDLE"
    }
    return labels.get(phase, phase)


def draw_hud(
    frame: np.ndarray,
    metrics: Dict[str, Any],
    exercise_name: str,
    fps: float,
    confidence: float
) -> np.ndarray:
    """
    Draw a full mobile-optimised HUD overlay on the frame.
    Layout:
      - Top bar: exercise name + FPS chip
      - Bottom panel: reps, set, phase, form score bar
    """
    h, w = frame.shape[:2]

    # ── TOP BAR ──────────────────────────────────────────────────
    bar_h = max(52, int(h * 0.09))
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, bar_h), COLOR_OVERLAY_BG, -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = max(0.5, w / 900)

    # Exercise name
    ex_text = exercise_name.upper()
    cv2.putText(frame, ex_text, (14, bar_h - 14), font, scale * 0.8, COLOR_WHITE, 2, cv2.LINE_AA)

    # FPS chip (top-right)
    fps_text = f"{fps:.0f}fps"
    (fw, fh), _ = cv2.getTextSize(fps_text, font, scale * 0.55, 1)
    fx = w - fw - 14
    cv2.putText(frame, fps_text, (fx, bar_h - 14), font, scale * 0.55, COLOR_DIM, 1, cv2.LINE_AA)

    # Confidence dot
    conf_color = COLOR_GOOD if confidence > 0.6 else (COLOR_WARN if confidence > 0.3 else COLOR_BAD)
    cv2.circle(frame, (w - fw - 32, bar_h - 20), 6, conf_color, -1)

    # ── BOTTOM PANEL ─────────────────────────────────────────────
    panel_h = max(120, int(h * 0.20))
    panel_y = h - panel_h

    overlay2 = frame.copy()
    cv2.rectangle(overlay2, (0, panel_y), (w, h), COLOR_OVERLAY_BG, -1)
    cv2.addWeighted(overlay2, 0.78, frame, 0.22, 0, frame)

    rep_count = metrics.get("currentRep", 0)
    current_set = metrics.get("currentSet", 1)
    phase = metrics.get("currentPhase", "PREPARING")
    form_score = metrics.get("formScore", {}).get("totalScore", 0)
    quality = metrics.get("formScore", {}).get("quality", "")
    phase_progress = metrics.get("phaseProgress", 0)

    # Rep counter (large)
    rep_text = str(rep_count)
    rep_scale = max(1.8, w / 200)
    (rw, rh), _ = cv2.getTextSize(rep_text, font, rep_scale, 3)
    cv2.putText(frame, rep_text, (18, panel_y + rh + 12), font, rep_scale, COLOR_WHITE, 3, cv2.LINE_AA)

    # "REPS" label
    cv2.putText(frame, "REPS", (18, panel_y + rh + 38), font, scale * 0.55, COLOR_DIM, 1, cv2.LINE_AA)

    # Set indicator
    set_text = f"SET {current_set}"
    cv2.putText(frame, set_text, (18 + rw + 18, panel_y + rh + 12), font, scale * 0.7, COLOR_DIM, 1, cv2.LINE_AA)

    # Phase badge (center)
    phase_label = _phase_label(phase)
    (plw, plh), _ = cv2.getTextSize(phase_label, font, scale * 0.7, 2)
    px = (w - plw) // 2
    cv2.putText(frame, phase_label, (px, panel_y + 36), font, scale * 0.7, COLOR_CENTER, 2, cv2.LINE_AA)

    # Form score (right side)
    score_color = _form_color(form_score)
    score_text = f"{form_score:.0f}"
    score_scale = max(1.4, w / 260)
    (sw, sh), _ = cv2.getTextSize(score_text, font, score_scale, 2)
    sx = w - sw - 16
    cv2.putText(frame, score_text, (sx, panel_y + sh + 14), font, score_scale, score_color, 2, cv2.LINE_AA)
    cv2.putText(frame, "FORM", (sx, panel_y + sh + 38), font, scale * 0.55, COLOR_DIM, 1, cv2.LINE_AA)

    # Phase progress bar
    bar_y = h - 10
    bar_w = int(w * phase_progress / 100)
    cv2.rectangle(frame, (0, bar_y - 6), (w, bar_y), (40, 40, 55), -1)
    if bar_w > 0:
        cv2.rectangle(frame, (0, bar_y - 6), (bar_w, bar_y), score_color, -1)

    # Issues text (centre bottom)
    issues = metrics.get("formScore", {}).get("issues", [])
    if issues:
        issue_msg = issues[0].get("message", "")
        if len(issue_msg) > 55:
            issue_msg = issue_msg[:52] + "..."
        (iw, _), _ = cv2.getTextSize(issue_msg, font, scale * 0.5, 1)
        ix = (w - iw) // 2
        cv2.putText(frame, issue_msg, (ix, h - 20), font, scale * 0.5, COLOR_WARN, 1, cv2.LINE_AA)

    return frame


def encode_jpeg(frame: np.ndarray, quality: int = 85) -> bytes:
    """Encode BGR frame to JPEG bytes."""
    ret, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ret:
        return b""
    return buf.tobytes()
