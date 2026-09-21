import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Award,
  Calendar,
  Download,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { UserProfile, WorkoutSessionRecord } from '../types';

interface ProgressPageProps {
  userProfile: UserProfile;
  workoutHistory: WorkoutSessionRecord[];
  onStartExercise?: (exerciseId: string) => void;
  onNavigate?: (tab: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  userProfile,
  workoutHistory,
  onStartExercise,
  onNavigate
}) => {
  const totalSessions = workoutHistory.length;
  const totalSets = workoutHistory.reduce((acc, w) => acc + w.sets.length, 0);
  const totalReps = workoutHistory.reduce((acc, w) => acc + w.totalReps, 0);
  const avgFormScore =
    totalSessions > 0
      ? Math.round(workoutHistory.reduce((acc, w) => acc + w.averageFormScore, 0) / totalSessions)
      : 0;

  // Real chart data for Form Score Progression
  const formScoreData = workoutHistory
    .slice()
    .reverse()
    .map((w, idx) => ({
      session: `S${idx + 1} (${w.date ? w.date.slice(5) : ''})`,
      formScore: w.averageFormScore,
      exercise: w.exerciseName
    }));

  // Real Volume Data (Reps per session)
  const volumeData = workoutHistory
    .slice()
    .reverse()
    .map((w, idx) => ({
      session: `S${idx + 1}`,
      reps: w.totalReps,
      durationMinutes: Math.round(w.totalDurationSeconds / 60) || 1,
      exercise: w.exerciseName
    }));

  const handleExportData = () => {
    const exportPayload = {
      profile: userProfile,
      history: workoutHistory,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitvision_telemetry_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Biomechanical Progress & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Longitudinal telemetry tracking form quality score, training volume, and movement stability.
          </p>
        </div>

        {totalSessions > 0 && (
          <button
            onClick={handleExportData}
            id="export-telemetry-btn"
            className="flex items-center justify-center space-x-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors w-full sm:w-auto"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export Telemetry JSON</span>
          </button>
        )}
      </div>

      {/* 3 Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1">
          <span className="text-[11px] sm:text-xs font-mono text-neutral-400">Average Biomechanical Score</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {totalSessions > 0 ? avgFormScore : '--'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-emerald-300">
            {totalSessions > 0
              ? `Calculated across ${totalSessions} verified session${totalSessions === 1 ? '' : 's'}`
              : 'Awaiting your first camera workout'}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1">
          <span className="text-[11px] sm:text-xs font-mono text-neutral-400">Total Exercise Sets Verified</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
              {totalSets}
            </span>
            <span className="text-xs text-neutral-500 font-mono">sets ({totalReps} reps)</span>
          </div>
          <p className="text-[11px] text-neutral-400">60 FPS edge joint tracking</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1">
          <span className="text-[11px] sm:text-xs font-mono text-neutral-400">Target Weight Adherence</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{userProfile.weightKg}</span>
            <span className="text-xs text-neutral-500 font-mono">kg (Goal: {userProfile.targetWeightKg}kg)</span>
          </div>
          <p className="text-[11px] text-purple-300 capitalize">
            {userProfile.primaryGoal.replace('_', ' ')} phase
          </p>
        </div>
      </div>

      {/* Empty State when no workouts recorded yet */}
      {totalSessions === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-white">No Telemetry Recorded Yet</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Launch a live camera workout to begin collecting 60 FPS 3D joint telemetry, repetition counts, range of motion depth, and form scores.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => {
                if (onStartExercise) onStartExercise('squat');
                else if (onNavigate) onNavigate('workout');
              }}
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Launch Live Workout Camera</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Two Column Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Score Trend Chart */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Form Quality Score Trend</span>
                  </h3>
                  <p className="text-xs text-neutral-400">Joint angles, tempo, and ROM compliance (0-100)</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  Target: 80+
                </span>
              </div>

              <div className="h-60 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formScoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="session" stroke="#737373" fontSize={11} tickLine={false} />
                    <YAxis domain={[40, 100]} stroke="#737373" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="formScore"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Volume per session */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Rep Volume Per Session</span>
                  </h3>
                  <p className="text-xs text-neutral-400">Total verified repetitions completed</p>
                </div>
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/20">
                  Volume
                </span>
              </div>

              <div className="h-60 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="session" stroke="#737373" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="reps" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Historical Logs Table */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Detailed Biomechanical Workout Log</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="border-b border-neutral-800 font-mono text-neutral-400">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Exercise</th>
                    <th className="py-3 px-4">Total Reps</th>
                    <th className="py-3 px-4">Sets</th>
                    <th className="py-3 px-4">Avg Form Score</th>
                    <th className="py-3 px-4">Flags Cleared / Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {workoutHistory.map((session) => (
                    <tr key={session.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-neutral-400">{session.date}</td>
                      <td className="py-3 px-4 font-bold text-white">{session.exerciseName}</td>
                      <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{session.totalReps}</td>
                      <td className="py-3 px-4 text-neutral-300">{session.sets.length} sets</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            session.averageFormScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {session.averageFormScore} / 100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {session.issuesEncountered && session.issuesEncountered.length > 0 ? (
                          <span className="text-amber-300/90">{session.issuesEncountered.join('; ')}</span>
                        ) : (
                          <span className="text-emerald-400">Clean execution (0 flags)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
