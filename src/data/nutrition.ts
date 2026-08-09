import type { Meal, Recipe, ShoppingGroup } from '../types';

/**
 * The weekly meal plan — high protein, high fibre, practical, and carbs
 * placed where the training is. Training days carry more carbohydrate;
 * rest days carry somewhat less. Nothing is eliminated.
 */
export const PROTEIN_TARGET_G = 130;

/** Meals by weekday, 0 = Sunday … 6 = Saturday. */
export const MEAL_PLAN: Record<number, Meal[]> = {
  0: [
    { id: 'sun-1', time: '12:30', name: 'Shakshuka + avocado toast', kcal: 560, protein: 28, recipeId: 'shakshuka' },
    { id: 'sun-2', time: '16:00', name: 'Greek yogurt + fruit', kcal: 260, protein: 22, recipeId: 'yogurt-fruit' },
    { id: 'sun-3', time: '20:00', name: 'Lemon garlic chicken + sweet potato', kcal: 610, protein: 48, recipeId: 'lemon-chicken' },
  ],
  1: [
    { id: 'mon-1', time: '12:30', name: 'Chicken avocado wrap', kcal: 540, protein: 40, recipeId: 'chicken-wrap' },
    { id: 'mon-2', time: '16:00', name: 'Greek yogurt + banana + nuts', kcal: 330, protein: 24, recipeId: 'yogurt-banana' },
    { id: 'mon-3', time: '20:00', name: 'Beef mince rice bowl', kcal: 620, protein: 45, recipeId: 'beef-rice' },
  ],
  2: [
    { id: 'tue-1', time: '12:30', name: 'Protein oats', kcal: 520, protein: 38, recipeId: 'protein-oats' },
    { id: 'tue-2', time: '16:00', name: 'Banana, pre-workout', kcal: 110, protein: 1 },
    { id: 'tue-3', time: '20:00', name: 'Chicken shawarma bowl', kcal: 550, protein: 45, recipeId: 'shawarma-bowl' },
  ],
  3: [
    { id: 'wed-1', time: '12:30', name: 'Tuna potato salad', kcal: 470, protein: 38, recipeId: 'tuna-potato' },
    { id: 'wed-2', time: '16:00', name: 'Greek yogurt + fruit', kcal: 260, protein: 22, recipeId: 'yogurt-fruit' },
    { id: 'wed-3', time: '20:00', name: 'Tilapia + ugali + sukuma wiki', kcal: 560, protein: 44, recipeId: 'tilapia-ugali' },
  ],
  4: [
    { id: 'thu-1', time: '12:30', name: 'Chicken rice bowl', kcal: 580, protein: 45, recipeId: 'chicken-rice' },
    { id: 'thu-2', time: '16:00', name: 'Greek yogurt + banana', kcal: 290, protein: 22, recipeId: 'yogurt-banana' },
    { id: 'thu-3', time: '20:00', name: 'Beef stir fry + rice', kcal: 620, protein: 44, recipeId: 'beef-stirfry' },
  ],
  5: [
    { id: 'fri-1', time: '12:30', name: 'Mediterranean egg plate', kcal: 500, protein: 32, recipeId: 'med-eggs' },
    { id: 'fri-2', time: '16:00', name: 'Apple + nuts + Greek yogurt', kcal: 320, protein: 20, recipeId: 'apple-nuts' },
    { id: 'fri-3', time: '20:00', name: 'Chicken curry + rice', kcal: 640, protein: 46, recipeId: 'chicken-curry' },
  ],
  6: [
    { id: 'sat-1', time: '12:30', name: 'Protein pancakes', kcal: 540, protein: 40, recipeId: 'protein-pancakes' },
    { id: 'sat-2', time: '16:00', name: 'Banana, pre-workout', kcal: 110, protein: 1 },
    { id: 'sat-3', time: '20:00', name: 'Loaded chicken sweet potato bowl', kcal: 600, protein: 47, recipeId: 'loaded-sweet-potato' },
  ],
};

const PROTEIN_SWAPS = ['Tilapia', 'Lean beef', 'Tuna', 'Eggs'];
const CARB_SWAPS = ['Potatoes', 'Sweet potato', 'Ugali', 'Wholegrain wrap'];

export const RECIPES: Record<string, Recipe> = Object.fromEntries(
  [
    {
      id: 'shawarma-bowl',
      name: 'Chicken shawarma bowl',
      kcal: 550,
      protein: 45,
      prepMin: 10,
      cookMin: 15,
      ingredients: ['Chicken', 'Rice', 'Cucumber', 'Tomato', 'Lettuce', 'Red onion', 'Avocado', 'Greek yogurt', 'Lemon', 'Garlic', 'Spices'],
      method: ['Season the chicken.', 'Cook the chicken.', 'Prepare the vegetables.', 'Mix the yogurt sauce.', 'Assemble the bowl.'],
      swaps: [
        { component: 'Chicken', options: PROTEIN_SWAPS },
        { component: 'Rice', options: CARB_SWAPS },
      ],
    },
    {
      id: 'protein-oats',
      name: 'Protein oats',
      kcal: 520,
      protein: 38,
      prepMin: 5,
      cookMin: 5,
      ingredients: ['Oats', 'Milk', 'Whey protein', 'Banana', 'Peanut butter', 'Cinnamon'],
      method: ['Simmer the oats in milk.', 'Stir the protein through off the heat.', 'Top with banana and peanut butter.'],
      swaps: [{ component: 'Oats', options: CARB_SWAPS }],
    },
    {
      id: 'chicken-rice',
      name: 'Chicken rice bowl',
      kcal: 580,
      protein: 45,
      prepMin: 10,
      cookMin: 20,
      ingredients: ['Chicken', 'Rice', 'Broccoli', 'Carrot', 'Soy sauce', 'Garlic', 'Ginger'],
      method: ['Cook the rice.', 'Sear the chicken.', 'Steam the vegetables.', 'Build the bowl and dress it.'],
      swaps: [
        { component: 'Chicken', options: PROTEIN_SWAPS },
        { component: 'Rice', options: CARB_SWAPS },
      ],
    },
    {
      id: 'beef-rice',
      name: 'Beef mince rice bowl',
      kcal: 620,
      protein: 45,
      prepMin: 10,
      cookMin: 20,
      ingredients: ['Beef mince', 'Rice', 'Onion', 'Tomato', 'Peppers', 'Garlic', 'Spices'],
      method: ['Brown the mince.', 'Add onion, peppers and tomato.', 'Simmer until thick.', 'Serve over rice.'],
      swaps: [
        { component: 'Beef mince', options: PROTEIN_SWAPS },
        { component: 'Rice', options: CARB_SWAPS },
      ],
    },
    {
      id: 'beef-stirfry',
      name: 'Beef stir fry + rice',
      kcal: 620,
      protein: 44,
      prepMin: 10,
      cookMin: 15,
      ingredients: ['Beef strips', 'Rice', 'Peppers', 'Onion', 'Broccoli', 'Soy sauce', 'Ginger', 'Garlic'],
      method: ['Cook the rice.', 'Sear the beef hard and fast.', 'Stir fry the vegetables.', 'Combine and dress.'],
      swaps: [
        { component: 'Beef strips', options: PROTEIN_SWAPS },
        { component: 'Rice', options: CARB_SWAPS },
      ],
    },
    {
      id: 'tilapia-ugali',
      name: 'Tilapia + ugali + sukuma wiki',
      kcal: 560,
      protein: 44,
      prepMin: 10,
      cookMin: 25,
      ingredients: ['Tilapia', 'Maize flour', 'Sukuma wiki', 'Onion', 'Tomato', 'Lemon', 'Garlic'],
      method: ['Season and pan-fry the tilapia.', 'Cook the ugali, stirring firm.', 'Fry the sukuma with onion and tomato.', 'Plate together.'],
      swaps: [
        { component: 'Tilapia', options: ['Chicken', 'Lean beef', 'Tuna', 'Eggs'] },
        { component: 'Ugali', options: ['Rice', 'Potatoes', 'Sweet potato', 'Wholegrain wrap'] },
      ],
    },
    {
      id: 'tuna-potato',
      name: 'Tuna potato salad',
      kcal: 470,
      protein: 38,
      prepMin: 15,
      cookMin: 15,
      ingredients: ['Tuna', 'Potatoes', 'Greek yogurt', 'Red onion', 'Cucumber', 'Lemon', 'Olive oil'],
      method: ['Boil the potatoes and cool them.', 'Flake the tuna through.', 'Dress with yogurt, lemon and oil.'],
      swaps: [
        { component: 'Tuna', options: ['Chicken', 'Tilapia', 'Lean beef', 'Eggs'] },
        { component: 'Potatoes', options: ['Rice', 'Sweet potato', 'Ugali', 'Wholegrain wrap'] },
      ],
    },
    {
      id: 'chicken-wrap',
      name: 'Chicken avocado wrap',
      kcal: 540,
      protein: 40,
      prepMin: 10,
      cookMin: 10,
      ingredients: ['Chicken', 'Wholegrain wrap', 'Avocado', 'Lettuce', 'Tomato', 'Greek yogurt', 'Lemon'],
      method: ['Cook and slice the chicken.', 'Warm the wrap.', 'Layer with avocado and salad.', 'Roll tightly and halve.'],
      swaps: [
        { component: 'Chicken', options: PROTEIN_SWAPS },
        { component: 'Wrap', options: ['Rice', 'Potatoes', 'Sweet potato', 'Ugali'] },
      ],
    },
    {
      id: 'chicken-curry',
      name: 'Chicken curry + rice',
      kcal: 640,
      protein: 46,
      prepMin: 10,
      cookMin: 25,
      ingredients: ['Chicken', 'Rice', 'Onion', 'Tomato', 'Garlic', 'Ginger', 'Curry spices', 'Greek yogurt'],
      method: ['Brown the chicken.', 'Soften onion, garlic and ginger.', 'Add spices and tomato, simmer.', 'Finish with yogurt. Serve over rice.'],
      swaps: [
        { component: 'Chicken', options: PROTEIN_SWAPS },
        { component: 'Rice', options: CARB_SWAPS },
      ],
    },
    {
      id: 'lemon-chicken',
      name: 'Lemon garlic chicken + sweet potato',
      kcal: 610,
      protein: 48,
      prepMin: 10,
      cookMin: 30,
      ingredients: ['Chicken', 'Sweet potato', 'Lemon', 'Garlic', 'Olive oil', 'Sukuma wiki', 'Herbs'],
      method: ['Marinate the chicken in lemon and garlic.', 'Roast with the sweet potato.', 'Wilt the greens.', 'Plate and spoon over the pan juices.'],
      swaps: [
        { component: 'Chicken', options: PROTEIN_SWAPS },
        { component: 'Sweet potato', options: ['Rice', 'Potatoes', 'Ugali', 'Wholegrain wrap'] },
      ],
    },
    {
      id: 'loaded-sweet-potato',
      name: 'Loaded chicken sweet potato bowl',
      kcal: 600,
      protein: 47,
      prepMin: 10,
      cookMin: 30,
      ingredients: ['Chicken', 'Sweet potato', 'Black beans', 'Avocado', 'Greek yogurt', 'Lime', 'Spices'],
      method: ['Roast the sweet potato.', 'Season and cook the chicken.', 'Warm the beans.', 'Build the bowl, top with avocado and yogurt.'],
      swaps: [
        { component: 'Chicken', options: PROTEIN_SWAPS },
        { component: 'Sweet potato', options: ['Rice', 'Potatoes', 'Ugali', 'Wholegrain wrap'] },
      ],
    },
    {
      id: 'protein-pancakes',
      name: 'Protein pancakes',
      kcal: 540,
      protein: 40,
      prepMin: 10,
      cookMin: 10,
      ingredients: ['Oats', 'Eggs', 'Whey protein', 'Banana', 'Greek yogurt', 'Berries'],
      method: ['Blend oats, eggs, protein and banana.', 'Cook in a hot non-stick pan.', 'Stack and top with yogurt and berries.'],
      swaps: [{ component: 'Oats', options: CARB_SWAPS }],
    },
    {
      id: 'med-eggs',
      name: 'Mediterranean egg plate',
      kcal: 500,
      protein: 32,
      prepMin: 10,
      cookMin: 10,
      ingredients: ['Eggs', 'Wholegrain bread', 'Tomato', 'Cucumber', 'Olive oil', 'Feta', 'Olives'],
      method: ['Soft-boil or fry the eggs.', 'Chop the salad and dress it.', 'Plate with bread and feta.'],
      swaps: [
        { component: 'Eggs', options: PROTEIN_SWAPS },
        { component: 'Bread', options: CARB_SWAPS },
      ],
    },
    {
      id: 'shakshuka',
      name: 'Shakshuka + avocado toast',
      kcal: 560,
      protein: 28,
      prepMin: 10,
      cookMin: 20,
      ingredients: ['Eggs', 'Tomato', 'Peppers', 'Onion', 'Garlic', 'Wholegrain bread', 'Avocado', 'Spices'],
      method: ['Soften onion, peppers and garlic.', 'Add tomato and spices, simmer.', 'Crack in the eggs and cover.', 'Serve with avocado toast.'],
      swaps: [{ component: 'Bread', options: CARB_SWAPS }],
    },
    {
      id: 'yogurt-fruit',
      name: 'Greek yogurt + fruit',
      kcal: 260,
      protein: 22,
      prepMin: 3,
      cookMin: 0,
      ingredients: ['Greek yogurt', 'Berries', 'Apple', 'Honey'],
      method: ['Spoon the yogurt.', 'Top with fruit and a little honey.'],
      swaps: [],
    },
    {
      id: 'yogurt-banana',
      name: 'Greek yogurt + banana',
      kcal: 290,
      protein: 22,
      prepMin: 3,
      cookMin: 0,
      ingredients: ['Greek yogurt', 'Banana', 'Mixed nuts', 'Honey'],
      method: ['Spoon the yogurt.', 'Top with banana, nuts and honey.'],
      swaps: [],
    },
    {
      id: 'apple-nuts',
      name: 'Apple + nuts + Greek yogurt',
      kcal: 320,
      protein: 20,
      prepMin: 3,
      cookMin: 0,
      ingredients: ['Apple', 'Mixed nuts', 'Greek yogurt'],
      method: ['Slice the apple.', 'Serve with yogurt and a handful of nuts.'],
      swaps: [],
    },
  ].map((r) => [r.id, r as Recipe]),
);

/**
 * The week's shopping, aggregated from the plan and grouped the way a shop
 * is walked rather than the way the recipes are written.
 */
export const SHOPPING_LIST: ShoppingGroup[] = [
  {
    title: 'Protein',
    items: [
      { name: 'Chicken breast', qty: '1.5 kg' },
      { name: 'Eggs', qty: '18' },
      { name: 'Greek yogurt', qty: '2 kg' },
      { name: 'Tilapia', qty: '600 g' },
      { name: 'Beef mince', qty: '500 g' },
      { name: 'Beef strips', qty: '400 g' },
      { name: 'Tuna', qty: '3 tins' },
      { name: 'Whey protein', qty: '1 tub' },
    ],
  },
  {
    title: 'Vegetables',
    items: [
      { name: 'Sukuma wiki', qty: '2 bunches' },
      { name: 'Tomatoes', qty: '1 kg' },
      { name: 'Cucumber', qty: '3' },
      { name: 'Red onion', qty: '1 kg' },
      { name: 'Lettuce', qty: '2 heads' },
      { name: 'Peppers', qty: '4' },
      { name: 'Broccoli', qty: '2 heads' },
      { name: 'Carrots', qty: '500 g' },
    ],
  },
  {
    title: 'Fruit',
    items: [
      { name: 'Bananas', qty: '12' },
      { name: 'Avocados', qty: '5' },
      { name: 'Apples', qty: '6' },
      { name: 'Berries', qty: '400 g' },
      { name: 'Lemons', qty: '4' },
    ],
  },
  {
    title: 'Carbohydrates',
    items: [
      { name: 'Rice', qty: '1 kg' },
      { name: 'Sweet potato', qty: '1.5 kg' },
      { name: 'Potatoes', qty: '1 kg' },
      { name: 'Oats', qty: '1 kg' },
      { name: 'Maize flour', qty: '1 kg' },
      { name: 'Wholegrain wraps', qty: '1 pack' },
      { name: 'Wholegrain bread', qty: '1 loaf' },
    ],
  },
  {
    title: 'Fats & pantry',
    items: [
      { name: 'Olive oil', qty: '500 ml' },
      { name: 'Mixed nuts', qty: '400 g' },
      { name: 'Peanut butter', qty: '1 jar' },
      { name: 'Feta', qty: '200 g' },
      { name: 'Black beans', qty: '2 tins' },
      { name: 'Shawarma spice', qty: '1 jar' },
      { name: 'Curry spices', qty: '1 jar' },
      { name: 'Honey', qty: '1 jar' },
    ],
  },
];

export function getRecipe(id: string): Recipe | undefined {
  return RECIPES[id];
}
