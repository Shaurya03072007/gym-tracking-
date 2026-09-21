import React, { useState } from 'react';
import {
  Search,
  Filter,
  Camera,
  Info,
  AlertCircle,
  Dumbbell,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { EXERCISE_LIBRARY } from '../exercise-engine/exercises';
import { ExerciseCategory, ExerciseDefinition } from '../types';

interface ExerciseLibraryPageProps {
  onSelectExerciseToTrack: (exerciseId: string) => void;
}

export const ExerciseLibraryPage: React.FC<ExerciseLibraryPageProps> = ({
  onSelectExerciseToTrack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [activeModalExercise, setActiveModalExercise] = useState<ExerciseDefinition | null>(null);

  const categories = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio/Full Body'];
  const equipments = ['All', 'Bodyweight', 'Dumbbells', 'Barbell', 'Bands'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredExercises = EXERCISE_LIBRARY.filter((ex) => {
    const matchesSearch =
      !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscles.some((m: string) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesEquip = selectedEquipment === 'All' || ex.equipment === selectedEquipment;
    const matchesDiff = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;

    return matchesSearch && matchesCat && matchesEquip && matchesDiff;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Biomechanical Exercise Library
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl">
          Comprehensive scientific database of 31+ strength and conditioning movements with calibrated joint angles, form scoring rules, and camera perspective guidance.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
          <input
            id="exercise-search-input"
            type="text"
            placeholder="Search exercises by name or muscle (e.g. Squat, Chest, Biceps, Lats)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-t border-neutral-800 pt-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Equipment & Difficulty Dropdowns */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-neutral-400">Equipment:</span>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-white focus:outline-none"
            >
              {equipments.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-neutral-400">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-white focus:outline-none"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <span className="text-neutral-500 ml-auto font-mono">
            Showing {filteredExercises.length} of {EXERCISE_LIBRARY.length} exercises
          </span>
        </div>
      </div>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 hover:border-neutral-700 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wide">
                    {exercise.category}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {exercise.name}
                  </h3>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                    exercise.difficulty === 'Beginner'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : exercise.difficulty === 'Intermediate'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}
                >
                  {exercise.difficulty}
                </span>
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2">
                {exercise.instructions[0] || 'High performance movement tracked with joint angle metrics.'}
              </p>

              {/* Muscles & Equipment */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target Muscles:</span>
                  <span className="text-neutral-300 font-medium">{exercise.targetMuscles.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Camera Angle:</span>
                  <span className="text-neutral-300 font-mono">{exercise.cameraAngle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target ROM:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {exercise.startAngle}° → {exercise.peakAngle}°
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveModalExercise(exercise)}
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center space-x-1"
              >
                <Info className="h-3.5 w-3.5" />
                <span>Form Rules</span>
              </button>

              <button
                onClick={() => onSelectExerciseToTrack(exercise.id)}
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/15"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Launch Camera</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Rules Detail Modal */}
      {activeModalExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
                  Biomechanical Specification
                </span>
                <h2 className="text-xl font-bold text-white">{activeModalExercise.name}</h2>
              </div>
              <button
                onClick={() => setActiveModalExercise(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Primary Angles */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Primary Joint:</span>
                  <span className="text-white font-bold">{activeModalExercise.primaryJointAngle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Lockout / Start:</span>
                  <span className="text-white">{activeModalExercise.startAngle}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Inflection / Peak:</span>
                  <span className="text-emerald-400 font-bold">{activeModalExercise.peakAngle}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Recommended View:</span>
                  <span className="text-cyan-400 font-bold">{activeModalExercise.cameraAngle}</span>
                </div>
              </div>

              {/* Execution Instructions */}
              <div className="space-y-2">
                <h4 className="font-bold text-neutral-200 uppercase font-mono text-[11px]">Step-by-Step Execution</h4>
                <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                  {activeModalExercise.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              </div>

              {/* Biomechanical Rules Checked by AI */}
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-400 uppercase font-mono text-[11px]">AI Real-Time Verification Checklist</h4>
                <div className="space-y-2">
                  {(activeModalExercise.checklist || []).map((cue: string, idx: number) => (
                    <div key={idx} className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-neutral-300">{cue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="space-y-2">
                <h4 className="font-bold text-red-400 uppercase font-mono text-[11px]">Common Biomechanical Errors</h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-400">
                  {activeModalExercise.commonMistakes.map((mistake, idx) => (
                    <li key={idx}>{mistake}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setActiveModalExercise(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = activeModalExercise.id;
                  setActiveModalExercise(null);
                  onSelectExerciseToTrack(id);
                }}
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Launch Camera Tracking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
