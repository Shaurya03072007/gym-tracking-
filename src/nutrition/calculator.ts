import {
  ActivityLevel,
  FitnessGoal,
  MealPlanDay,
  Sex,
  UserProfile
} from '../types';
import { FOOD_DATABASE } from './food-database';

export interface NutritionCalculationResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  disclaimer: string;
}

export function calculateEnergyRequirements(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  activity: ActivityLevel,
  goal: FitnessGoal
): NutritionCalculationResult {
  // Mifflin-St Jeor Equation
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(bmr);

  // Activity Multiplier
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };

  const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.375));

  // Goal adjustment
  let targetCalories = tdee;
  if (goal === 'fat_loss') {
    targetCalories = Math.max(1200, Math.round(tdee * 0.8)); // 20% deficit
  } else if (goal === 'muscle_gain') {
    targetCalories = Math.round(tdee * 1.12); // 12% surplus
  } else if (goal === 'strength') {
    targetCalories = Math.round(tdee * 1.08);
  }

  // Protein targets: 1.8g - 2.2g per kg bodyweight for lifting
  const proteinMultiplier = goal === 'fat_loss' ? 2.2 : 2.0;
  const targetProteinGrams = Math.round(Math.min(260, Math.max(60, weightKg * proteinMultiplier)));

  // Fat target: ~25% of calories (9 cal per gram)
  const targetFatGrams = Math.round((targetCalories * 0.25) / 9);

  // Carbohydrates: Remainder of calories (4 cal per gram)
  const caloriesFromProtein = targetProteinGrams * 4;
  const caloriesFromFat = targetFatGrams * 9;
  const remainingCalories = Math.max(200, targetCalories - (caloriesFromProtein + caloriesFromFat));
  const targetCarbsGrams = Math.round(remainingCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    targetProteinGrams,
    targetCarbsGrams,
    targetFatGrams,
    disclaimer:
      'NOTE: Calorie and macronutrient values calculated by the Mifflin-St Jeor equation are mathematical estimates. This is not medical nutrition therapy. Consult a qualified physician or registered dietitian before beginning any radical diet, especially if you have metabolic conditions.'
  };
}

/**
 * Procedurally generates a balanced daily meal plan tailored to user preferences (Indian/Veg/Non-veg/etc.)
 */
export function generateSampleMealPlan(profile: UserProfile): MealPlanDay {
  const energy = calculateEnergyRequirements(
    profile.weightKg || 70,
    profile.heightCm || 175,
    profile.age || 26,
    profile.sex || 'male',
    profile.activityLevel || 'moderately_active',
    profile.primaryGoal || 'muscle_gain'
  );

  const isVeg = profile.dietaryPreference === 'vegetarian' || profile.dietaryPreference === 'vegan';
  const isVegan = profile.dietaryPreference === 'vegan';

  // Filter food database according to preferences & allergies
  const eligibleFoods = FOOD_DATABASE.filter((food) => {
    if (isVegan && !food.isVegan) return false;
    if (isVeg && !food.isVegetarian) return false;
    if (profile.allergies && profile.allergies.length > 0) {
      const hasAllergen = food.allergens.some((a) => profile.allergies.includes(a));
      if (hasAllergen) return false;
    }
    return true;
  });

  const getFoodById = (id: string, fallbackId: string) => {
    return eligibleFoods.find((f) => f.id === id) || eligibleFoods.find((f) => f.id.includes(fallbackId)) || eligibleFoods[0];
  };

  // Build 4 meals: Breakfast, Lunch, Post-Workout / Snack, Dinner
  const breakfastItem1 = isVegan
    ? getFoodById('overnight_oats', 'oats')
    : isVeg
    ? getFoodById('paneer_bhurji', 'paneer')
    : getFoodById('egg_omelette', 'egg');
  const breakfastItem2 = getFoodById('banana_medium', 'fruit');

  const lunchItem1 = isVeg
    ? getFoodById('chana_masala', 'dal')
    : getFoodById('chicken_curry_homestyle', 'chicken');
  const lunchItem2 = getFoodById('chapati_plain', 'chapati');
  const lunchItem3 = isVegan ? getFoodById('salad_cucumber_tomato', 'salad') : getFoodById('dahi_curd', 'curd');

  const snackItem1 = isVegan
    ? getFoodById('soya_chunks_boiled', 'soya')
    : getFoodById('whey_isolate', 'whey');
  const snackItem2 = getFoodById('almonds_raw', 'almonds');

  const dinnerItem1 = isVeg
    ? getFoodById('paneer_raw', 'paneer')
    : getFoodById('chicken_breast_grilled', 'chicken');
  const dinnerItem2 = getFoodById('steamed_basmati', 'rice');
  const dinnerItem3 = getFoodById('dal_tadka', 'dal');

  const meals = [
    {
      name: 'Energizing Morning Breakfast',
      time: '08:00 AM',
      items: [
        { food: breakfastItem1, servings: 1.5 },
        { food: breakfastItem2, servings: 1 }
      ],
      totalCalories: Math.round(breakfastItem1.calories * 1.5 + breakfastItem2.calories),
      totalProtein: Math.round(breakfastItem1.proteinG * 1.5 + breakfastItem2.proteinG),
      totalCarbs: Math.round(breakfastItem1.carbsG * 1.5 + breakfastItem2.carbsG),
      totalFat: Math.round(breakfastItem1.fatG * 1.5 + breakfastItem2.fatG)
    },
    {
      name: 'Power Lunch',
      time: '01:00 PM',
      items: [
        { food: lunchItem1, servings: 1 },
        { food: lunchItem2, servings: 2 },
        { food: lunchItem3, servings: 1 }
      ],
      totalCalories: Math.round(lunchItem1.calories + lunchItem2.calories * 2 + lunchItem3.calories),
      totalProtein: Math.round(lunchItem1.proteinG + lunchItem2.proteinG * 2 + lunchItem3.proteinG),
      totalCarbs: Math.round(lunchItem1.carbsG + lunchItem2.carbsG * 2 + lunchItem3.carbsG),
      totalFat: Math.round(lunchItem1.fatG + lunchItem2.fatG * 2 + lunchItem3.fatG)
    },
    {
      name: 'Pre/Post-Workout Fuel',
      time: '05:30 PM',
      items: [
        { food: snackItem1, servings: 1 },
        { food: snackItem2, servings: 1 }
      ],
      totalCalories: Math.round(snackItem1.calories + snackItem2.calories),
      totalProtein: Math.round(snackItem1.proteinG + snackItem2.proteinG),
      totalCarbs: Math.round(snackItem1.carbsG + snackItem2.carbsG),
      totalFat: Math.round(snackItem1.fatG + snackItem2.fatG)
    },
    {
      name: 'Recovery Dinner',
      time: '08:30 PM',
      items: [
        { food: dinnerItem1, servings: 1.2 },
        { food: dinnerItem2, servings: 1 },
        { food: dinnerItem3, servings: 1 }
      ],
      totalCalories: Math.round(dinnerItem1.calories * 1.2 + dinnerItem2.calories + dinnerItem3.calories),
      totalProtein: Math.round(dinnerItem1.proteinG * 1.2 + dinnerItem2.proteinG + dinnerItem3.proteinG),
      totalCarbs: Math.round(dinnerItem1.carbsG * 1.2 + dinnerItem2.carbsG + dinnerItem3.carbsG),
      totalFat: Math.round(dinnerItem1.fatG * 1.2 + dinnerItem2.fatG + dinnerItem3.fatG)
    }
  ];

  return {
    dayName: 'Daily Target Plan',
    targetCalories: energy.targetCalories,
    targetProtein: energy.targetProteinGrams,
    targetCarbs: energy.targetCarbsGrams,
    targetFat: energy.targetFatGrams,
    meals
  };
}
