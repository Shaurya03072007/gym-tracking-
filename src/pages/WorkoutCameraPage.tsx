import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Play,
  Square,
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  Zap,
  Info,
  ChevronDown,
  Activity,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EXERCISE_LIBRARY } from '../exercise-engine/exercises';
import { ExerciseStateMachine, RepCompletedEvent } from '../exercise-engine/state-machine';
import { CanvasRenderer } from '../pose-engine/CanvasRenderer';
import { MediaPipePoseProvider } from '../pose-engine/MediaPipePoseProvider';
import { SimulatedPoseProvider } from '../pose-engine/SimulatedPoseProvider';
import { IVisionProvider } from '../pose-engine/VisionProvider';
import { AudioCoach } from '../services/audioCoach';
import { saveWorkoutSession } from '../services/storage';
import { CoachingMessage, ExerciseDefinition, FormScoreBreakdown, LiveWorkoutMetrics, UserProfile } from '../types';

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

  // Providers & State Machine
  const [providerType, setProviderType] = useState<'mediapipe' | 'simulation'>('simulation');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fps, setFps] = useState(0);

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
  const completedRepsRef = useRef<RepCompletedEvent[]>([]);

  // Rest Timer Interval
  useEffect(() => {
    if (restTimerSeconds === null) return;
    if (restTimerSeconds <= 0) {
      AudioCoach.playTone(880, 0.3);
      AudioCoach.speak('Rest time complete. Get ready for your next set!');
      setRestTimerSeconds(null);
      return;
    }
    const timer = setInterval(() => {
      setRestTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [restTimerSeconds]);

  // Initialize State Machine
  useEffect(() => {
    const sm = new ExerciseStateMachine(selectedExercise);
    
    sm.onRepComplete((event: RepCompletedEvent) => {
      completedRepsRef.current.push(event);
      AudioCoach.playRepCompleteChime();

      // Trigger server-side Gemini structured cue in background
      fetch('/api/coach/form-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.rawEventForGemini)
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.cue) {
            AudioCoach.speak(data.cue);
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
        AudioCoach.playWarningTone();
        setLatestIssue(msg.text);
      } else {
        setLatestIssue(null);
      }
      AudioCoach.speak(msg.text);
    });

    stateMachineRef.current = sm;
    completedRepsRef.current = [];

    return () => {
      stateMachineRef.current = null;
    };
  }, [selectedExercise]);

  // Setup Vision Provider
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
            console.warn('Falling back to Simulated Biomechanics Engine');
            setProviderType('simulation');
          }
        }
      } else {
        const sim = new SimulatedPoseProvider();
        if (selectedExercise.id.includes('squat')) sim.setExerciseType('squat');
        else if (selectedExercise.id.includes('pushup')) sim.setExerciseType('pushup');
        else if (selectedExercise.id.includes('curl')) sim.setExerciseType('curl');
        else if (selectedExercise.id.includes('press')) sim.setExerciseType('press');
        else if (selectedExercise.id.includes('plank')) sim.setExerciseType('plank');
        else sim.setExerciseType('squat');

        await sim.initialize();
        if (active) {
          visionProviderRef.current = sim;
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

  // Camera stream setup
  const startWebcam = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Webcam is not supported on this device/browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsWebcamActive(true);
        AudioCoach.speak('Camera active. FitVision biometric skeleton tracking is running.');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      alert('Camera access denied or unavailable. You can use the Biomechanical Simulation mode to explore tracking and coaching!');
      setProviderType('simulation');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  // Main 60 FPS Render & Biomechanics Loop
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

      if (canvas && sm && provider) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!rendererRef.current) {
            rendererRef.current = new CanvasRenderer(ctx);
          }

          const width = canvas.width;
          const height = canvas.height;
          rendererRef.current.clear(width, height);

          // Get pose from provider
          const inputTarget = isWebcamActive && video && video.readyState >= 2 ? video : canvas;
          const pose = await provider.estimatePose(inputTarget);

          if (pose.detected && pose.landmarks.length >= 29) {
            // Update state machine
            const currentMetrics = sm.update(pose.landmarks);
            setMetrics(currentMetrics);

            // Render skeleton
            rendererRef.current.render(
              pose.landmarks,
              width,
              height,
              currentMetrics.formScore.quality,
              currentMetrics.currentJointAngles,
              selectedExercise.primaryJointAngle,
              isMirrored
            );
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
  }, [isWebcamActive, isMirrored, selectedExercise]);

  const handleFinishSet = () => {
    if (!stateMachineRef.current) return;
    const reps = metrics?.currentRep || 0;
    if (reps === 0) return;

    // Confetti celebration if solid form
    const avgScore = metrics?.formScore.totalScore || 85;
    if (avgScore >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    AudioCoach.speak(`Set completed! You completed ${reps} reps with an average form score of ${avgScore}. Starting 60 second recovery timer.`);

    // Save session to history
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
      AudioCoach.speak('Rep counter reset.');
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6" ref={containerRef}>
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        {/* Exercise Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-neutral-400">Target Movement</span>
            <div className="relative">
              <select
                id="exercise-select-dropdown"
                value={selectedExercise.id}
                onChange={(e) => {
                  const found = EXERCISE_LIBRARY.find((ex) => ex.id === e.target.value);
                  if (found) {
                    setSelectedExercise(found);
                    AudioCoach.speak(`Target exercise changed to ${found.name}. ${found.cameraAngle} camera placement recommended.`);
                  }
                }}
                className="w-56 sm:w-64 appearance-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 pr-8 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {EXERCISE_LIBRARY.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* Engine Provider Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-neutral-800 bg-neutral-950 p-1">
            <button
              id="mode-simulation-btn"
              onClick={() => {
                setProviderType('simulation');
                stopWebcam();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                providerType === 'simulation'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Simulated Kinematics
            </button>
            <button
              id="mode-mediapipe-btn"
              onClick={() => {
                setProviderType('mediapipe');
                startWebcam();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                providerType === 'mediapipe'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Live Webcam Pose
            </button>
          </div>

          {/* Camera On/Off */}
          {providerType === 'mediapipe' && (
            <button
              id="toggle-webcam-btn"
              onClick={isWebcamActive ? stopWebcam : startWebcam}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isWebcamActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>{isWebcamActive ? 'Stop Camera' : 'Start Camera'}</span>
            </button>
          )}

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
            title="Toggle fullscreen"
            className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Safety Warning Banner (If severe flaw detected) */}
      {latestIssue && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-red-300">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-red-400">Biomechanics Safety Alert</p>
              <p className="text-sm font-medium">{latestIssue}</p>
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">Pause & reset posture</span>
        </div>
      )}

      {/* Main Grid: Live HUD & Video + AI Coaching Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Viewport (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            {/* Live Video element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${
                isMirrored ? 'scale-x-[-1]' : ''
              } ${isWebcamActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Synthetic Kinematics Background (when simulated) */}
            {!isWebcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900/80 via-neutral-950 to-neutral-950">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
                <div className="z-10 text-center px-4">
                  <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400 mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Real-time Kinematics Active</span>
                  </div>
                  <p className="text-sm text-neutral-400 max-w-sm">
                    Rendering 33-point anatomical joint kinematics for {selectedExercise.name}. Connect a webcam anytime to track your own real body!
                  </p>
                </div>
              </div>
            )}

            {/* Canvas Biometric Overlay */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 h-full w-full object-cover z-20 pointer-events-none"
            />

            {/* Live Overlay HUD: Top-Left Rep Counter */}
            <div className="absolute top-4 left-4 z-30 flex items-center space-x-3 pointer-events-auto">
              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/85 backdrop-blur-md px-4 py-2.5 shadow-xl">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                  {selectedExercise.isIsometric ? 'Hold Time' : 'Reps Count'}
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                    {metrics?.currentRep ?? 0}
                  </span>
                  <span className="text-xs font-medium text-emerald-400 font-mono">
                    Set {metrics?.currentSet ?? 1}
                  </span>
                </div>
              </div>

              {/* Rep Phase Pill */}
              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/85 backdrop-blur-md px-3.5 py-2 shadow-xl">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                  Phase
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    {metrics?.currentPhase.replace('_', ' ') || 'READY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Top-Right: Form Score & FPS */}
            <div className="absolute top-4 right-4 z-30 flex items-center space-x-2 pointer-events-auto">
              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/85 backdrop-blur-md px-3.5 py-2 text-right shadow-xl">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                  Live Form
                </span>
                <div className="flex items-center space-x-1 justify-end">
                  <span
                    className={`text-2xl font-black font-mono ${
                      (metrics?.formScore.totalScore || 90) >= 80
                        ? 'text-emerald-400'
                        : (metrics?.formScore.totalScore || 90) >= 60
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {metrics?.formScore.totalScore ?? 92}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">/100</span>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/85 px-2.5 py-2 text-[10px] font-mono text-neutral-400 backdrop-blur-md">
                {fps} FPS
              </div>
            </div>

            {/* Bottom HUD: Range of Motion & Tempo */}
            <div className="absolute bottom-4 inset-x-4 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-auto">
              {/* Range of Motion Progress Bar */}
              <div className="flex-1 rounded-xl border border-neutral-800/90 bg-neutral-950/85 backdrop-blur-md px-4 py-2.5 shadow-xl">
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-neutral-400">Range of Motion (ROM)</span>
                  <span className="font-bold text-white">{metrics?.phaseProgress ?? 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, metrics?.phaseProgress ?? 0)}%` }}
                  />
                </div>
              </div>

              {/* Tempo Meter */}
              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/85 backdrop-blur-md px-4 py-2 text-xs font-mono shadow-xl flex items-center space-x-4">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Eccentric</span>
                  <span className="font-bold text-emerald-400">{metrics?.tempo.eccentric || 0}s</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Pause</span>
                  <span className="font-bold text-cyan-400">{metrics?.tempo.pause || 0}s</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Concentric</span>
                  <span className="font-bold text-white">{metrics?.tempo.concentric || 0}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Controls: Finish Set, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center space-x-2">
              <button
                id="finish-set-btn"
                onClick={handleFinishSet}
                className="flex items-center space-x-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                <span>Complete Set & Rest</span>
              </button>

              <button
                id="reset-set-btn"
                onClick={handleResetSet}
                className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Count</span>
              </button>
            </div>

            {/* Rest Timer Banner */}
            {restTimerSeconds !== null && (
              <div className="flex items-center space-x-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-cyan-300">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-xs font-mono font-bold">
                  Rest Timer: {restTimerSeconds}s
                </span>
                <button
                  onClick={() => setRestTimerSeconds(null)}
                  className="text-[11px] underline ml-2 text-neutral-400 hover:text-white"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Biomechanics Breakdown & AI Coaching Feed (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Biomechanical Form Scoring Breakdown (0 - 100) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono">
                Biomechanical Breakdown
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {metrics?.formScore.quality || 'GOOD FORM'}
              </span>
            </div>

            {/* Sub-scores */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Joint Alignment</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore.jointAlignment ?? 24} / 25
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${((metrics?.formScore.jointAlignment ?? 24) / 25) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Range of Motion</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore.rangeOfMotion ?? 23} / 25
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${((metrics?.formScore.rangeOfMotion ?? 23) / 25) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Movement Control</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore.movementControl ?? 19} / 20
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${((metrics?.formScore.movementControl ?? 19) / 20) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Bilateral Symmetry</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore.symmetry ?? 14} / 15
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${((metrics?.formScore.symmetry ?? 14) / 15) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-400">Tempo Adherence</span>
                <span className="font-mono font-bold text-white">
                  {metrics?.formScore.tempo ?? 14} / 15
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${((metrics?.formScore.tempo ?? 14) / 15) * 100}%` }}
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

          {/* AI Personal Coach Live Speech Cues Feed */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono">
                  AI Coach Audio Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">Auto TTS</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {coachingLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500">
                  Perform a repetition to hear real-time voice coaching cues.
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

          {/* Biomechanical Checklist for Active Exercise */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-neutral-300 font-bold uppercase font-mono">
              <Info className="h-4 w-4 text-emerald-400" />
              <span>Form Cues & Camera Placement</span>
            </div>
            <p className="text-neutral-400">
              <strong className="text-neutral-200">Recommended Camera:</strong> {selectedExercise.cameraAngle} view.
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              {selectedExercise.checklist?.slice(0, 3).map((cue: string, idx: number) => (
                <li key={idx}>{cue}</li>
              )) || (
                <li>Maintain neutral spine and controlled eccentric cadence</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
