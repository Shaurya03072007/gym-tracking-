import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  ExternalLink,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  QrCode,
  RefreshCw,
  Sparkles,
  SwitchCamera,
  Volume2,
  VolumeX,
  X,
  Zap
} from 'lucide-react';
import QRCode from 'qrcode';
import { EXERCISE_LIBRARY } from '../exercise-engine/exercises';
import { AudioCoach } from '../services/audioCoach';
import { saveWorkoutSession } from '../services/storage';
import { ExerciseDefinition, UserProfile } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkoutCameraPageProps {
  userProfile: UserProfile;
  preselectedExerciseId?: string;
  onNavigateToExercises?: () => void;
}

interface FormScoreData {
  totalScore: number;
  quality: string;
  jointAlignment: number;
  rangeOfMotion: number;
  movementControl: number;
  symmetry: number;
  tempo: number;
  issues: Array<{ severity: string; message: string }>;
  positiveFeedback: string[];
}

interface MetricsData {
  currentRep: number;
  currentSet: number;
  repsCompletedInSet: number;
  currentPhase: string;
  phaseProgress: number;
  repDurationSeconds: number;
  tempo: { eccentric: number; pause: number; concentric: number };
  rangeOfMotionPercent: number;
  formScore: FormScoreData;
  activeSeconds: number;
  isResting: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  PREPARING: 'GET READY',
  START_POSITION: 'START',
  ECCENTRIC: '⬇ LOWER',
  PEAK_CONTRACTION: '⏸ HOLD',
  CONCENTRIC: '⬆ PUSH',
  COMPLETED_REP: '✓ DONE',
  HOLDING: 'HOLDING',
  IDLE: 'IDLE'
};

const PHASE_COLORS: Record<string, string> = {
  PREPARING: '#8888aa',
  START_POSITION: '#aaa8ff',
  ECCENTRIC: '#4dd8e0',
  PEAK_CONTRACTION: '#f5c842',
  CONCENTRIC: '#4aea7c',
  COMPLETED_REP: '#80ff80',
  HOLDING: '#f5c842',
  IDLE: '#8888aa'
};

// ─── Component ────────────────────────────────────────────────────────────────

export const WorkoutCameraPage: React.FC<WorkoutCameraPageProps> = ({
  userProfile,
  preselectedExerciseId = 'squat'
}) => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition>(() =>
    EXERCISE_LIBRARY.find(e => e.id === preselectedExerciseId) || EXERCISE_LIBRARY[0]
  );

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  // Metrics from Python backend
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [coachMessages, setCoachMessages] = useState<Array<{ id: string; severity: string; text: string }>>([]);
  const [latestIssue, setLatestIssue] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  // UI state
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isHudExpanded, setIsHudExpanded] = useState(false);
  const [isExerciseMenuOpen, setIsExerciseMenuOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [pyBackendAvailable, setPyBackendAvailable] = useState<boolean | null>(null);
  const [completedReps, setCompletedReps] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraWsRef = useRef<WebSocket | null>(null);
  const metricsWsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const audioCoachRef = useRef(AudioCoach);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastRepCountRef = useRef(0);


  // ── Audio Coach ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // AudioCoach is a singleton instance
    audioCoachRef.current = AudioCoach;
    return () => {};
  }, []);

  useEffect(() => {
    audioCoachRef.current.setEnabled(!isAudioMuted);
  }, [isAudioMuted]);

  // ── Check Python Backend & Cameras ───────────────────────────────────────────
  useEffect(() => {
    fetch('/api/py/health')
      .then(r => r.json())
      .then(() => setPyBackendAvailable(true))
      .catch(() => setPyBackendAvailable(false));
      
    // Fetch cameras
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        // Prefer back camera initially if label contains back
        const backCam = videoDevices.find(d => d.label.toLowerCase().includes('back'));
        setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
      }
    }).catch(console.error);
  }, []);

  // ── Generate QR Code ─────────────────────────────────────────────────────────
  useEffect(() => {
    const url = `${window.location.protocol}//${window.location.host}`;
    QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#e0e0ff', light: '#0d0d1a' } })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, []);

  // ── Create Python Session ────────────────────────────────────────────────────
  const createSession = useCallback(async (exerciseId: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/py/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: exerciseId })
      });
      if (!res.ok) throw new Error('Backend unavailable');
      const data = await res.json();
      return data.sessionId as string;
    } catch {
      return null;
    }
  }, []);

  // ── Change Exercise on Backend ───────────────────────────────────────────────
  const changeExerciseOnBackend = useCallback(async (sid: string, exerciseId: string) => {
    try {
      await fetch(`/api/py/session/${sid}/exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: exerciseId })
      });
    } catch { /* ignore */ }
  }, []);

  // ── Connect Metrics WebSocket ─────────────────────────────────────────────────
  const connectMetricsWs = useCallback((sid: string) => {
    if (metricsWsRef.current) {
      metricsWsRef.current.close();
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/api/py/ws/metrics/${sid}`);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'metrics') {
          const m = msg.data as MetricsData;
          setMetrics(m);
          setFps(msg.fps ?? 0);

          // Rep completion audio
          if (m.currentRep > lastRepCountRef.current) {
            lastRepCountRef.current = m.currentRep;
            setCompletedReps(m.currentRep);
            audioCoachRef.current?.speak(`Rep ${m.currentRep}`);
          }
        } else if (msg.type === 'coach') {
          const cm = msg.message;
          setCoachMessages(prev => [cm, ...prev].slice(0, 10));
          setLatestIssue(cm.text);
          if (cm.severity === 'WARNING' || cm.severity === 'CORRECTION') {
            audioCoachRef.current?.speak(cm.text);
          }
          setTimeout(() => setLatestIssue(null), 4000);
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => {};
    metricsWsRef.current = ws;
  }, []);

  // ── Start Camera & Streaming ──────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setSessionError(null);
    setStreamReady(false);

    try {
      // 1. Get camera stream
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } }
          : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 2. Create Python session
      const sid = await createSession(selectedExercise.id);
      if (!sid) {
        setSessionError('Python vision backend is not running. Install requirements and restart the server.');
        setIsConnecting(false);
        return;
      }
      setSessionId(sid);
      lastRepCountRef.current = 0;

      // 3. Connect metrics WebSocket
      connectMetricsWs(sid);

      // 4. Connect camera WebSocket and start sending frames
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const cameraWs = new WebSocket(`${proto}//${window.location.host}/api/py/ws/camera/${sid}`);
      cameraWsRef.current = cameraWs;

      cameraWs.onopen = () => {
        setIsCameraActive(true);
        setIsConnecting(false);

        // Send frames at 20 FPS
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const sendFrame = () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || cameraWs.readyState !== WebSocket.OPEN) return;
          
          // Drop frame if WebSocket is backlogged to prevent lag
          // Increased threshold to 350KB since 720p frames are larger
          if (cameraWs.bufferedAmount > 350000) return;

          // Native 720p resolution
          canvas.width = video.videoWidth || 1280; 
          canvas.height = video.videoHeight || 720;
          ctx.save();
          // Mirror front camera
          const isFront = facingMode === 'user' || (selectedCameraId && cameras.find(c => c.deviceId === selectedCameraId)?.label.toLowerCase().includes('front'));
          if (isFront) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          canvas.toBlob(blob => {
            if (blob && cameraWs.readyState === WebSocket.OPEN) {
              blob.arrayBuffer().then(buf => cameraWs.send(buf));
            }
          }, 'image/jpeg', 0.6); // 0.6 quality for 720p
        };

        frameIntervalRef.current = window.setInterval(sendFrame, 100); // 10 FPS
      };

      cameraWs.onerror = () => {
        setSessionError('Connection to vision backend failed.');
        setIsConnecting(false);
      };

      cameraWs.onclose = () => {
        setIsCameraActive(false);
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      };

      // 5. Mark stream as ready after brief delay (allow MJPEG to start)
      setTimeout(() => setStreamReady(true), 800);

    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setSessionError('Camera permission denied. Please allow camera access and try again.');
      } else if (err?.name === 'NotFoundError') {
        setSessionError('No camera found. Please connect a camera and try again.');
      } else {
        setSessionError(`Camera error: ${err?.message || 'Unknown error'}`);
      }
      setIsConnecting(false);
    }
  }, [isConnecting, facingMode, selectedExercise, createSession, connectMetricsWs]);

  // ── Stop Camera ───────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    cameraWsRef.current?.close();
    metricsWsRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cameraWsRef.current = null;
    metricsWsRef.current = null;
    setIsCameraActive(false);
    setStreamReady(false);
    setSessionId(null);
    setMetrics(null);
    setFps(0);
  }, []);

  // ── Flip Camera ───────────────────────────────────────────────────────────────
  const flipCamera = useCallback(async () => {
    let newCameraId = '';
    let newFacingMode = facingMode;

    if (cameras.length > 1) {
      // Find the next camera in the list
      const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      newCameraId = cameras[nextIndex].deviceId;
      setSelectedCameraId(newCameraId);
    } else {
      newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);
    }

    // If currently streaming, seamlessly swap the video track without closing WebSockets
    if (isCameraActive && videoRef.current) {
      try {
        const constraints: MediaStreamConstraints = {
          video: newCameraId 
            ? { deviceId: { exact: newCameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } }
            : { facingMode: newFacingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } },
          audio: false
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Stop old tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        
        // Apply new stream
        streamRef.current = newStream;
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      } catch (err) {
        console.error('Failed to flip camera during stream:', err);
      }
    }
  }, [isCameraActive, cameras, selectedCameraId, facingMode]);

  // ── Exercise change ───────────────────────────────────────────────────────────
  const handleExerciseChange = useCallback(async (ex: ExerciseDefinition) => {
    setSelectedExercise(ex);
    setIsExerciseMenuOpen(false);
    if (sessionId) {
      await changeExerciseOnBackend(sessionId, ex.id);
      lastRepCountRef.current = 0;
      setMetrics(null);
      setCompletedReps(0);
    }
  }, [sessionId, changeExerciseOnBackend]);

  // ── Fullscreen ────────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const formScore = metrics?.formScore?.totalScore ?? 0;
  const quality = metrics?.formScore?.quality ?? '';
  const phase = metrics?.currentPhase ?? 'PREPARING';
  const phaseProgress = metrics?.phaseProgress ?? 0;
  const repCount = metrics?.currentRep ?? 0;
  const currentSet = metrics?.currentSet ?? 1;

  const scoreColor = formScore >= 80 ? '#4aea7c' : formScore >= 60 ? '#f5c842' : '#ff4d6d';
  const phaseColor = PHASE_COLORS[phase] || '#8888aa';

  const streamSrc = sessionId ? `/api/py/stream/${sessionId}` : '';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="workout-camera-root"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Hidden video + canvas for frame capture */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── MAIN DISPLAY ─────────────────────────────────────────────────────── */}
      {streamReady && sessionId ? (
        /* Annotated MJPEG stream from Python backend */
        <img
          ref={imgRef}
          src={streamSrc}
          alt="Pose-annotated workout stream"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
          }}
        />
      ) : isCameraActive && !streamReady ? (
        /* Raw camera preview while stream warms up */
        <video
          ref={el => { if (el && streamRef.current) { el.srcObject = streamRef.current; el.play(); } }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          muted
          playsInline
        />
      ) : (
        /* Idle state */
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #0d1a2e 0%, #060a12 100%)'
        }}>
          <div style={{ textAlign: 'center', padding: '0 32px' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #4a9eff22, #8b5cf622)',
              border: '1.5px solid #4a9eff44',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Camera size={40} color="#4a9eff" />
            </div>
            <h2 style={{ color: '#e8eaf6', fontSize: 22, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Inter', sans-serif" }}>
              FitVision AI
            </h2>
            <p style={{ color: '#7080a0', fontSize: 14, margin: '0 0 32px', lineHeight: 1.5 }}>
              Python YOLO pose engine · {selectedExercise.name}
            </p>

            {/* Backend status indicator */}
            {pyBackendAvailable === false && (
              <div style={{
                background: '#ff4d6d18', border: '1px solid #ff4d6d44',
                borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertTriangle size={14} color="#ff4d6d" />
                  <span style={{ color: '#ff4d6d', fontSize: 13, fontWeight: 600 }}>Python Backend Offline</span>
                </div>
                <p style={{ color: '#ff9999', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  Run in terminal:<br />
                  <code style={{ color: '#ffd6e0', fontFamily: 'monospace', fontSize: 11 }}>
                    pip install -r python_backend/requirements.txt
                  </code><br />
                  then restart the server.
                </p>
              </div>
            )}

            {cameras.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <select
                  value={selectedCameraId}
                  onChange={e => setSelectedCameraId(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', padding: '12px 16px', borderRadius: 12,
                    fontSize: 14, outline: 'none', width: '100%', maxWidth: 300,
                    appearance: 'none', textAlign: 'center', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  {cameras.map((cam, i) => (
                    <option key={cam.deviceId} value={cam.deviceId} style={{ color: '#000' }}>
                      {cam.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
                <div style={{ pointerEvents: 'none', position: 'absolute', right: 0, top: 0 }} />
              </div>
            )}

            {sessionError && (
              <div style={{
                background: '#ff4d6d18', border: '1px solid #ff4d6d44',
                borderRadius: 12, padding: '12px 16px', marginBottom: 24
              }}>
                <p style={{ color: '#ff9999', fontSize: 13, margin: 0 }}>{sessionError}</p>
              </div>
            )}

            <button
              onClick={startCamera}
              disabled={isConnecting}
              style={{
                background: 'linear-gradient(135deg, #4a9eff, #8b5cf6)',
                border: 'none', borderRadius: 16, padding: '16px 48px',
                color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto',
                opacity: isConnecting ? 0.7 : 1,
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 4px 24px #4a9eff44'
              }}
            >
              {isConnecting ? <Loader2 size={20} className="spin" /> : <Zap size={20} />}
              {isConnecting ? 'Connecting…' : 'Start Workout'}
            </button>
          </div>
        </div>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────────────────── */}
      {isCameraActive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: 'env(safe-area-inset-top, 12px) 12px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 20
        }}>
          {/* Exercise selector */}
          <button
            onClick={() => setIsExerciseMenuOpen(v => !v)}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              color: '#fff', padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
            }}
          >
            <Dumbbell size={14} color="#8b5cf6" />
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'left', fontFamily: "'Inter', sans-serif" }}>
              {selectedExercise.name}
            </span>
            <ChevronDown size={14} color="#aaa" />
          </button>

          {/* FPS pill */}
          <div style={{
            background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Activity size={12} color={fps > 12 ? '#4aea7c' : '#f5c842'} />
            <span style={{ fontSize: 11, color: '#ccc', fontFamily: 'monospace' }}>{fps.toFixed(0)}fps</span>
          </div>

          {/* Flip camera */}
          <button
            onClick={flipCamera}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff'
            }}
          >
            <SwitchCamera size={16} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff'
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Stop */}
          <button
            onClick={stopCamera}
            style={{
              background: 'rgba(255,77,109,0.2)', border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: 10, padding: 8, cursor: 'pointer', color: '#ff4d6d'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── EXERCISE PICKER DROPDOWN ──────────────────────────────────────────── */}
      {isExerciseMenuOpen && (
        <div
          onClick={() => setIsExerciseMenuOpen(false)}
          style={{ position: 'absolute', inset: 0, zIndex: 40 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 64, left: 12, right: 12,
              background: 'rgba(10,14,28,0.97)', backdropFilter: 'blur(24px)',
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)',
              maxHeight: '55vh', overflowY: 'auto', zIndex: 41, padding: '8px 0'
            }}
          >
            {EXERCISE_LIBRARY.map(ex => (
              <button
                key={ex.id}
                onClick={() => handleExerciseChange(ex)}
                style={{
                  width: '100%', background: ex.id === selectedExercise.id ? 'rgba(139,92,246,0.2)' : 'transparent',
                  border: 'none', padding: '12px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: ex.id === selectedExercise.id ? '3px solid #8b5cf6' : '3px solid transparent'
                }}
              >
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ color: '#e8eaf6', fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    {ex.name}
                  </div>
                  <div style={{ color: '#7080a0', fontSize: 11, marginTop: 2 }}>
                    {ex.category} · {ex.difficulty}
                  </div>
                </div>
                {ex.id === selectedExercise.id && <Check size={14} color="#8b5cf6" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── BOTTOM HUD ───────────────────────────────────────────────────────── */}
      {isCameraActive && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          background: isHudExpanded
            ? 'rgba(6,10,24,0.95)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          backdropFilter: isHudExpanded ? 'blur(20px)' : 'none',
          transition: 'all 0.3s ease',
          zIndex: 20
        }}>
          {/* Phase progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${phaseProgress}%`,
              background: phaseColor,
              transition: 'width 0.15s ease, background 0.3s ease',
              boxShadow: `0 0 8px ${phaseColor}`
            }} />
          </div>

          {/* Main metrics row */}
          <div
            style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}
            onClick={() => setIsHudExpanded(v => !v)}
          >
            {/* Reps (large) */}
            <div style={{ textAlign: 'center', minWidth: 72 }}>
              <div style={{
                fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1,
                fontFamily: "'Inter', sans-serif"
              }}>
                {repCount}
              </div>
              <div style={{ fontSize: 10, color: '#7080a0', letterSpacing: 2, textTransform: 'uppercase' }}>
                reps · set {currentSet}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.1)' }} />

            {/* Phase + Form */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `${phaseColor}22`, border: `1px solid ${phaseColor}55`,
                borderRadius: 8, padding: '4px 10px', marginBottom: 6
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: phaseColor }} />
                <span style={{ color: phaseColor, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                  {PHASE_LABELS[phase] || phase}
                </span>
              </div>

              {/* Form score bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 6, background: 'rgba(255,255,255,0.1)',
                  borderRadius: 3, overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', width: `${formScore}%`,
                    background: `linear-gradient(to right, ${scoreColor}, ${scoreColor}cc)`,
                    borderRadius: 3, transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor, minWidth: 30, textAlign: 'right' }}>
                  {formScore.toFixed(0)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#7080a0', marginTop: 2 }}>Form Score</div>
            </div>

            {/* Audio + expand toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={e => { e.stopPropagation(); setIsAudioMuted(v => !v); }}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff'
                }}
              >
                {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <div style={{ color: '#7080a0', display: 'flex', justifyContent: 'center' }}>
                {isHudExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>
          </div>

          {/* Expanded HUD panel */}
          {isHudExpanded && metrics && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Tempo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Lower', val: metrics.tempo.eccentric, color: '#4dd8e0' },
                  { label: 'Hold', val: metrics.tempo.pause, color: '#f5c842' },
                  { label: 'Push', val: metrics.tempo.concentric, color: '#4aea7c' }
                ].map(t => (
                  <div key={t.label} style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 10,
                    padding: '8px 10px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.color }}>
                      {t.val.toFixed(1)}s
                    </div>
                    <div style={{ fontSize: 10, color: '#7080a0', marginTop: 2 }}>{t.label}</div>
                  </div>
                ))}
              </div>

              {/* Form score breakdown */}
              <div style={{ marginTop: 12 }}>
                {[
                  { label: 'Joint Alignment', val: metrics.formScore.jointAlignment, max: 25 },
                  { label: 'Range of Motion', val: metrics.formScore.rangeOfMotion, max: 25 },
                  { label: 'Movement Control', val: metrics.formScore.movementControl, max: 20 },
                  { label: 'Symmetry', val: metrics.formScore.symmetry, max: 15 },
                  { label: 'Tempo', val: metrics.formScore.tempo, max: 15 }
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#9090b0', width: 120, flexShrink: 0 }}>{item.label}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(item.val / item.max) * 100}%`,
                        background: item.val / item.max >= 0.8 ? '#4aea7c' : item.val / item.max >= 0.6 ? '#f5c842' : '#ff4d6d',
                        borderRadius: 2
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#ccc', width: 30, textAlign: 'right' }}>
                      {item.val.toFixed(0)}/{item.max}
                    </span>
                  </div>
                ))}
              </div>

              {/* Latest issues */}
              {metrics.formScore.issues.length > 0 && (
                <div style={{
                  marginTop: 10, background: 'rgba(255,77,109,0.08)',
                  border: '1px solid rgba(255,77,109,0.2)', borderRadius: 10, padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={12} color="#ff4d6d" />
                    <span style={{ fontSize: 11, color: '#ff4d6d', fontWeight: 600 }}>Form Issues</span>
                  </div>
                  {metrics.formScore.issues.slice(0, 2).map((issue, i) => (
                    <p key={i} style={{ fontSize: 11, color: '#ff9999', margin: '4px 0 0', lineHeight: 1.4 }}>
                      {issue.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Positive feedback */}
              {metrics.formScore.positiveFeedback.length > 0 && (
                <div style={{
                  marginTop: 8, background: 'rgba(74,234,124,0.06)',
                  border: '1px solid rgba(74,234,124,0.15)', borderRadius: 10, padding: '8px 12px'
                }}>
                  {metrics.formScore.positiveFeedback.slice(0, 2).map((fb, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Sparkles size={10} color="#4aea7c" />
                      <span style={{ fontSize: 11, color: '#80ffb0' }}>{fb}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── COACH NOTIFICATION TOAST ─────────────────────────────────────────── */}
      {latestIssue && isCameraActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(6,10,24,0.92)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(245,200,66,0.3)',
          borderRadius: 16, padding: '14px 20px',
          maxWidth: '80%', textAlign: 'center', zIndex: 30,
          animation: 'fadeInOut 4s ease forwards'
        }}>
          <p style={{ color: '#f5c842', fontSize: 14, margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
            {latestIssue}
          </p>
        </div>
      )}

      {/* ── QR / SHARE BUTTON ────────────────────────────────────────────────── */}
      {!isCameraActive && (
        <button
          onClick={() => setShowQr(v => !v)}
          style={{
            position: 'absolute', bottom: 32, right: 20,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, padding: '10px 14px',
            color: '#aaa', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
          }}
        >
          <QrCode size={16} /> Scan on phone
        </button>
      )}

      {/* QR Modal */}
      {showQr && (
        <div
          onClick={() => setShowQr(false)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d1a2e', borderRadius: 20, padding: 28,
              border: '1px solid rgba(74,158,255,0.3)', textAlign: 'center',
              maxWidth: 300
            }}
          >
            <p style={{ color: '#e8eaf6', fontSize: 14, fontWeight: 600, margin: '0 0 16px', fontFamily: "'Inter', sans-serif" }}>
              Open on your phone
            </p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 12 }} />
            )}
            <p style={{ color: '#7080a0', fontSize: 11, margin: '12px 0 0' }}>
              {window.location.host}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
};
