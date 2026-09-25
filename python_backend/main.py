"""
main.py — FastAPI server for the Python Vision Backend
Endpoints:
  POST /session/create              → create session, get session_id
  GET  /session/{id}/info           → session info
  POST /session/{id}/exercise       → change active exercise
  WS   /ws/camera/{session_id}      → phone sends JPEG frames here
  WS   /ws/metrics/{session_id}     → phone receives JSON metrics here
  GET  /stream/{session_id}         → MJPEG annotated video stream
  GET  /health                      → health check
"""

import sys
import os
import asyncio
import json
import queue
import threading
import time
from typing import Optional

# Ensure local modules are importable
sys.path.insert(0, os.path.dirname(__file__))

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from session_manager import session_manager, GymSession
from pose_engine import process_frame_bytes
from canvas_draw import draw_skeleton, draw_hud, encode_jpeg
from exercises import EXERCISE_MAP, EXERCISE_LIBRARY

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="FitVision Python Vision Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── REST Endpoints ───────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    exercise_id: Optional[str] = "squat"


class ChangeExerciseRequest(BaseModel):
    exercise_id: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "FitVision Python Vision Backend", "version": "2.0.0"}


@app.get("/exercises")
async def list_exercises():
    return {"exercises": [
        {
            "id": ex["id"],
            "name": ex["name"],
            "category": ex["category"],
            "difficulty": ex["difficulty"],
            "cameraAngle": ex["cameraAngle"]
        }
        for ex in EXERCISE_LIBRARY
    ]}


@app.post("/session/create")
async def create_session(body: CreateSessionRequest):
    session = session_manager.create_session(body.exercise_id or "squat")
    return {
        "sessionId": session.session_id,
        "exerciseId": session.exercise_id,
        "streamUrl": f"/stream/{session.session_id}",
        "cameraWsPath": f"/ws/camera/{session.session_id}",
        "metricsWsPath": f"/ws/metrics/{session.session_id}"
    }


@app.get("/session/{session_id}/info")
async def session_info(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_info()


@app.post("/session/{session_id}/exercise")
async def change_exercise(session_id: str, body: ChangeExerciseRequest):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if body.exercise_id not in EXERCISE_MAP:
        raise HTTPException(status_code=400, detail=f"Unknown exercise: {body.exercise_id}")
    session.change_exercise(body.exercise_id)
    return {"status": "ok", "exerciseId": body.exercise_id}


# ─── MJPEG Stream ─────────────────────────────────────────────────────────────

async def _mjpeg_generator(session: GymSession):
    """Async generator that yields MJPEG frames from the session's latest annotated JPEG."""
    boundary = b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
    boundary_end = b"\r\n"

    # Send a placeholder while waiting for first frame
    while True:
        jpeg = session.latest_annotated_jpeg
        if jpeg:
            yield boundary + jpeg + boundary_end
        await asyncio.sleep(0.033)  # ~30 FPS cap


@app.get("/stream/{session_id}")
async def mjpeg_stream(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return StreamingResponse(
        _mjpeg_generator(session),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


# ─── Camera WebSocket ─────────────────────────────────────────────────────────

def _process_frame_sync(session: GymSession, jpeg_bytes: bytes):
    """Run in a thread pool — CPU-bound YOLO inference."""
    try:
        frame, pose = process_frame_bytes(jpeg_bytes)
        if frame is None or pose is None:
            return

        exercise = session.state_machine.exercise
        exercise_name = exercise["name"]

        # Run state machine update with BlazePose-33 keypoints
        metrics = session.state_machine.update(pose.blazepose_kps)
        metrics_dict = metrics.to_dict()

        # Draw skeleton
        if pose.detected and len(pose.raw_xy) > 0:
            # Try to get confidence array from pose
            kp_confs = None
            if pose.coco_kps:
                kp_confs = np.array([
                    kp.visibility if kp is not None else 0.0
                    for kp in pose.coco_kps
                ], dtype=np.float32)
            draw_skeleton(frame, pose.raw_xy, kp_confs)

        # Draw HUD
        draw_hud(frame, metrics_dict, exercise_name, session.fps, pose.confidence)

        # Encode and push
        annotated = encode_jpeg(frame, quality=80)
        session.push_annotated_frame(annotated)
        session.push_metrics(metrics_dict)

    except Exception as e:
        print(f"[PoseEngine] Error processing frame: {e}", flush=True)


@app.websocket("/ws/camera/{session_id}")
async def camera_ws(websocket: WebSocket, session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    loop = asyncio.get_event_loop()

    print(f"[WS Camera] Session {session_id} connected", flush=True)

    try:
        while True:
            # Receive JPEG frame bytes from mobile
            data = await websocket.receive_bytes()
            session.last_activity = time.time()

            # Process in thread pool to avoid blocking async loop
            await loop.run_in_executor(None, _process_frame_sync, session, data)

    except WebSocketDisconnect:
        print(f"[WS Camera] Session {session_id} disconnected", flush=True)
    except Exception as e:
        print(f"[WS Camera] Error in session {session_id}: {e}", flush=True)


# ─── Metrics WebSocket ────────────────────────────────────────────────────────

@app.websocket("/ws/metrics/{session_id}")
async def metrics_ws(websocket: WebSocket, session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    q: queue.Queue = queue.Queue(maxsize=30)
    session.add_metrics_ws_queue(q)

    print(f"[WS Metrics] Session {session_id} connected", flush=True)

    try:
        while True:
            # Non-blocking poll of the queue, yield to event loop if empty
            try:
                msg = q.get_nowait()
                await websocket.send_text(json.dumps(msg))
            except queue.Empty:
                await asyncio.sleep(0.016)  # ~60 Hz polling

            # Check for disconnect ping
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
            except (asyncio.TimeoutError, Exception):
                pass

    except WebSocketDisconnect:
        print(f"[WS Metrics] Session {session_id} disconnected", flush=True)
    except Exception as e:
        print(f"[WS Metrics] Error in session {session_id}: {e}", flush=True)
    finally:
        session.remove_metrics_ws_queue(q)


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        log_level="info",
        workers=1
    )
