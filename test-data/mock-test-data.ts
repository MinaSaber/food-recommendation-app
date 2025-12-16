/**
 * Comprehensive Mock Test Data for Recommendation System
 * Use this data for integration and end-to-end testing
 */

import { Prisma } from '../../generated/prisma/client';

export const mockUsers = {
  vegetarianUser: {
    id: 1,
    dietaryPreferences: ['vegetarian'],
    age: 25,
    gender: 'female',
    budgetPreference: 'medium',
  },
  veganUser: {
    id: 2,
    dietaryPreferences: ['vegan'],
    age: 30,
    gender: 'male',
    budgetPreference: 'high',
  },
  meatLover: {
    id: 3,
    dietaryPreferences: null,
    age: 35,
    gender: 'male',
    budgetPreference: 'high',
  },
  dairyFreeUser: {
    id: 4,
    dietaryPreferences: ['dairy-free'],
    age: 28,
    gender: 'female',
    budgetPreference: 'medium',
  },
  noPreferences: {
    id: 5,
    dietaryPreferences: null,
    age: null,
    gender: null,
    budgetPreference: null,
  },
};

export const mockFoodItems = [
  // Main dishes with meat
  {
    id: 1,
    name: 'Fried Chicken with Rice',
    description: 'Crispy fried chicken served with rice and salad',
    ingredients: ['chicken', 'rice', 'lettuce'],
    category: 'Meal',
    tags: ['meal', 'chicken', 'fried'],
    price: new Prisma.Decimal(50),
    rating: new Prisma.Decimal(4.5),
  },
  {
    id: 2,
    name: 'Half chicken + kofta meal',
    description:
      'Half chicken and 3 pieces of kofta, served with rice, green salad, sesame paste and bread',
    ingredients: ['chicken', 'kofta', 'rice', 'bread', 'sesame'],
    category: 'Meal',
    tags: ['meal', 'chicken', 'kofta', 'combo'],
    price: new Prisma.Decimal(100),
    rating: new Prisma.Decimal(5.0),
  },
  {
    id: 3,
    name: 'Beef Burger',
    description: 'Juicy beef burger with cheese and mushrooms',
    ingredients: ['beef', 'bread', 'cheese', 'mushrooms'],
    category: 'Main Course',
    tags: ['burger', 'beef'],
    price: new Prisma.Decimal(40),
    rating: new Prisma.Decimal(4.0),
  },
  // Vegetarian dishes
  {
    id: 4,
    name: 'Vegetable Salad',
    description: 'Fresh vegetables with dressing',
    ingredients: ['lettuce', 'tomato', 'cucumber', 'dressing'],
    category: 'Salad',
    tags: ['salad', 'vegetarian'],
    price: new Prisma.Decimal(20),
    rating: new Prisma.Decimal(4.5),
  },
  {
    id: 5,
    name: 'Sesame Paste Salad',
    description: 'Made with a blend of vegetables and sesame paste',
    ingredients: ['sesame', 'lettuce', 'tomato'],
    category: 'Salad',
    tags: ['salad', 'vegetarian'],
    price: new Prisma.Decimal(18),
    rating: new Prisma.Decimal(4.0),
  },
  // Soups
  {
    id: 6,
    name: 'Mushroom Soup',
    description: 'Creamy mushroom soup with herbs',
    ingredients: ['mushrooms', 'cream', 'onion', 'garlic'],
    category: 'Soup',
    tags: ['soup', 'vegetarian'],
    price: new Prisma.Decimal(25),
    rating: new Prisma.Decimal(4.2),
  },
  // Side dishes
  {
    id: 7,
    name: 'Fried Rice',
    description: 'Classic fried rice with eggs and vegetables',
    ingredients: ['rice', 'eggs', 'peas', 'carrots'],
    category: 'Side Dish',
    tags: ['side', 'rice'],
    price: new Prisma.Decimal(15),
    rating: new Prisma.Decimal(4.0),
  },
  // Items with dairy
  {
    id: 8,
    name: 'Cheese Pizza',
    description: 'Classic cheese pizza',
    ingredients: ['cheese', 'dough', 'tomato', 'oregano'],
    category: 'Main Course',
    tags: ['pizza', 'vegetarian'],
    price: new Prisma.Decimal(35),
    rating: new Prisma.Decimal(4.3),
  },
  // Items with gluten
  {
    id: 9,
    name: 'Wheat Bread',
    description: 'Fresh baked wheat bread',
    ingredients: ['wheat', 'flour', 'yeast'],
    category: 'Side Dish',
    tags: ['bread'],
    price: new Prisma.Decimal(5),
    rating: new Prisma.Decimal(4.0),
  },
  // Combo items
  {
    id: 10,
    name: 'Quarter chicken meal',
    description: 'A quarter of a chicken leg with rice',
    ingredients: ['chicken', 'rice'],
    category: 'Meal',
    tags: ['meal', 'chicken'],
    price: new Prisma.Decimal(30),
    rating: new Prisma.Decimal(4.0),
  },
];

export const mockEvents = {
  vegetarianUserEvents: [
    {
      id: 1,
      userId: 1,
      itemId: 4,
      eventType: 'order',
      value: new Prisma.Decimal(5),
      createdAt: new Date('2024-12-01T10:00:00Z'),
      foodItem: {
        id: 4,
        name: 'Vegetable Salad',
        description: 'Fresh vegetables with dressing',
        ingredients: ['lettuce', 'tomato', 'cucumber', 'dressing'],
        category: 'Salad',
        tags: ['salad', 'vegetarian'],
      },
    },
    {
      id: 2,
      userId: 1,
      itemId: 5,
      eventType: 'order',
      value: new Prisma.Decimal(5),
      createdAt: new Date('2024-12-05T10:00:00Z'),
      foodItem: {
        id: 5,
        name: 'Sesame Paste Salad',
        description: 'Made with a blend of vegetables and sesame paste',
        ingredients: ['sesame', 'lettuce', 'tomato'],
        category: 'Salad',
        tags: ['salad', 'vegetarian'],
      },
    },
  ],
  meatLoverEvents: [
    {
      id: 3,
      userId: 3,
      itemId: 2,
      eventType: 'order',
      value: new Prisma.Decimal(5),
      createdAt: new Date('2024-12-10T10:00:00Z'), // Recent
      foodItem: {
        id: 2,
        name: 'Half chicken + kofta meal',
        description:
          'Half chicken and 3 pieces of kofta, served with rice, green salad, sesame paste and bread',
        ingredients: ['chicken', 'kofta', 'rice', 'bread', 'sesame'],
        category: 'Meal',
        tags: ['meal', 'chicken', 'kofta', 'combo'],
      },
    },
    {
      id: 4,
      userId: 3,
      itemId: 1,
      eventType: 'order',
      value: new Prisma.Decimal(4),
      createdAt: new Date('2024-11-01T10:00:00Z'), // Old
      foodItem: {
        id: 1,
        name: 'Fried Chicken with Rice',
        description: 'Crispy fried chicken served with rice and salad',
        ingredients: ['chicken', 'rice', 'lettuce'],
        category: 'Meal',
        tags: ['meal', 'chicken', 'fried'],
      },
    },
  ],
  noEvents: [],
};

export const mockRestaurants = [
  {
    id: 1,
    name: 'Test Restaurant',
    description: 'A test restaurant',
    latitude: new Prisma.Decimal(30.0444),
    longitude: new Prisma.Decimal(31.2357),
    rating: new Prisma.Decimal(4.5),
    areaId: 1,
  },
];

/**
 * Expected scoring scenarios for validation
 */
export const expectedScores = {
  vegetarianUserWithMeatItem: {
    dietaryScore: 0,
    reason: 'Hard conflict - vegetarian cannot have meat',
  },
  vegetarianUserWithVegetarianItem: {
    dietaryScore: { min: 6.5, max: 10 },
    reason: 'Should be boosted for matching preference',
  },
  mainIngredientMatch: {
    ingredientScore: { min: 8, max: 10 },
    reason: 'Main ingredient match should score high',
  },
  sideIngredientMatch: {
    ingredientScore: { min: 0, max: 4 },
    reason: 'Side ingredient match should score low',
  },
  exactTagMatch: {
    tagScore: { min: 8, max: 10 },
    reason: 'Exact tag combination should score high',
  },
  partialTagMatch: {
    tagScore: { min: 5, max: 8 },
    reason: 'Partial tag match should score medium',
  },
};

/**
 * Test scenarios for edge cases
 */
export const edgeCaseScenarios = {
  emptyIngredients: {
    name: 'Test Item',
    description: 'Test description',
    ingredients: [],
    expectedResult: [],
  },
  nullCategory: {
    name: 'Test Item',
    description: 'Test description',
    ingredients: ['chicken'],
    category: null,
    expectedResult: 'Should use linguistic patterns only',
  },
  veryLongName: {
    name: 'A'.repeat(500),
    description: 'Test description',
    ingredients: ['chicken'],
    expectedResult: 'Should handle gracefully',
  },
  specialCharacters: {
    name: 'Chicken & Rice 🍗',
    description: 'Test description',
    ingredients: ['chicken', 'rice'],
    expectedResult: 'Should extract correctly',
  },
  duplicateIngredients: {
    name: 'Chicken Meal',
    description: 'Test description',
    ingredients: ['chicken', 'chicken', 'rice'],
    expectedResult: 'Should remove duplicates',
  },
  caseInsensitive: {
    name: 'CHICKEN MEAL',
    description: 'Chicken with RICE',
    ingredients: ['Chicken', 'RICE'],
    expectedResult: 'Should match case-insensitively',
  },
};


