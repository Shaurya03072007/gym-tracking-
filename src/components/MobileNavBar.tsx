import React, { useState } from 'react';
import {
  Activity,
  Camera,
  Dumbbell,
  LineChart,
  Utensils,
  MoreHorizontal,
  Bot,
  ScanLine,
  User,
  Settings,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AudioCoach } from '../services/audioCoach';

interface MobileNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentTab, onSelectTab }) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(!AudioCoach.isEnabled());

  const toggleVoice = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    AudioCoach.setEnabled(!next);
    if (!next) {
      AudioCoach.speak('Voice coaching enabled.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Activity },
    { id: 'exercises', label: 'Library', icon: Dumbbell },
    { id: 'workout', label: 'Camera', icon: Camera, isAction: true },
    { id: 'progress', label: 'Analytics', icon: LineChart },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils }
  ];

  const secondaryItems = [
    { id: 'coach', label: 'AI Voice Coach', icon: Bot, desc: 'Conversational biomechanics & diet' },
    { id: 'body_scan', label: 'Body Posture Scan', icon: ScanLine, desc: 'Optical posture & proportion scan' },
    { id: 'profile', label: 'Athlete Profile', icon: User, desc: 'Target weight, calories & equipment' },
    { id: 'settings', label: 'Settings & Data', icon: Settings, desc: 'API keys & storage management' }
  ];

  return (
    <>
      {/* Fixed Bottom Tab Bar for Mobile & Tablet */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-lg px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  id="mobile-tab-workout"
                  onClick={() => {
                    onSelectTab('workout');
                    setMoreMenuOpen(false);
                  }}
                  className="flex flex-col items-center -mt-5 group focus:outline-none"
                  aria-label="Start Live Camera Workout"
                >
                  <div className="relative flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-transform">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-950">
                      <Camera className="h-6 w-6 text-emerald-400 stroke-[2.2]" />
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] font-bold text-emerald-400">
                    Track
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  setMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center py-1 px-2.5 rounded-lg min-w-[56px] min-h-[44px] justify-center transition-colors ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-neutral-400 hover:text-neutral-200 active:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Sheet Trigger */}
          <button
            id="mobile-tab-more"
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg min-w-[56px] min-h-[44px] justify-center transition-colors ${
              ['coach', 'body_scan', 'profile', 'settings'].includes(currentTab)
                ? 'text-emerald-400'
                : 'text-neutral-400 hover:text-neutral-200 active:text-white'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Bottom Drawer for Additional Items */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="flex-1"
            onClick={() => setMoreMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="rounded-t-3xl border-t border-neutral-800 bg-neutral-900 p-5 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Additional Tools & Profile
                </span>
              </div>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="rounded-full bg-neutral-800 p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Voice Coaching Quick Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-3.5">
              <div className="flex items-center space-x-3">
                {voiceMuted ? (
                  <VolumeX className="h-5 w-5 text-neutral-500" />
                ) : (
                  <Volume2 className="h-5 w-5 text-emerald-400" />
                )}
                <div>
                  <p className="text-xs font-bold text-white">Voice Audio Coaching</p>
                  <p className="text-[11px] text-neutral-400">Audio cues for reps and form warnings</p>
                </div>
              </div>
              <button
                onClick={toggleVoice}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  voiceMuted
                    ? 'bg-neutral-800 text-neutral-300'
                    : 'bg-emerald-500 text-neutral-950'
                }`}
              >
                {voiceMuted ? 'Muted' : 'Active'}
              </button>
            </div>

            {/* Menu List */}
            <div className="grid grid-cols-1 gap-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-menu-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMoreMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3.5 rounded-xl p-3.5 text-left transition-colors ${
                      isActive
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border border-neutral-800 bg-neutral-950 text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-neutral-400">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
