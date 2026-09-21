import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Info,
  ChevronDown,
  Activity,
  SwitchCamera,
  Smartphone,
  Radio,
  Share2,
  Copy,
  Check,
  Zap,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EXERCISE_LIBRARY } from '../exercise-engine/exercises';
import { ExerciseStateMachine, RepCompletedEvent } from '../exercise-engine/state-machine';
import { CanvasRenderer } from '../pose-engine/CanvasRenderer';
import { MediaPipePoseProvider } from '../pose-engine/MediaPipePoseProvider';
import { SystemStreamVisionProvider } from '../pose-engine/SystemStreamVisionProvider';
import { IVisionProvider } from '../pose-engine/VisionProvider';
import { AudioCoach } from '../services/audioCoach';
import { saveWorkoutSession } from '../services/storage';
import { CoachingMessage, ExerciseDefinition, LiveWorkoutMetrics, UserProfile } from '../types';

interface WorkoutCameraPageProps {
  userProfile: UserProfile;
  preselectedExerciseId?: string;
  onNavigateToExercises?: () => void;
}

export const WorkoutCameraPage: React.FC<WorkoutCameraPageProps> = ({
  userProfile,
  preselectedExerciseId = 'squat'
}) => {
  // Active Exercise
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition>(() => {
    return EXERCISE_LIBRARY.find((e) => e.id === preselectedExerciseId) || EXERCISE_LIBRARY[0];
  });

  // Providers & State Machine (PURE REAL CAMERA - NO SIMULATIONS)
  const [providerType, setProviderType] = useState<'mediapipe' | 'system-stream'>('mediapipe');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [fps, setFps] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Athlete framing status (detected from real camera landmarks)
  const [framingStatus, setFramingStatus] = useState<'none' | 'partial' | 'locked'>('none');

  // Gym Session Stream Relay (Camera feed sent to system, system streams back)
  const [gymSessionCode, setGymSessionCode] = useState<string | null>(null);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  // Live Metrics
  const [metrics, setMetrics] = useState<LiveWorkoutMetrics | null>(null);
  const [coachingLogs, setCoachingLogs] = useState<CoachingMessage[]>([]);
  const [latestIssue, setLatestIssue] = useState<string | null>(null);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [completedSetsCount, setCompletedSetsCount] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateMachineRef = useRef<ExerciseStateMachine | null>(null);
  const visionProviderRef = useRef<IVisionProvider | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const lastSystemStreamSyncRef = useRef<number>(0);
  const completedRepsRef = useRef<RepCompletedEvent[]>([]);

  // Rest Timer Interval
  useEffect(() => {
    if (restTimerSeconds === null) return;
    if (restTimerSeconds <= 0) {
      if (!isAudioMuted) {
        AudioCoach.playTone(880, 0.3);
        AudioCoach.speak('Rest time complete. Get ready for your next set!');
      }
      setRestTimerSeconds(null);
      return;
    }
    const timer = setInterval(() => {
      setRestTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [restTimerSeconds, isAudioMuted]);

  // Initialize State Machine
  useEffect(() => {
    const sm = new ExerciseStateMachine(selectedExercise);

    sm.onRepComplete((event: RepCompletedEvent) => {
      completedRepsRef.current.push(event);
      if (!isAudioMuted) {
        AudioCoach.playRepCompleteChime();
      }

      // Stream repetition biometric event to server-side Gemini coach
      fetch('/api/coach/form-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.rawEventForGemini)
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.cue) {
            if (!isAudioMuted) {
              AudioCoach.speak(data.cue);
            }
            setCoachingLogs((prev) => [
              {
                id: `gemini-${Date.now()}`,
                timestamp: Date.now(),
                severity: data.severity || 'INFO',
                text: data.cue,
                exercise: selectedExercise.name,
                repNumber: event.repNumber
              },
              ...prev.slice(0, 8)
            ]);
          }
        })
        .catch(() => {
          // fallback audio already triggered
        });
    });

    sm.onCoachMessage((msg: CoachingMessage) => {
      setCoachingLogs((prev) => [msg, ...prev.slice(0, 8)]);
      if (msg.severity === 'WARNING') {
        if (!isAudioMuted) AudioCoach.playWarningTone();
        setLatestIssue(msg.text);
      } else {
        setLatestIssue(null);
      }
      if (!isAudioMuted) {
        AudioCoach.speak(msg.text);
      }
    });

    stateMachineRef.current = sm;
    completedRepsRef.current = [];

    return () => {
      stateMachineRef.current = null;
    };
  }, [selectedExercise, isAudioMuted]);

  // Setup Vision Provider (Real-time MediaPipe GPU or FitVision AI System Stream)
  useEffect(() => {
    let active = true;

    async function initProvider() {
      if (visionProviderRef.current) {
        visionProviderRef.current.dispose();
      }

      if (providerType === 'mediapipe') {
        const mp = new MediaPipePoseProvider();
        const success = await mp.initialize();
        if (active) {
          if (success) {
            visionProviderRef.current = mp;
          } else {
            console.warn('Switching to FitVision AI System Stream pipeline');
            const sys = new SystemStreamVisionProvider();
            sys.setExercise(selectedExercise.id);
            await sys.initialize();
            visionProviderRef.current = sys;
            setProviderType('system-stream');
          }
        }
      } else {
        const sys = new SystemStreamVisionProvider();
        sys.setExercise(selectedExercise.id);
        await sys.initialize();
        if (active) {
          visionProviderRef.current = sys;
        }
      }
    }

    initProvider();

    return () => {
      active = false;
      if (visionProviderRef.current) {
        visionProviderRef.current.dispose();
        visionProviderRef.current = null;
      }
    };
  }, [providerType, selectedExercise]);

  // Camera lifecycle (Optimized for Mobile Gym Tracking)
  const startWebcam = async (targetFacing?: 'user' | 'environment') => {
    try {
      const mode = targetFacing || facingMode;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Webcam is not accessible in this environment. Please enable camera access.');
        return;
      }
      setCameraError(null);

      // Stop existing tracks if switching
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsWebcamActive(true);
        setFacingMode(mode);
        setIsMirrored(mode === 'user');

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        setTorchSupported(Boolean(capabilities?.torch));

        if (!isAudioMuted) {
          AudioCoach.speak(`Gym camera active. Step back 6-8 feet to calibrate.`);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied. Please grant camera permissions in your browser settings.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setIsTorchOn(false);
    setFramingStatus('none');
  };

  const flipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    startWebcam(nextFacing);
  };

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (track && torchSupported) {
      const nextTorch = !isTorchOn;
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setIsTorchOn(nextTorch);
      } catch (err) {
        console.warn('Could not toggle torch:', err);
      }
    }
  };

  // Create or sync Gym Remote Session
  const createGymSession = async () => {
    try {
      const res = await fetch('/api/gym/session/create', { method: 'POST' });
      const data = await res.json();
      if (data && data.code) {
        setGymSessionCode(data.code);
        setShowPairingModal(true);
      }
    } catch (e) {
      console.error('Failed to create gym session:', e);
    }
  };

  // Main Biomechanics & Canvas Rendering Loop (Consumes REAL camera only)
  useEffect(() => {
    let isRunning = true;

    const loop = async () => {
      if (!isRunning) return;

      const now = Date.now();
      const delta = now - lastFrameTimeRef.current;
      if (delta > 0) {
        setFps(Math.round(1000 / delta));
      }
      lastFrameTimeRef.current = now;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const sm = stateMachineRef.current;
      const provider = visionProviderRef.current;

      if (canvas && sm && provider && isWebcamActive && video && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!rendererRef.current) {
            rendererRef.current = new CanvasRenderer(ctx);
          }

          const width = canvas.width;
          const height = canvas.height;
          rendererRef.current.clear(width, height);

          // Get pose from REAL video element
          const pose = await provider.estimatePose(video);

          if (pose.detected && pose.landmarks.length >= 29) {
            // Check athlete full body framing
            const nose = pose.landmarks[0];
            const leftAnkle = pose.landmarks[27];
            const rightAnkle = pose.landmarks[28];
            const leftHip = pose.landmarks[23];
            const rightHip = pose.landmarks[24];

            const hasHead = nose && (nose.visibility ?? 1) > 0.35;
            const hasFeet = (leftAnkle && (leftAnkle.visibility ?? 1) > 0.35) || (rightAnkle && (rightAnkle.visibility ?? 1) > 0.35);
            const hasHips = (leftHip && (leftHip.visibility ?? 1) > 0.35) || (rightHip && (rightHip.visibility ?? 1) > 0.35);

            if (hasHead && hasFeet && hasHips) {
              setFramingStatus('locked');
            } else if (hasHead || hasHips) {
              setFramingStatus('partial');
            } else {
              setFramingStatus('none');
            }

            // Update state machine with verified biometric angles
            const currentMetrics = sm.update(pose.landmarks);
            setMetrics(currentMetrics);

            // Render live AI lines (skeleton vector connections) and AI points (joint landmark circles)
            rendererRef.current.render(
              pose.landmarks,
              width,
              height,
              currentMetrics.formScore.quality,
              currentMetrics.currentJointAngles,
              selectedExercise.primaryJointAngle,
              isMirrored
            );

            // Stream telemetry to system session if active (every 400ms)
            if (gymSessionCode && now - lastSystemStreamSyncRef.current > 400) {
              lastSystemStreamSyncRef.current = now;
              fetch(`/api/gym/session/${gymSessionCode}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  exerciseId: selectedExercise.id,
                  telemetry: {
                    reps: currentMetrics.currentRep,
                    phase: currentMetrics.currentPhase,
                    formScore: currentMetrics.formScore.totalScore,
                    quality: currentMetrics.formScore.quality,
                    angles: currentMetrics.currentJointAngles
                  }
                })
              }).catch(() => {});
            }
          } else {
            setFramingStatus('none');
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWebcamActive, isMirrored, selectedExercise, gymSessionCode]);

  const handleFinishSet = () => {
    if (!stateMachineRef.current) return;
    const reps = metrics?.currentRep || 0;
    if (reps === 0) return;

    const avgScore = metrics?.formScore.totalScore || 85;
    if (avgScore >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    if (!isAudioMuted) {
      AudioCoach.speak(`Set completed! ${reps} reps with ${avgScore} form score. Take 60 seconds rest.`);
    }

    saveWorkoutSession({
      id: `session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      sets: [
        {
          setNumber: completedSetsCount + 1,
          reps,
          averageFormScore: avgScore,
          durationSeconds: metrics?.activeSeconds || 35,
          tempoAvg: `${metrics?.tempo.eccentric || 2}s / ${metrics?.tempo.concentric || 1}s`
        }
      ],
      totalReps: reps,
      totalDurationSeconds: metrics?.activeSeconds || 35,
      averageFormScore: avgScore,
      issuesEncountered: metrics?.formScore.issues.map((i) => i.message) || []
    });

    setCompletedSetsCount((prev) => prev + 1);
    setRestTimerSeconds(60);
    stateMachineRef.current.nextSet();
  };

  const handleResetSet = () => {
    if (stateMachineRef.current) {
      stateMachineRef.current.reset();
      if (!isAudioMuted) AudioCoach.speak('Rep counter reset.');
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6" ref={containerRef}>
      {/* Top Mobile-Optimized Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/80 p-3 sm:p-4 backdrop-blur-sm">
        {/* Exercise Selector */}
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-neutral-400 block leading-tight">Gym Movement</span>
            <div className="relative mt-0.5">
              <select
                id="exercise-select-dropdown"
                value={selectedExercise.id}
                onChange={(e) => {
                  const found = EXERCISE_LIBRARY.find((ex) => ex.id === e.target.value);
                  if (found) {
                    setSelectedExercise(found);
                    if (!isAudioMuted) {
                      AudioCoach.speak(`Target exercise: ${found.name}. Place phone for ${found.cameraAngle} view.`);
                    }
                  }
                }}
                className="w-48 sm:w-60 appearance-none rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 pr-7 text-xs sm:text-sm font-bold text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {EXERCISE_LIBRARY.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* Vision Engine & Camera Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Engine Selector */}
          <div className="flex rounded-lg border border-neutral-800 bg-neutral-950 p-1">
            <button
              id="engine-mediapipe-btn"
              onClick={() => setProviderType('mediapipe')}
              title="MediaPipe GPU High-FPS Neural Tracker"
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                providerType === 'mediapipe'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              On-Device GPU
            </button>
            <button
              id="engine-system-stream-btn"
              onClick={() => setProviderType('system-stream')}
              title="FitVision AI System Cloud Processing Stream"
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                providerType === 'system-stream'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              System Stream
            </button>
          </div>

          {/* Camera Start / Stop Button */}
          <button
            id="toggle-webcam-btn"
            onClick={isWebcamActive ? stopWebcam : () => startWebcam()}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isWebcamActive
                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 font-bold'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>{isWebcamActive ? 'Stop' : 'Start Camera'}</span>
          </button>

          {/* Quick Lens Switcher (Front Selfie / Rear Gym Floor) */}
          {isWebcamActive && (
            <button
              id="flip-camera-btn"
              onClick={flipCamera}
              title={`Switch to ${facingMode === 'user' ? 'Rear (Gym)' : 'Front (Selfie)'} Camera`}
              className="flex items-center space-x-1 p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold"
            >
              <SwitchCamera className="h-4 w-4 text-emerald-400" />
              <span className="hidden md:inline">{facingMode === 'user' ? 'Front' : 'Rear'}</span>
            </button>
          )}

          {/* Torch toggle if available on mobile */}
          {isWebcamActive && torchSupported && (
            <button
              onClick={toggleTorch}
              title="Toggle flashlight torch"
              className={`p-2 rounded-lg border text-xs ${
                isTorchOn
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400'
              }`}
            >
              <Zap className="h-4 w-4" />
            </button>
          )}

          {/* Gym Session Code Relay button */}
          <button
            id="gym-pair-btn"
            onClick={createGymSession}
            title="Stream Camera Feed to System / Pair Devices"
            className="flex items-center space-x-1 p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium"
          >
            <Radio className={`h-4 w-4 ${gymSessionCode ? 'text-emerald-400 animate-pulse' : 'text-neutral-400'}`} />
            <span className="hidden sm:inline">{gymSessionCode ? `Session #${gymSessionCode}` : 'Pair Feed'}</span>
          </button>

          {/* Audio Coach Mute */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Unmute Audio Coach' : 'Mute Audio Coach'}
            className={`p-2 rounded-lg border text-xs font-medium ${
              isAudioMuted
                ? 'border-neutral-800 bg-neutral-900 text-neutral-500'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Mirror & Fullscreen */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            id="toggle-mirror-btn"
            title="Mirror canvas horizontally"
            className={`p-2 rounded-lg border text-xs font-medium ${
              isMirrored
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-neutral-800 bg-neutral-900 text-neutral-400'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            id="toggle-fullscreen-btn"
            title="Toggle fullscreen gym HUD"
            className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Safety Warning Banner (If severe flaw detected) */}
      {latestIssue && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-300">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Biomechanics Safety Alert</p>
              <p className="text-xs sm:text-sm font-semibold">{latestIssue}</p>
            </div>
          </div>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">Pause & correct posture</span>
        </div>
      )}

      {/* Camera Error Notice if permissions denied */}
      {cameraError && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-xs sm:text-sm flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300">Camera Access Required</p>
            <p className="mt-1 text-neutral-300">{cameraError}</p>
            <button
              onClick={() => startWebcam()}
              className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Live Camera HUD & Video + AI Coaching Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left / Center Viewport (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video sm:aspect-[16/10] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            {/* Live Camera Video element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${
                isMirrored ? 'scale-x-[-1]' : ''
              } ${isWebcamActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Inactive Camera State: Dedicated Mobile Gym Launcher (NO SIMULATION) */}
            {!isWebcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Mobile Gym Camera Ready
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mt-1.5 mb-6">
                  Prop your phone against a water bottle or gym bench 6-8 feet away. Real AI lines, joint points, and rep counts will stream live over your camera feed.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                  <button
                    id="activate-mobile-camera-btn"
                    onClick={() => startWebcam('user')}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3.5 px-6 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/25 cursor-pointer"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Start Front Camera (Selfie)</span>
                  </button>

                  <button
                    id="activate-rear-camera-btn"
                    onClick={() => startWebcam('environment')}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl border border-neutral-700 bg-neutral-800/80 py-3.5 px-6 text-sm font-bold text-white hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    <SwitchCamera className="h-5 w-5 text-emerald-400" />
                    <span>Start Rear Camera</span>
                  </button>
                </div>

                <div className="mt-5 flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Real Biometric Tracking • Zero Simulated Data • Headphone Audio Ready</span>
                </div>
              </div>
            )}

            {/* Canvas Biometric Overlay (Draws Real AI Skeleton Lines, Joint Points, and Angle Badges) */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 h-full w-full object-cover z-20 pointer-events-none"
            />

            {/* Athlete Distance & Calibration Status Banner */}
            {isWebcamActive && (
              <div className="absolute top-3 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
                {framingStatus === 'locked' ? (
                  <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/40 bg-neutral-950/85 backdrop-blur-md px-3.5 py-1 text-xs font-mono font-bold text-emerald-400 shadow-xl">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>✓ Athlete Full Body Locked — Tracking {selectedExercise.name}</span>
                  </div>
                ) : framingStatus === 'partial' ? (
                  <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/40 bg-neutral-950/85 backdrop-blur-md px-3.5 py-1 text-xs font-mono font-bold text-amber-300 shadow-xl">
                    <Target className="h-3.5 w-3.5 text-amber-400" />
                    <span>Step back 2-3 ft to bring feet and hips into view</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 rounded-full border border-neutral-800 bg-neutral-950/85 backdrop-blur-md px-3.5 py-1 text-xs font-mono text-neutral-400 shadow-xl">
                    <Radio className="h-3.5 w-3.5 text-neutral-500 animate-pulse" />
                    <span>Position phone 6-8 ft away. Step into camera view.</span>
                  </div>
                )}
              </div>
            )}

            {/* Live Overlay HUD: Reps Counter (Large font for Gym distance viewing) */}
            {isWebcamActive && (
              <div className="absolute top-12 sm:top-14 left-3 sm:left-4 z-30 flex flex-col space-y-2 pointer-events-auto">
                <div className="rounded-2xl border border-neutral-800/90 bg-neutral-950/90 backdrop-blur-md px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xl">
                  <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                    {selectedExercise.isIsometric ? 'Hold Time' : 'Reps Count'}
                  </span>
                  <div className="flex items-baseline space-x-2.5 mt-0.5">
                    <span className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono leading-none">
                      {metrics?.currentRep ?? 0}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                      Set {metrics?.currentSet ?? 1}
                    </span>
                  </div>
                </div>

                {/* Rep Phase Pill */}
                <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/90 backdrop-blur-md px-3.5 py-1.5 shadow-xl w-fit">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] sm:text-xs font-black text-emerald-300 uppercase font-mono tracking-wide">
                      {metrics?.currentPhase.replace('_', ' ') || 'CALIBRATING'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top-Right: Form Quality Score & Live Stream Indicator */}
            {isWebcamActive && (
              <div className="absolute top-12 sm:top-14 right-3 sm:right-4 z-30 flex items-center space-x-2 pointer-events-auto">
                <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/90 backdrop-blur-md px-3.5 py-2 text-right shadow-xl">
                  <span className="text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider block">
                    Form Score
                  </span>
                  <div className="flex items-center space-x-1 justify-end mt-0.5">
                    <span
                      className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                        metrics?.formScore?.totalScore
                          ? metrics.formScore.totalScore >= 80
                            ? 'text-emerald-400'
                            : metrics.formScore.totalScore >= 60
                            ? 'text-amber-400'
                            : 'text-red-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      {metrics?.formScore?.totalScore ? metrics.formScore.totalScore : '--'}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">/100</span>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/90 px-2.5 py-2 text-[10px] font-mono text-neutral-400 backdrop-blur-md flex flex-col items-center">
                  <span className="text-emerald-400 font-bold">{fps}</span>
                  <span className="text-[9px] text-neutral-500">FPS</span>
                </div>
              </div>
            )}

            {/* Bottom HUD: Range of Motion & Cadence */}
            {isWebcamActive && (
              <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-auto">
                {/* Range of Motion Progress Bar */}
                <div className="flex-1 rounded-xl border border-neutral-800/90 bg-neutral-950/90 backdrop-blur-md px-3.5 py-2 shadow-xl">
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-neutral-400 text-[11px]">ROM Arc ({selectedExercise.primaryJointAngle})</span>
                    <span className="font-bold text-emerald-400">{metrics?.phaseProgress ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                      style={{ width: `${Math.min(100, metrics?.phaseProgress ?? 0)}%` }}
                    />
                  </div>
                </div>

                {/* Tempo Cadence Meter */}
                <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/90 backdrop-blur-md px-3 py-1.5 text-xs font-mono shadow-xl flex items-center justify-around sm:space-x-4">
                  <div>
                    <span className="text-[9px] text-neutral-400 block">Down</span>
                    <span className="font-bold text-emerald-400">{metrics?.tempo.eccentric || 0}s</span>
                  </div>
                  <div className="border-l border-neutral-800 pl-3">
                    <span className="text-[9px] text-neutral-400 block">Pause</span>
                    <span className="font-bold text-cyan-400">{metrics?.tempo.pause || 0}s</span>
                  </div>
                  <div className="border-l border-neutral-800 pl-3">
                    <span className="text-[9px] text-neutral-400 block">Up</span>
                    <span className="font-bold text-white">{metrics?.tempo.concentric || 0}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Controls: Finish Set, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/80 p-3 sm:p-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                id="finish-set-btn"
                onClick={handleFinishSet}
                disabled={!isWebcamActive || (metrics?.currentRep ?? 0) === 0}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all shadow-lg ${
                  isWebcamActive && (metrics?.currentRep ?? 0) > 0
                    ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                <span>Complete Set ({metrics?.currentRep ?? 0} reps)</span>
              </button>

              <button
                id="reset-set-btn"
                onClick={handleResetSet}
                disabled={!isWebcamActive}
                className="flex items-center space-x-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset Set</span>
              </button>
            </div>

            {/* Rest Timer Banner */}
            {restTimerSeconds !== null && (
              <div className="flex items-center space-x-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-cyan-300 text-xs font-mono font-bold">
                <Clock className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Rest Recovery: {restTimerSeconds}s</span>
                <button
                  onClick={() => setRestTimerSeconds(null)}
                  className="text-[11px] underline ml-2 text-neutral-400 hover:text-white cursor-pointer"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Biomechanics Breakdown & AI Coaching Feed (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Biomechanical Form Scoring Breakdown */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono">
                Biomechanics Telemetry
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {metrics?.formScore.quality || 'READY TO TRACK'}
              </span>
            </div>

            {/* Sub-scores */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Joint Alignment</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore ? `${metrics.formScore.jointAlignment} / 25` : '-- / 25'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${metrics?.formScore ? (metrics.formScore.jointAlignment / 25) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Range of Motion</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore ? `${metrics.formScore.rangeOfMotion} / 25` : '-- / 25'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${metrics?.formScore ? (metrics.formScore.rangeOfMotion / 25) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Eccentric Control</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore ? `${metrics.formScore.movementControl} / 20` : '-- / 20'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${metrics?.formScore ? (metrics.formScore.movementControl / 20) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Bilateral Symmetry</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore ? `${metrics.formScore.symmetry} / 15` : '-- / 15'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${metrics?.formScore ? (metrics.formScore.symmetry / 15) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Cadence & Tempo</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore ? `${metrics.formScore.tempo} / 15` : '-- / 15'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${metrics?.formScore ? (metrics.formScore.tempo / 15) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Positive cues */}
            {metrics?.formScore.positiveFeedback && metrics.formScore.positiveFeedback.length > 0 && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{metrics.formScore.positiveFeedback[0]}</span>
              </div>
            )}
          </div>

          {/* AI Personal Coach Audio Log */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono">
                  Live Coach Audio Cues
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                {isAudioMuted ? 'Muted' : 'Earbuds Active'}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {coachingLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500">
                  Perform repetitions in front of the camera to receive live spoken voice coaching cues.
                </div>
              ) : (
                coachingLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-lg border p-2.5 text-xs transition-all ${
                      log.severity === 'WARNING'
                        ? 'border-red-500/40 bg-red-500/10 text-red-300'
                        : log.severity === 'CORRECTION'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-neutral-400">
                      <span>{log.exercise}</span>
                      <span>Rep #{log.repNumber ?? 1}</span>
                    </div>
                    <p className="font-medium">{log.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form Cues & Setup Advice for Active Exercise */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-neutral-300 font-bold uppercase font-mono">
              <Info className="h-4 w-4 text-emerald-400" />
              <span>Mobile Gym Setup Guide</span>
            </div>
            <p className="text-neutral-400">
              <strong className="text-neutral-200">Angle:</strong> {selectedExercise.cameraAngle} perspective. Prop phone 6-8 feet away.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              {selectedExercise.checklist?.slice(0, 3).map((cue: string, idx: number) => (
                <li key={idx}>{cue}</li>
              )) || (
                <li>Keep neutral spine and controlled descent</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Gym Remote Session Pairing Modal */}
      {showPairingModal && gymSessionCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Gym Live Stream Relay</h3>
                  <p className="text-xs text-neutral-400">Camera feed connects to system</p>
                </div>
              </div>
              <button
                onClick={() => setShowPairingModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-center space-y-2">
              <span className="text-xs font-mono uppercase text-neutral-400">4-Digit Gym Session Code</span>
              <div className="text-4xl font-black font-mono tracking-widest text-emerald-400">
                {gymSessionCode}
              </div>
              <p className="text-[11px] text-neutral-400">
                Camera feed from this phone is streaming to the FitVision AI System. Open FitVision on another screen to watch the live feed with AI lines and telemetry simultaneously.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gymSessionCode);
                  setHasCopiedCode(true);
                  setTimeout(() => setHasCopiedCode(false), 2000);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-neutral-700 bg-neutral-800 py-2.5 text-xs font-bold text-white hover:bg-neutral-700"
              >
                {hasCopiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{hasCopiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={() => setShowPairingModal(false)}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
