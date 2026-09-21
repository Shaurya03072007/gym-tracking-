import React, { useState } from 'react';
import {
  Activity,
  Camera,
  Dumbbell,
  LineChart,
  Utensils,
  Bot,
  User,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  Menu,
  X,
  ScanLine
} from 'lucide-react';
import { UserProfile } from '../types';
import { AudioCoach } from '../services/audioCoach';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userProfile: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userProfile
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(!AudioCoach.isEnabled());

  const toggleVoice = () => {
    const next = !voiceMuted;
    setVoiceMuted(next);
    AudioCoach.setEnabled(!next);
    if (!next) {
      AudioCoach.speak('Voice coaching enabled. Ready when you are.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'workout', label: 'Live Camera Workout', icon: Camera, highlight: true },
    { id: 'exercises', label: 'Exercise Library', icon: Dumbbell },
    { id: 'progress', label: 'Analytics', icon: LineChart },
    { id: 'nutrition', label: 'Diet & Nutrition', icon: Utensils },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'body_scan', label: 'Body Posture Scan', icon: ScanLine },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex cursor-pointer items-center space-x-3 group"
          id="brand-logo-btn"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ScanLine className="h-5 w-5 text-neutral-950 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">
                FitVision<span className="text-emerald-400"> AI</span>
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                Vision OS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              Gym Tracking & Personal Coach
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.slice(0, 7).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-emerald-400 shadow-sm border border-neutral-700'
                    : item.highlight
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center space-x-3">
          {/* Audio Voice Toggle */}
          <button
            onClick={toggleVoice}
            id="voice-coach-toggle-btn"
            title={voiceMuted ? 'Voice coaching is muted' : 'Voice coaching is active'}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              voiceMuted
                ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {voiceMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-neutral-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span className="text-[11px] font-mono">
              {voiceMuted ? 'Muted' : 'Voice'}
            </span>
          </button>

          {/* Quick Start Workout Button */}
          <button
            id="quick-start-workout-btn"
            onClick={() => onSelectTab('workout')}
            className="flex items-center space-x-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/15"
          >
            <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Start Tracking</span>
          </button>

          {/* User Profile Pill */}
          <button
            id="user-profile-header-btn"
            onClick={() => onSelectTab('profile')}
            className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-700 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
              {userProfile.name ? userProfile.name.charAt(0) : 'U'}
            </div>
            <span className="max-w-[100px] truncate font-medium">{userProfile.name || 'Athlete'}</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            onClick={() => onSelectTab('workout')}
            className="flex items-center space-x-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-neutral-950"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Track</span>
          </button>
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-neutral-800 p-2 text-neutral-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-neutral-800 bg-neutral-950 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-emerald-400'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
