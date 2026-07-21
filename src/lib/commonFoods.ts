import type { FoodBasis } from './foods';

/**
 * Built-in food database — common whole foods (per 100 g, USDA-style values)
 * so fruits, staples, and basics show up instantly in manual-entry search
 * without a network call. OpenFoodFacts results are merged in after these.
 * `servingG` is a typical single portion (1 medium fruit, 1 egg, …).
 */
export const COMMON_FOODS: FoodBasis[] = [
  // ---- Fruits ----
  { name: 'Apple', calories: 52, protein: 0, carbs: 14, fat: 0, fiber: 2, sodium: 1, sugar: 10, healthScore: 9, servingG: 182 },
  { name: 'Banana', calories: 89, protein: 1, carbs: 23, fat: 0, fiber: 3, sodium: 1, sugar: 12, healthScore: 9, servingG: 118 },
  { name: 'Orange', calories: 47, protein: 1, carbs: 12, fat: 0, fiber: 2, sodium: 0, sugar: 9, healthScore: 9, servingG: 131 },
  { name: 'Mango', calories: 60, protein: 1, carbs: 15, fat: 0, fiber: 2, sodium: 1, sugar: 14, healthScore: 9, servingG: 165 },
  { name: 'Grapes', calories: 69, protein: 1, carbs: 18, fat: 0, fiber: 1, sodium: 2, sugar: 16, healthScore: 8, servingG: 92 },
  { name: 'Strawberries', calories: 32, protein: 1, carbs: 8, fat: 0, fiber: 2, sodium: 1, sugar: 5, healthScore: 9, servingG: 150 },
  { name: 'Blueberries', calories: 57, protein: 1, carbs: 14, fat: 0, fiber: 2, sodium: 1, sugar: 10, healthScore: 9, servingG: 148 },
  { name: 'Watermelon', calories: 30, protein: 1, carbs: 8, fat: 0, fiber: 0, sodium: 1, sugar: 6, healthScore: 9, servingG: 280 },
  { name: 'Pineapple', calories: 50, protein: 1, carbs: 13, fat: 0, fiber: 1, sodium: 1, sugar: 10, healthScore: 9, servingG: 165 },
  { name: 'Pear', calories: 57, protein: 0, carbs: 15, fat: 0, fiber: 3, sodium: 1, sugar: 10, healthScore: 9, servingG: 178 },
  { name: 'Peach', calories: 39, protein: 1, carbs: 10, fat: 0, fiber: 2, sodium: 0, sugar: 8, healthScore: 9, servingG: 150 },
  { name: 'Kiwi', calories: 61, protein: 1, carbs: 15, fat: 1, fiber: 3, sodium: 3, sugar: 9, healthScore: 9, servingG: 69 },
  { name: 'Pomegranate', calories: 83, protein: 2, carbs: 19, fat: 1, fiber: 4, sodium: 3, sugar: 14, healthScore: 9, servingG: 87 },
  { name: 'Cherries', calories: 63, protein: 1, carbs: 16, fat: 0, fiber: 2, sodium: 0, sugar: 13, healthScore: 9, servingG: 138 },
  { name: 'Dates', calories: 277, protein: 2, carbs: 75, fat: 0, fiber: 7, sodium: 1, sugar: 66, healthScore: 7, servingG: 24 },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sodium: 7, sugar: 1, healthScore: 9, servingG: 100 },
  { name: 'Raspberries', calories: 52, protein: 1, carbs: 12, fat: 1, fiber: 7, sodium: 1, sugar: 4, healthScore: 10, servingG: 123 },
  { name: 'Blackberries', calories: 43, protein: 1, carbs: 10, fat: 0, fiber: 5, sodium: 1, sugar: 5, healthScore: 10, servingG: 144 },

  // ---- Vegetables ----
  { name: 'Broccoli', calories: 34, protein: 3, carbs: 7, fat: 0, fiber: 3, sodium: 33, sugar: 2, healthScore: 10, servingG: 91 },
  { name: 'Carrot', calories: 41, protein: 1, carbs: 10, fat: 0, fiber: 3, sodium: 69, sugar: 5, healthScore: 10, servingG: 61 },
  { name: 'Spinach', calories: 23, protein: 3, carbs: 4, fat: 0, fiber: 2, sodium: 79, sugar: 0, healthScore: 10, servingG: 30 },
  { name: 'Tomato', calories: 18, protein: 1, carbs: 4, fat: 0, fiber: 1, sodium: 5, sugar: 3, healthScore: 10, servingG: 123 },
  { name: 'Cucumber', calories: 15, protein: 1, carbs: 4, fat: 0, fiber: 1, sodium: 2, sugar: 2, healthScore: 10, servingG: 100 },
  { name: 'Sweet potato (baked)', calories: 90, protein: 2, carbs: 21, fat: 0, fiber: 3, sodium: 36, sugar: 6, healthScore: 9, servingG: 114 },
  { name: 'Potato (boiled)', calories: 87, protein: 2, carbs: 20, fat: 0, fiber: 2, sodium: 4, sugar: 1, healthScore: 8, servingG: 136 },
  { name: 'Asparagus', calories: 20, protein: 2, carbs: 4, fat: 0, fiber: 2, sodium: 2, sugar: 2, healthScore: 10, servingG: 90 },
  { name: 'Bell pepper (red)', calories: 31, protein: 1, carbs: 6, fat: 0, fiber: 2, sodium: 4, sugar: 4, healthScore: 10, servingG: 119 },
  { name: 'Cauliflower', calories: 25, protein: 2, carbs: 5, fat: 0, fiber: 2, sodium: 30, sugar: 2, healthScore: 10, servingG: 107 },
  { name: 'Zucchini', calories: 17, protein: 1, carbs: 3, fat: 0, fiber: 1, sodium: 8, sugar: 2, healthScore: 10, servingG: 118 },

  // ---- Meat, Poultry & Seafood ----
  { name: 'Chicken breast (cooked)', calories: 165, protein: 31, carbs: 0, fat: 4, fiber: 0, sodium: 74, sugar: 0, healthScore: 9, servingG: 120 },
  { name: 'Chicken thigh (cooked)', calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, sodium: 84, sugar: 0, healthScore: 8, servingG: 110 },
  { name: 'Turkey breast (cooked)', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sodium: 63, sugar: 0, healthScore: 9, servingG: 120 },
  { name: 'Egg', calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0, sodium: 124, sugar: 1, healthScore: 8, servingG: 50 },
  { name: 'Egg whites', calories: 52, protein: 11, carbs: 1, fat: 0, fiber: 0, sodium: 166, sugar: 1, healthScore: 10, servingG: 100 },
  { name: 'Salmon (cooked)', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sodium: 59, sugar: 0, healthScore: 9, servingG: 125 },
  { name: 'Tuna (canned in water)', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, sodium: 247, sugar: 0, healthScore: 8, servingG: 85 },
  { name: 'Ground beef (cooked)', calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0, sodium: 76, sugar: 0, healthScore: 6, servingG: 110 },
  { name: 'Sirloin steak (cooked)', calories: 214, protein: 29, carbs: 0, fat: 10, fiber: 0, sodium: 60, sugar: 0, healthScore: 8, servingG: 150 },
  { name: 'Shrimp (cooked)', calories: 99, protein: 24, carbs: 0, fat: 0, fiber: 0, sodium: 111, sugar: 0, healthScore: 8, servingG: 85 },
  { name: 'Cod fillet (cooked)', calories: 105, protein: 23, carbs: 0, fat: 1, fiber: 0, sodium: 78, sugar: 0, healthScore: 9, servingG: 120 },
  { name: 'Bacon (cooked)', calories: 541, protein: 37, carbs: 1, fat: 42, fiber: 0, sodium: 1717, sugar: 0, healthScore: 4, servingG: 24 },
  { name: 'Tofu (firm)', calories: 76, protein: 8, carbs: 2, fat: 5, fiber: 0, sodium: 7, sugar: 0, healthScore: 9, servingG: 100 },
  { name: 'Lentils (cooked)', calories: 116, protein: 9, carbs: 20, fat: 0, fiber: 8, sodium: 2, sugar: 2, healthScore: 10, servingG: 198 },
  { name: 'Chickpeas (cooked)', calories: 164, protein: 9, carbs: 27, fat: 3, fiber: 8, sodium: 7, sugar: 5, healthScore: 9, servingG: 164 },
  { name: 'Black beans (cooked)', calories: 132, protein: 9, carbs: 24, fat: 1, fiber: 9, sodium: 2, sugar: 0, healthScore: 10, servingG: 172 },
  { name: 'Edamame (steamed)', calories: 122, protein: 12, carbs: 10, fat: 5, fiber: 5, sodium: 6, sugar: 2, healthScore: 9, servingG: 150 },

  // ---- Dairy & Plant Milk ----
  { name: 'Greek yogurt (plain)', calories: 59, protein: 10, carbs: 4, fat: 0, fiber: 0, sodium: 36, sugar: 4, healthScore: 9, servingG: 170 },
  { name: 'Milk (whole)', calories: 61, protein: 3, carbs: 5, fat: 3, fiber: 0, sodium: 43, sugar: 5, healthScore: 7, servingG: 244 },
  { name: 'Almond milk (unsweetened)', calories: 15, protein: 1, carbs: 0, fat: 1, fiber: 0, sodium: 71, sugar: 0, healthScore: 8, servingG: 240 },
  { name: 'Oat milk', calories: 47, protein: 1, carbs: 7, fat: 2, fiber: 1, sodium: 41, sugar: 3, healthScore: 7, servingG: 240 },
  { name: 'Cheddar cheese', calories: 403, protein: 25, carbs: 1, fat: 33, fiber: 0, sodium: 621, sugar: 0, healthScore: 5, servingG: 28 },
  { name: 'Mozzarella', calories: 280, protein: 28, carbs: 3, fat: 17, fiber: 0, sodium: 627, sugar: 1, healthScore: 7, servingG: 30 },
  { name: 'Cottage cheese', calories: 98, protein: 11, carbs: 3, fat: 4, fiber: 0, sodium: 364, sugar: 3, healthScore: 8, servingG: 113 },

  // ---- Grains, Pasta & Staples ----
  { name: 'White rice (cooked)', calories: 130, protein: 3, carbs: 28, fat: 0, fiber: 0, sodium: 1, sugar: 0, healthScore: 6, servingG: 158 },
  { name: 'Brown rice (cooked)', calories: 111, protein: 3, carbs: 23, fat: 1, fiber: 2, sodium: 5, sugar: 0, healthScore: 8, servingG: 195 },
  { name: 'Quinoa (cooked)', calories: 120, protein: 4, carbs: 21, fat: 2, fiber: 3, sodium: 7, sugar: 1, healthScore: 9, servingG: 185 },
  { name: 'Oats (dry)', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, sodium: 2, sugar: 1, healthScore: 9, servingG: 40 },
  { name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1, fiber: 2, sodium: 1, sugar: 1, healthScore: 6, servingG: 140 },
  { name: 'White bread', calories: 265, protein: 9, carbs: 49, fat: 3, fiber: 3, sodium: 491, sugar: 5, healthScore: 5, servingG: 25 },
  { name: 'Whole wheat bread', calories: 247, protein: 13, carbs: 41, fat: 3, fiber: 7, sodium: 450, sugar: 4, healthScore: 8, servingG: 28 },
  { name: 'Bagel (plain)', calories: 250, protein: 10, carbs: 49, fat: 2, fiber: 2, sodium: 430, sugar: 6, healthScore: 6, servingG: 105 },

  // ---- Popular Dishes & Fast Food ----
  { name: 'Pepperoni pizza (1 slice)', calories: 290, protein: 12, carbs: 32, fat: 12, fiber: 2, sodium: 680, sugar: 3, healthScore: 4, servingG: 107 },
  { name: 'Cheeseburger', calories: 303, protein: 15, carbs: 30, fat: 14, fiber: 2, sodium: 560, sugar: 6, healthScore: 4, servingG: 150 },
  { name: 'Chicken burrito', calories: 220, protein: 14, carbs: 26, fat: 7, fiber: 3, sodium: 490, sugar: 2, healthScore: 6, servingG: 250 },
  { name: 'Salmon sushi roll (6 pcs)', calories: 184, protein: 6, carbs: 34, fat: 3, fiber: 1, sodium: 420, sugar: 4, healthScore: 8, servingG: 180 },
  { name: 'French fries', calories: 312, protein: 3, carbs: 41, fat: 15, fiber: 4, sodium: 210, sugar: 0, healthScore: 4, servingG: 117 },
  { name: 'Avocado toast', calories: 195, protein: 5, carbs: 22, fat: 11, fiber: 6, sodium: 280, sugar: 2, healthScore: 8, servingG: 120 },
  { name: 'Caesar salad with chicken', calories: 160, protein: 15, carbs: 6, fat: 9, fiber: 2, sodium: 420, sugar: 2, healthScore: 7, servingG: 200 },
  { name: 'Pancakes (2 medium)', calories: 227, protein: 6, carbs: 28, fat: 10, fiber: 1, sodium: 430, sugar: 7, healthScore: 5, servingG: 150 },

  // ---- Fitness, Drinks & Snacks ----
  { name: 'Whey protein powder', calories: 375, protein: 75, carbs: 8, fat: 5, fiber: 1, sodium: 160, sugar: 4, healthScore: 9, servingG: 32 },
  { name: 'Protein bar (chocolate)', calories: 380, protein: 33, carbs: 38, fat: 13, fiber: 10, sodium: 220, sugar: 3, healthScore: 7, servingG: 60 },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 13, sodium: 1, sugar: 4, healthScore: 8, servingG: 28 },
  { name: 'Peanut butter', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sodium: 426, sugar: 9, healthScore: 6, servingG: 32 },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 7, sodium: 2, sugar: 3, healthScore: 8, servingG: 28 },
  { name: 'Chia seeds', calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, sodium: 16, sugar: 0, healthScore: 10, servingG: 28 },
  { name: 'Hummus', calories: 166, protein: 8, carbs: 14, fat: 10, fiber: 6, sodium: 380, sugar: 1, healthScore: 8, servingG: 60 },
  { name: 'Olive oil', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sodium: 2, sugar: 0, healthScore: 7, servingG: 14 },
  { name: 'Honey', calories: 304, protein: 0, carbs: 82, fat: 0, fiber: 0, sodium: 4, sugar: 82, healthScore: 5, servingG: 21 },
  { name: 'Dark chocolate (70%)', calories: 546, protein: 8, carbs: 46, fat: 39, fiber: 11, sodium: 20, sugar: 24, healthScore: 6, servingG: 30 },
  { name: 'Black coffee', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 5, sugar: 0, healthScore: 9, servingG: 240 },
  { name: 'Caffè latte (whole milk)', calories: 54, protein: 3, carbs: 4, fat: 3, fiber: 0, sodium: 42, sugar: 4, healthScore: 7, servingG: 240 },
  { name: 'Green tea (unsweetened)', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 2, sugar: 0, healthScore: 10, servingG: 240 },
  { name: 'Orange juice (fresh)', calories: 45, protein: 1, carbs: 10, fat: 0, fiber: 0, sodium: 1, sugar: 8, healthScore: 7, servingG: 240 },
  { name: 'Coconut water', calories: 19, protein: 1, carbs: 4, fat: 0, fiber: 1, sodium: 105, sugar: 3, healthScore: 8, servingG: 240 },
];

/** Case-insensitive name search over the built-in database. */
export function searchCommonFoods(query: string, limit = 12): FoodBasis[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts: FoodBasis[] = [];
  const contains: FoodBasis[] = [];
  for (const f of COMMON_FOODS) {
    const name = f.name.toLowerCase();
    if (name.startsWith(q)) starts.push(f);
    else if (name.includes(q)) contains.push(f);
  }
  return [...starts, ...contains].slice(0, limit);
}
