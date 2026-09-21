import React, { useState } from 'react';
import {
  Utensils,
  Flame,
  Search,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Check,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import { calculateEnergyRequirements, generateSampleMealPlan } from '../nutrition/calculator';
import { FOOD_DATABASE, searchFoods } from '../nutrition/food-database';
import { FoodItem, MealPlanDay, UserProfile } from '../types';

interface NutritionPageProps {
  userProfile: UserProfile;
}

export const NutritionPage: React.FC<NutritionPageProps> = ({ userProfile }) => {
  const [mealPlan, setMealPlan] = useState<MealPlanDay>(() => generateSampleMealPlan(userProfile));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);

  // Food Swapper State
  const [swappingMealIdx, setSwappingMealIdx] = useState<number | null>(null);
  const [swapPrompt, setSwapPrompt] = useState('Replace with high-protein vegetarian alternative');
  const [isSwapping, setIsSwapping] = useState(false);

  // Energy requirements
  const energy = calculateEnergyRequirements(
    userProfile.weightKg || 74,
    userProfile.heightCm || 178,
    userProfile.age || 27,
    userProfile.sex || 'male',
    userProfile.activityLevel || 'moderately_active',
    userProfile.primaryGoal || 'muscle_gain'
  );

  const categories = [
    'All',
    'Lentils & Dals',
    'Grains & Breads',
    'Dairy & Paneer',
    'Meat & Poultry',
    'Eggs & Seafood',
    'Traditional Snacks',
    'Vegetables',
    'Fruits',
    'Nuts & Seeds',
    'Supplements'
  ];

  const searchResults = searchFoods(searchQuery, selectedCategory, vegOnlyFilter);

  const handleSwapFood = async (mealIdx: number, itemIdx: number) => {
    setIsSwapping(true);
    const targetMeal = mealPlan.meals[mealIdx];
    const targetItem = targetMeal.items[itemIdx];

    try {
      const res = await fetch('/api/nutrition/swap-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFood: targetItem.food.name,
          swapRequest: swapPrompt,
          currentCalories: targetItem.food.calories,
          currentProtein: targetItem.food.proteinG
        })
      });
      const data = await res.json();
      if (data && data.replacement) {
        const newFood: FoodItem = {
          id: `custom_swap_${Date.now()}`,
          name: data.replacement.name,
          servingSize: data.replacement.servingSize || '1 portion',
          calories: data.replacement.calories,
          proteinG: data.replacement.proteinG,
          carbsG: data.replacement.carbsG || 5,
          fatG: data.replacement.fatG || 5,
          fiberG: 2,
          cuisine: 'Universal',
          category: 'Supplements',
          isVegetarian: true,
          isVegan: false,
          isEggetarian: true,
          allergens: []
        };

        const updatedMeals = [...mealPlan.meals];
        updatedMeals[mealIdx].items[itemIdx] = {
          food: newFood,
          servings: 1
        };

        // Recalculate meal totals
        let mealCal = 0;
        let mealProt = 0;
        let mealCarb = 0;
        let mealFat = 0;
        for (const it of updatedMeals[mealIdx].items) {
          mealCal += it.food.calories * it.servings;
          mealProt += it.food.proteinG * it.servings;
          mealCarb += it.food.carbsG * it.servings;
          mealFat += it.food.fatG * it.servings;
        }
        updatedMeals[mealIdx].totalCalories = Math.round(mealCal);
        updatedMeals[mealIdx].totalProtein = Math.round(mealProt);
        updatedMeals[mealIdx].totalCarbs = Math.round(mealCarb);
        updatedMeals[mealIdx].totalFat = Math.round(mealFat);

        setMealPlan({ ...mealPlan, meals: updatedMeals });
        setSwappingMealIdx(null);
      }
    } catch (e) {
      console.error('Swap error:', e);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          AI Sports Nutrition & Meal Architecture
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
          Scientifically calibrated macro distribution based on Mifflin-St Jeor thermogenesis, paired with an authentic 500+ Indian & International nutrient database.
        </p>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-amber-400 font-mono">
            Medical Disclaimer
          </span>
          <p className="text-amber-200/90 leading-relaxed text-[11px] sm:text-xs">{energy.disclaimer}</p>
        </div>
      </div>

      {/* Calorie & Macronutrient Targets Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <span className="text-xs font-mono text-neutral-400 truncate block">Target Calories</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{energy.targetCalories}</span>
            <span className="text-xs text-neutral-500 font-mono">kcal</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
            TDEE: {energy.tdee} • BMR: {energy.bmr}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <span className="text-xs font-mono text-emerald-400 truncate block">Protein (4 kcal/g)</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{energy.targetProteinGrams}</span>
            <span className="text-xs text-neutral-500 font-mono">g</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
            ~{(energy.targetProteinGrams / (userProfile.weightKg || 74)).toFixed(1)}g / kg bodyweight
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <span className="text-xs font-mono text-cyan-400 truncate block">Carbs (4 kcal/g)</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">{energy.targetCarbsGrams}</span>
            <span className="text-xs text-neutral-500 font-mono">g</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">Glycogen & endurance</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-1.5">
          <span className="text-xs font-mono text-amber-400 truncate block">Fats (9 kcal/g)</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{energy.targetFatGrams}</span>
            <span className="text-xs text-neutral-500 font-mono">g</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">Hormonal & joints</p>
        </div>
      </div>

      {/* Daily Meal Plan with Indian Staples */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Utensils className="h-5 w-5 text-emerald-400" />
              <span>Today’s AI Personalized Meal Blueprint</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Dietary Profile: {userProfile.dietaryPreference.toUpperCase()} • Tailored with Indian cuisine options
            </p>
          </div>

          <button
            onClick={() => setMealPlan(generateSampleMealPlan(userProfile))}
            className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Regenerate Blueprint</span>
          </button>
        </div>

        {/* 4 Meals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mealPlan.meals.map((meal, mealIdx) => (
            <div
              key={meal.name}
              className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start border-b border-neutral-800/80 pb-2">
                  <div>
                    <span className="text-[11px] font-mono text-neutral-400">{meal.time}</span>
                    <h3 className="text-sm font-bold text-white">{meal.name}</h3>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-emerald-400">{meal.totalCalories} kcal</span>
                    <span className="block text-[10px] text-neutral-400">{meal.totalProtein}g protein</span>
                  </div>
                </div>

                {/* Meal Items */}
                <div className="space-y-2">
                  {meal.items.map((it, itIdx) => (
                    <div
                      key={itIdx}
                      className="flex items-center justify-between rounded-lg bg-neutral-900/80 px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-neutral-200">{it.food.name}</p>
                        <p className="text-[10px] text-neutral-400">
                          {it.servings} × {it.food.servingSize} • {it.food.cuisine}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-emerald-400 font-bold">
                          {Math.round(it.food.proteinG * it.servings)}g P
                        </span>
                        <button
                          onClick={() => setSwappingMealIdx(mealIdx)}
                          title="Swap with AI"
                          className="rounded p-1 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In-place Swapper Box */}
              {swappingMealIdx === mealIdx && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2 text-xs">
                  <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Food Swapper</span>
                  </div>
                  <input
                    type="text"
                    value={swapPrompt}
                    onChange={(e) => setSwapPrompt(e.target.value)}
                    placeholder="e.g. Replace chicken with high-protein paneer or soya"
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => setSwappingMealIdx(null)}
                      className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSwapping}
                      onClick={() => handleSwapFood(mealIdx, 0)}
                      className="rounded bg-emerald-500 px-3 py-1 text-[11px] font-bold text-neutral-950 hover:bg-emerald-400"
                    >
                      {isSwapping ? 'Swapping...' : 'Confirm Swap'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 500+ Indian & International Food Explorer */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span>500+ Food Macro Explorer</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Search verified Indian foods, rotis, dals, paneer, curds, poultry, and international staples.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by food name or cuisine (e.g. Moong Dal, Paneer, Biryani, Salmon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 py-2 pl-10 pr-4 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-colors ${
                vegOnlyFilter
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400'
              }`}
            >
              Vegetarian Only
            </button>
          </div>
        </div>

        {/* Foods Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 font-mono text-neutral-400 sticky top-0 bg-neutral-900 z-10">
              <tr>
                <th className="py-2.5 px-3">Food Name</th>
                <th className="py-2.5 px-3">Serving</th>
                <th className="py-2.5 px-3">Calories</th>
                <th className="py-2.5 px-3">Protein</th>
                <th className="py-2.5 px-3">Carbs</th>
                <th className="py-2.5 px-3">Fats</th>
                <th className="py-2.5 px-3">Cuisine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50 font-mono">
              {searchResults.slice(0, 30).map((food) => (
                <tr key={food.id} className="hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 font-sans font-medium text-white">
                    {food.name}
                    {food.isVegetarian && (
                      <span className="ml-1.5 rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] text-emerald-400">
                        VEG
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400">{food.servingSize}</td>
                  <td className="py-2.5 px-3 text-white font-bold">{food.calories} kcal</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{food.proteinG}g</td>
                  <td className="py-2.5 px-3 text-cyan-400">{food.carbsG}g</td>
                  <td className="py-2.5 px-3 text-amber-400">{food.fatG}g</td>
                  <td className="py-2.5 px-3 text-neutral-400 font-sans">{food.cuisine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
