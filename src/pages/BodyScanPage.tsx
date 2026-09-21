import React, { useState } from 'react';
import {
  ScanLine,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';

interface BodyScanPageProps {
  userProfile: UserProfile;
}

interface AnalysisResult {
  observations: string[];
  bodyProportions: string;
  mobilityRecommendations: string[];
  disclaimer: string;
}

export const BodyScanPage: React.FC<BodyScanPageProps> = ({ userProfile }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [viewAngle, setViewAngle] = useState<'front' | 'side' | 'back'>('front');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!photoPreview) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/body/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: photoPreview,
          angle: viewAngle,
          userProfile
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to analyze photo. Ensure Gemini API key is set.');
        return;
      }

      setResult({
        observations: data.observations || [],
        bodyProportions: data.bodyProportions || 'No proportion analysis returned.',
        mobilityRecommendations: data.mobilityRecommendations || [],
        disclaimer:
          data.disclaimer ||
          'MANDATORY DISCLAIMER: Photographic analysis provides approximate visual posture observations only. It does NOT measure clinical body fat percentage, DEXA metrics, or diagnose orthopedic conditions. Consult a qualified physical therapist or doctor for medical evaluations.'
      });
    } catch (e: any) {
      setErrorMessage('Network or server error while analyzing image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center space-x-3">
          <ScanLine className="h-8 w-8 text-emerald-400 stroke-[2.2]" />
          <span>Biomechanical Posture & Proportion Scan</span>
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl">
          Upload an athletic standing photo to analyze posture symmetry, thoracic alignment, and limb proportions for personalized lifting mechanics.
        </p>
      </div>

      {/* Mandatory Non-Diagnostic Disclaimer */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-amber-400 font-mono">
            Mandatory Clinical Disclaimer
          </span>
          <p className="text-amber-200/90 leading-relaxed">
            Photographic posture analysis provides optical geometric estimates. It does NOT and CANNOT replace clinical DEXA body composition scans, hydrostatic weighing, or professional orthopedic assessment. Do not base medical decisions on photographic scans.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        {/* Angle Selection */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-neutral-400 font-mono uppercase">Perspective:</span>
          {(['front', 'side', 'back'] as const).map((angle) => (
            <button
              key={angle}
              onClick={() => setViewAngle(angle)}
              className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition-colors ${
                viewAngle === angle
                  ? 'bg-emerald-500 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {angle} View
            </button>
          ))}
        </div>

        {/* Dropzone */}
        {!photoPreview ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950/60 p-10 text-center hover:border-emerald-500/50 transition-colors"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-white">Drag & drop your athletic photo here</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Wear fitted athletic clothing and stand with arms relaxed by your sides. JPEG or PNG up to 15MB.
            </p>

            <label className="mt-4 cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
              Browse From Device
              <input
                id="body-photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
              <img
                src={photoPreview}
                alt="Posture preview"
                className="h-80 w-full object-contain"
              />
              <button
                onClick={clearPhoto}
                className="absolute top-2 right-2 rounded-lg bg-neutral-900/90 p-2 text-neutral-400 hover:text-red-400 backdrop-blur-md"
                title="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={clearPhoto}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Change Photo
              </button>
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isAnalyzing ? 'Analyzing Biomechanics...' : 'Run Posture Analysis'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-300 font-mono uppercase tracking-wider">Analysis Notice</p>
              <p className="text-neutral-300">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {result && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Optical Posture Findings</h2>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase font-mono text-neutral-400">
              Visual Alignment Observations
            </h3>
            <ul className="space-y-2">
              {result.observations.map((obs, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300 flex items-start space-x-2"
                >
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase font-mono text-neutral-400">
              Limb-to-Torso Lever Arm Insights
            </h3>
            <p className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300">
              {result.bodyProportions}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase font-mono text-emerald-400">
              Corrective Mobility Protocols
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.mobilityRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-neutral-300"
                >
                  <span className="font-bold text-emerald-300 block mb-1">Protocol {idx + 1}</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end">
            <button
              onClick={clearPhoto}
              className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Photo from Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
