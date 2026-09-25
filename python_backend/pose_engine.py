"""
pose_engine.py — YOLOv8n-pose inference engine
Loads the YOLO model once at startup and runs CPU inference on JPEG frames.
Outputs 17 COCO keypoints normalized to [0,1].
"""

import io
import numpy as np
import cv2
from typing import List, Optional, Tuple
from biomechanics import LandmarkPoint, coco_to_blazepose

# Lazy-load YOLO so the import is only triggered when the module is first used
_yolo_model = None


def get_model():
    global _yolo_model
    if _yolo_model is None:
        from ultralytics import YOLO
        _yolo_model = YOLO("yolov8n-pose.pt")  # auto-downloads ~6MB on first run
    return _yolo_model


class PoseResult:
    """Holds keypoints in COCO-17 format + BlazePose-33 mapped format."""
    def __init__(
        self,
        coco_kps: List[Optional[LandmarkPoint]],  # 17 pts
        blazepose_kps: List[Optional[LandmarkPoint]],  # 33 pts (sparse)
        confidence: float,
        detected: bool,
        frame_width: int,
        frame_height: int,
        raw_xy: np.ndarray  # shape (17, 2) in pixel coords for drawing
    ):
        self.coco_kps = coco_kps
        self.blazepose_kps = blazepose_kps
        self.confidence = confidence
        self.detected = detected
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.raw_xy = raw_xy

    def to_landmarks_dict(self) -> List[Optional[dict]]:
        """Serialize BlazePose keypoints for JSON output."""
        out = []
        for kp in self.blazepose_kps:
            if kp is None:
                out.append(None)
            else:
                out.append({
                    "x": kp.x,
                    "y": kp.y,
                    "z": kp.z,
                    "visibility": kp.visibility
                })
        return out


def decode_jpeg(jpeg_bytes: bytes) -> Optional[np.ndarray]:
    """Decode JPEG bytes to a BGR numpy array."""
    try:
        arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return frame
    except Exception:
        return None


def run_inference(frame: np.ndarray) -> PoseResult:
    """
    Run YOLOv8n-pose on a BGR frame.
    Returns normalized keypoints in both COCO-17 and BlazePose-33 layouts.
    """
    h, w = frame.shape[:2]
    model = get_model()

    results = model(
        frame,
        verbose=False,
        conf=0.3,
        device="cpu",
        half=False
    )

    # Extract first detected person (highest confidence)
    best_conf = 0.0
    best_kps_xy = None
    best_kps_conf = None

    for result in results:
        if result.keypoints is None:
            continue
        kps = result.keypoints
        if kps.xy is None or len(kps.xy) == 0:
            continue

        boxes = result.boxes
        if boxes is not None and len(boxes.conf) > 0:
            confs = boxes.conf.cpu().numpy()
            idx = int(np.argmax(confs))
            person_conf = float(confs[idx])
        else:
            idx = 0
            person_conf = 0.5

        if person_conf > best_conf:
            best_conf = person_conf
            xy = kps.xy.cpu().numpy()   # (N, 17, 2) pixel coords
            conf_kps = kps.conf.cpu().numpy() if kps.conf is not None else np.ones((len(xy), 17))
            best_kps_xy = xy[idx]       # (17, 2)
            best_kps_conf = conf_kps[idx]  # (17,)

    if best_kps_xy is None or best_conf < 0.3:
        return PoseResult(
            coco_kps=[None] * 17,
            blazepose_kps=[None] * 33,
            confidence=0.0,
            detected=False,
            frame_width=w,
            frame_height=h,
            raw_xy=np.zeros((17, 2), dtype=np.float32)
        )

    # Normalize keypoints to [0, 1]
    coco_kps: List[Optional[LandmarkPoint]] = []
    for i in range(17):
        px, py = best_kps_xy[i]
        vis = float(best_kps_conf[i]) if best_kps_conf is not None else 1.0
        if vis < 0.2 or (px == 0 and py == 0):
            coco_kps.append(None)
        else:
            coco_kps.append(LandmarkPoint(
                x=float(px) / w,
                y=float(py) / h,
                z=0.0,
                visibility=vis
            ))

    blazepose_kps = coco_to_blazepose(coco_kps)

    return PoseResult(
        coco_kps=coco_kps,
        blazepose_kps=blazepose_kps,
        confidence=best_conf,
        detected=True,
        frame_width=w,
        frame_height=h,
        raw_xy=best_kps_xy
    )


def process_frame_bytes(jpeg_bytes: bytes) -> Tuple[Optional[np.ndarray], Optional[PoseResult]]:
    """
    Full pipeline: decode JPEG → run YOLO → return (frame_bgr, pose_result).
    Returns (None, None) if decoding fails.
    """
    frame = decode_jpeg(jpeg_bytes)
    if frame is None:
        return None, None
    pose = run_inference(frame)
    return frame, pose
