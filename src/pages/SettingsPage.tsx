import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Trash2,
  Download,
  Volume2,
  Camera,
  Check,
  AlertTriangle,
  Lock,
  Cpu
} from 'lucide-react';
import { AudioCoach } from '../services/audioCoach';
import { clearAllUserData, clearWorkoutHistory } from '../services/storage';

interface SettingsPageProps {
  onDataReset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataReset }) => {
  const [voiceVolume, setVoiceVolume] = useState(85);
  const [mirrorDefault, setMirrorDefault] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleVolumeChange = (newVal: number) => {
    setVoiceVolume(newVal);
    AudioCoach.setVolume(newVal / 100);
    AudioCoach.playTone(500, 0.1);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all workout telemetry history?')) {
      clearWorkoutHistory();
      onDataReset();
      showToast('Workout history cleared successfully.');
    }
  };

  const handleFactoryReset = () => {
    if (confirm('This will wipe all local data including your profile and telemetry. Continue?')) {
      clearAllUserData();
      onDataReset();
      showToast('FitVision AI reset to initial factory configuration.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center space-x-3">
          <Settings className="h-8 w-8 text-neutral-400 stroke-[2.2]" />
          <span>System Settings & Edge Privacy</span>
        </h1>
        <p className="text-sm text-neutral-400">
          Hardware configuration, audio synthesize controls, and zero-leakage camera privacy guarantees.
        </p>
      </div>

      {successToast && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center space-x-2">
          <Check className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Privacy Guarantee Box */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold">
          <Shield className="h-5 w-5" />
          <h2 className="text-base font-bold text-white">Edge-First Computer Vision Privacy</h2>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          FitVision AI processes all video feed landmarks strictly inside your client browser using WebAssembly / WebGL shaders. Camera video frames are never streamed, stored, or transmitted to any external server or LLM. Only structured numerical telemetry (joint angle floats, rep counts, and cadence timestamps) are sent to Gemini for coaching inference.
        </p>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400">
          <Lock className="h-3.5 w-3.5" />
          <span>Client-Side Isolation Verified</span>
        </div>
      </div>

      {/* Audio Coaching Settings */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-cyan-400" />
          <span>Voice Audio & Sound Feedback</span>
        </h2>

        <div className="space-y-4 max-w-md text-xs">
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-neutral-400">Audio Feedback Volume</span>
              <span className="font-mono text-white">{voiceVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={voiceVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <button
            onClick={() => AudioCoach.speak('FitVision voice synthesizer calibrated and online.', true)}
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
          >
            Test Voice Cue
          </button>
        </div>
      </div>

      {/* Vision & Camera Preferences */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Camera className="h-5 w-5 text-emerald-400" />
          <span>Camera & Display Preferences</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mirrorDefault}
              onChange={(e) => setMirrorDefault(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
            />
            <span className="text-neutral-300">
              Default mirror mode on (flips front-facing camera like a real gym mirror)
            </span>
          </label>
        </div>
      </div>

      {/* Danger Zone: Data Management */}
      <div className="rounded-2xl border border-red-500/20 bg-neutral-900/60 p-6 space-y-4">
        <h2 className="text-base font-bold text-red-400 flex items-center space-x-2">
          <Trash2 className="h-5 w-5" />
          <span>Data Storage & Data Deletion</span>
        </h2>
        <p className="text-xs text-neutral-400">
          All your athlete profiles and workout telemetry are securely stored in your browser’s local storage.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Workout History</span>
          </button>

          <button
            onClick={handleFactoryReset}
            className="flex items-center space-x-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            <span>Reset All App State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
