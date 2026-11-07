import type { Food, MealSlot, Settings } from './types';

/** Estimates for typical portions (spec A2). Hashan can edit values in the app. */
export const FOODS: Food[] = [
  // Home and breakfast
  { id: 'chapati', name: 'Chapati', portion: '1, about 40 g', kcal: 120, protein: 4, group: 'home' },
  { id: 'omelette-2', name: '2-egg omelette', portion: '2 eggs, 1 tsp oil', kcal: 185, protein: 12.5, group: 'home' },
  { id: 'omelette-3', name: '3-egg omelette', portion: '3 eggs, 1 tsp oil', kcal: 260, protein: 19, group: 'home' },
  { id: 'beef-curry', name: 'Beef curry', portion: '100 g', kcal: 185, protein: 15, group: 'home' },
  { id: 'milk-tea', name: 'Milk tea, no sugar', portion: '1 cup', kcal: 40, protein: 2, group: 'home' },
  { id: 'dates', name: 'Dates', portion: '3 small', kcal: 70, protein: 1, group: 'home' },
  { id: 'lentil-soup', name: 'Lentil soup', portion: '1 bowl', kcal: 150, protein: 8, group: 'home' },

  // Go
  { id: 'tandoori', name: 'Tandoori chicken', portion: 'half chicken, ~250 g with bone', kcal: 300, protein: 40, group: 'go' },
  { id: 'chicken-tikka', name: 'Chicken tikka, dry', portion: '6 pieces, ~200 g', kcal: 280, protein: 40, group: 'go' },
  { id: 'grilled-fish', name: 'Grilled fish or fish tikka', portion: '200 g', kcal: 260, protein: 42, group: 'go' },
  { id: 'grilled-chicken', name: 'Grilled chicken breast', portion: '200 g', kcal: 330, protein: 60, group: 'go' },
  { id: 'seekh-kebab', name: 'Chicken seekh kebab', portion: '2 pieces', kcal: 250, protein: 24, group: 'go' },
  { id: 'egg-curry', name: 'Egg curry', portion: '2 eggs with gravy', kcal: 250, protein: 13, group: 'go' },
  { id: 'dal', name: 'Yellow dal', portion: '1 cup, 200 g', kcal: 180, protein: 10, group: 'go' },
  { id: 'roti', name: 'Chapati or roti', portion: '1', kcal: 120, protein: 4, group: 'go' },
  { id: 'salad', name: 'Green salad', portion: '1 bowl', kcal: 30, protein: 1, group: 'go' },
  { id: 'raita', name: 'Raita', portion: '100 g', kcal: 70, protein: 3, group: 'go' },
  { id: 'greek-yogurt', name: 'Greek yogurt, plain', portion: '170 g', kcal: 130, protein: 17, group: 'go' },
  { id: 'laban', name: 'Laban', portion: '1 cup, 240 ml', kcal: 100, protein: 8, group: 'go' },
  { id: 'whey', name: 'Whey shake with water', portion: '1 scoop', kcal: 120, protein: 24, group: 'go' },
  { id: 'fruit', name: 'Fruit (apple, orange or banana)', portion: '1', kcal: 90, protein: 1, group: 'go' },

  // Careful
  { id: 'rice-half', name: 'Rice, half portion', portion: '150 g cooked', kcal: 200, protein: 4, group: 'careful' },
  { id: 'chicken-curry', name: 'Chicken curry (ask for less oil)', portion: '200 g', kcal: 300, protein: 25, group: 'careful' },
  { id: 'fish-curry', name: 'Fish curry', portion: '200 g', kcal: 260, protein: 25, group: 'careful' },
  { id: 'devilled-chicken', name: 'Devilled chicken', portion: '200 g', kcal: 380, protein: 30, group: 'careful' },
  { id: 'chana', name: 'Chana masala', portion: '1 cup', kcal: 250, protein: 11, group: 'careful' },
  { id: 'palak-paneer', name: 'Palak paneer', portion: '1 cup', kcal: 300, protein: 14, group: 'careful' },
  { id: 'string-hoppers', name: 'String hoppers', portion: '5', kcal: 200, protein: 4, group: 'careful' },
  { id: 'dosa', name: 'Plain dosa with sambar', portion: '1', kcal: 250, protein: 7, group: 'careful' },
  { id: 'idli', name: 'Idli with sambar', portion: '2', kcal: 200, protein: 7, group: 'careful' },

  // Avoid
  { id: 'biryani', name: 'Chicken biryani', portion: '1 portion, ~400 g', kcal: 800, protein: 35, group: 'avoid' },
  { id: 'kottu', name: 'Chicken kottu', portion: '1 portion', kcal: 900, protein: 35, group: 'avoid' },
  { id: 'parotta', name: 'Parotta', portion: '1', kcal: 300, protein: 5, group: 'avoid' },
  { id: 'naan', name: 'Naan', portion: '1', kcal: 300, protein: 9, group: 'avoid' },
  { id: 'butter-chicken', name: 'Butter chicken', portion: '1 cup', kcal: 490, protein: 30, group: 'avoid' },
  { id: 'korma', name: 'Korma', portion: '1 cup', kcal: 500, protein: 25, group: 'avoid' },
  { id: 'fried-rice', name: 'Fried rice', portion: '1 portion', kcal: 700, protein: 15, group: 'avoid' },
  { id: 'samosa', name: 'Samosa', portion: '1', kcal: 260, protein: 4, group: 'avoid' },
  { id: 'falooda', name: 'Falooda or sweet drinks', portion: '1 glass', kcal: 400, protein: 8, group: 'avoid' },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export const GROUP_LABEL: Record<Food['group'], string> = {
  home: 'Home',
  go: 'Go',
  careful: 'Careful',
  avoid: 'Avoid',
};

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  suhoor: 'Suhoor',
  iftar: 'Iftar',
  main: 'Main meal',
  afterGym: 'After gym',
};

export const DEFAULT_BREAKFAST: Settings['defaultBreakfast'] = [
  { foodId: 'chapati', name: 'Chapati', kcal: 120, protein: 4, qty: 2 },
  { foodId: 'omelette-2', name: '2-egg omelette', kcal: 185, protein: 12.5, qty: 1 },
  { foodId: 'beef-curry', name: 'Beef curry', kcal: 185, protein: 15, qty: 1 },
  { foodId: 'milk-tea', name: 'Milk tea, no sugar', kcal: 40, protein: 2, qty: 1 },
];

/** Applies any user override to a food's values. */
export function foodValues(food: Food, s: Pick<Settings, 'foodOverrides'>): { kcal: number; protein: number } {
  return s.foodOverrides[food.id] ?? { kcal: food.kcal, protein: food.protein };
}
