import React, { useState } from 'react';
import {
  User,
  Save,
  Check,
  Flame,
  Activity,
  Dumbbell,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { calculateEnergyRequirements } from '../nutrition/calculator';
import { saveUserProfile } from '../services/storage';
import {
  ActivityLevel,
  DifficultyLevel,
  EquipmentRequired,
  FitnessGoal,
  Sex,
  UserProfile
} from '../types';

interface ProfilePageProps {
  userProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  onProfileUpdated
}) => {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Recalculate energy dynamically
  const energy = calculateEnergyRequirements(
    formData.weightKg || 74,
    formData.heightCm || 178,
    formData.age || 27,
    formData.sex || 'male',
    formData.activityLevel || 'moderately_active',
    formData.primaryGoal || 'muscle_gain'
  );

  const handleEquipmentToggle = (equip: EquipmentRequired) => {
    const list = formData.availableEquipment || [];
    const updated = list.includes(equip)
      ? list.filter((e) => e !== equip)
      : [...list, equip];
    setFormData({ ...formData, availableEquipment: updated });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...formData,
      estimatedBmr: energy.bmr,
      estimatedTdee: energy.tdee,
      targetCalories: energy.targetCalories,
      targetProteinGrams: energy.targetProteinGrams,
      targetCarbsGrams: energy.targetCarbsGrams,
      targetFatGrams: energy.targetFatGrams
    };

    saveUserProfile(updated);
    onProfileUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const equipmentOptions: EquipmentRequired[] = [
    'Bodyweight',
    'Dumbbells',
    'Barbell',
    'Kettlebell',
    'Bands',
    'Pull-up Bar',
    'Bench'
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center space-x-3">
          <User className="h-8 w-8 text-emerald-400 stroke-[2.2]" />
          <span>Athlete Profile & Biometrics</span>
        </h1>
        <p className="text-sm text-neutral-400">
          Personalize your anthropometrics, goal periodization, and available gym equipment for adaptive workout generation.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Anthropometrics & Vital Stats */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Flame className="h-5 w-5 text-amber-400" />
            <span>Biometrics & Body Composition</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Biological Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as Sex })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Age (Years)</label>
              <input
                type="number"
                min={14}
                max={90}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Height (cm)</label>
              <input
                type="number"
                min={100}
                max={230}
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Current Bodyweight (kg)</label>
              <input
                type="number"
                step="0.1"
                min={35}
                max={250}
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min={35}
                max={250}
                value={formData.targetWeightKg}
                onChange={(e) => setFormData({ ...formData, targetWeightKg: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="sedentary">Sedentary (Desk Job)</option>
                <option value="lightly_active">Lightly Active (1-2 workouts)</option>
                <option value="moderately_active">Moderately Active (3-5 workouts)</option>
                <option value="very_active">Very Active (6-7 workouts)</option>
                <option value="extra_active">Extra Active (Heavy physical labor)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Training Experience</label>
              <select
                value={formData.fitnessLevel}
                onChange={(e) => setFormData({ ...formData, fitnessLevel: e.target.value as DifficultyLevel })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Beginner">Beginner (&lt; 1 yr)</option>
                <option value="Intermediate">Intermediate (1 - 3 yrs)</option>
                <option value="Advanced">Advanced (3+ yrs)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Mifflin-St Jeor Preview Box */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-neutral-500 block text-[10px]">Calculated BMR</span>
              <span className="text-white font-bold text-base">{energy.bmr} kcal</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Daily TDEE</span>
              <span className="text-cyan-400 font-bold text-base">{energy.tdee} kcal</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Target Calories</span>
              <span className="text-amber-400 font-bold text-base">{energy.targetCalories} kcal</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Protein Target</span>
              <span className="text-emerald-400 font-bold text-base">{energy.targetProteinGrams} g/day</span>
            </div>
          </div>
        </div>

        {/* Fitness Goal & Frequency */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>Goal & Training Frequency</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Primary Goal</label>
              <select
                value={formData.primaryGoal}
                onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value as FitnessGoal })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="muscle_gain">Hypertrophy (Muscle Gain)</option>
                <option value="fat_loss">Fat Loss & Conditioning</option>
                <option value="strength">Raw Strength (Powerlifting)</option>
                <option value="endurance">Stamina & Athletic Endurance</option>
                <option value="general_fitness">General Health & Longevity</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Training Days Per Week</label>
              <select
                value={formData.trainingFrequencyDays}
                onChange={(e) => setFormData({ ...formData, trainingFrequencyDays: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={3}>3 Days (Full Body Routine)</option>
                <option value={4}>4 Days (Upper / Lower Split)</option>
                <option value={5}>5 Days (Push / Pull / Legs + Upper / Lower)</option>
                <option value={6}>6 Days (PPL × 2 Overload)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Equipment Selection */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Dumbbell className="h-5 w-5 text-purple-400" />
            <span>Available Training Equipment</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Select what you have access to. The AI workout generator will only prescribe movements that match your gear.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {equipmentOptions.map((equip) => {
              const isSelected = formData.availableEquipment?.includes(equip);
              return (
                <button
                  type="button"
                  key={equip}
                  onClick={() => handleEquipmentToggle(equip)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {equip} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4 text-xs">
          <h2 className="text-base font-bold text-white">Dietary & Nutrition Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-medium">Diet Pattern</label>
              <select
                value={formData.dietaryPreference}
                onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value as any })}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="balanced">Balanced Omnivore (Chicken, Fish, Dairy, Grains)</option>
                <option value="vegetarian">Lacto-Vegetarian (Paneer, Milk, Dal, Roti)</option>
                <option value="vegan">100% Plant-Based Vegan (Soya, Tofu, Lentils, Seeds)</option>
                <option value="eggetarian">Eggetarian (Vegetarian + Eggs)</option>
                <option value="non_vegetarian">High-Protein Meat & Poultry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4">
          {savedSuccess ? (
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <Check className="h-4 w-4" />
              <span>Athlete Profile Saved & Recalibrated!</span>
            </div>
          ) : (
            <div />
          )}

          <button
            id="save-profile-btn"
            type="submit"
            className="flex items-center space-x-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
          >
            <Save className="h-4 w-4" />
            <span>Save Profile & Recalibrate</span>
          </button>
        </div>
      </form>
    </div>
  );
};
