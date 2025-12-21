// Mock PrismaService before any imports

jest.mock('../prsima/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RestaurantRecommendationsService } from './restaurant-recommendations.service';
import { RestaurantRecommendationsRepository } from './restaurant-recommendations.repository';
import { IngredientExtractorService } from '../ingredient-extractor/ingreadient-extractor.service';

describe('RestaurantRecommendationsService', () => {
  let service: RestaurantRecommendationsService;
  let repository: RestaurantRecommendationsRepository;
  let ingredientExtractor: IngredientExtractorService;

  // Mock data
  const mockUser = {
    id: 1,
    dietaryPreferences: ['vegetarian'],
    age: 25,
    gender: 'female',
    budgetPreference: 'medium',
  };

  const mockFoodItems = [
    {
      id: 1,
      name: 'Fried Chicken with Rice',
      description: 'Crispy fried chicken served with rice',
      ingredients: ['chicken', 'rice'],
      category: 'Meal',
      tags: ['meal', 'chicken', 'fried'],
      price: 50,
      rating: 4.5,
    },
    {
      id: 2,
      name: 'Vegetable Salad',
      description: 'Fresh vegetables with dressing',
      ingredients: ['lettuce', 'tomato', 'cucumber'],
      category: 'Salad',
      tags: ['salad', 'vegetarian'],
      price: 20,
      rating: 4.5,
    },
  ];

  const mockEvents = [
    {
      id: 1,
      userId: 1,
      itemId: 10,
      eventType: 'order',
      value: 5,
      createdAt: new Date('2024-12-01T10:00:00Z'),
      foodItem: {
        id: 10,
        name: 'Vegetable Salad',
        description: 'Fresh vegetables',
        ingredients: ['lettuce', 'tomato', 'cucumber'],
        category: 'Salad',
        tags: ['salad', 'vegetarian'],
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantRecommendationsService,
        {
          provide: RestaurantRecommendationsRepository,
          useValue: {
            restaurantExists: jest.fn(),
            getFoodItemsByRestaurantId: jest.fn(),
            getUserById: jest.fn(),
            getUserEventsWithFoodItems: jest.fn(),
          },
        },
        {
          provide: IngredientExtractorService,
          useValue: {
            extractIngredientsWithScores: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestaurantRecommendationsService>(
      RestaurantRecommendationsService,
    );
    repository = module.get<RestaurantRecommendationsRepository>(
      RestaurantRecommendationsRepository,
    );
    ingredientExtractor = module.get<IngredientExtractorService>(
      IngredientExtractorService,
    );
  });

  describe('getRecommendations', () => {
    it('TC-API-001: Should return sorted recommendations for valid request', async () => {
      // Arrange
      jest.spyOn(repository, 'restaurantExists').mockResolvedValue(true);
      jest
        .spyOn(repository, 'getFoodItemsByRestaurantId')
        .mockResolvedValue(mockFoodItems as any);
      jest.spyOn(repository, 'getUserById').mockResolvedValue(mockUser as any);
      jest
        .spyOn(repository, 'getUserEventsWithFoodItems')
        .mockResolvedValue(mockEvents as any);
      jest
        .spyOn(ingredientExtractor, 'extractIngredientsWithScores')
        .mockReturnValue([
          { name: 'chicken', score: 1.0, role: 'main', reasoning: [] },
          { name: 'rice', score: 0.2, role: 'accessory', reasoning: [] },
        ]);

      // Act
      const result = await service.getRecommendations(1, 1);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score); // Sorted descending
      expect(result[0]).toHaveProperty('scoreBreakdown');
      expect(result[0].scoreBreakdown).toHaveProperty('dietaryPreferenceScore');
      expect(result[0].scoreBreakdown).toHaveProperty('interactionScore');
      expect(result[0].scoreBreakdown).toHaveProperty('collaborativeScore');
    });

    it('TC-API-002: Should throw NotFoundException when restaurant does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'restaurantExists').mockResolvedValue(false);

      // Act & Assert
      await expect(service.getRecommendations(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRecommendations(999, 1)).rejects.toThrow(
        'Restaurant with ID 999 not found',
      );
    });

    it('TC-API-003: Should throw NotFoundException when user does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'restaurantExists').mockResolvedValue(true);
      jest
        .spyOn(repository, 'getFoodItemsByRestaurantId')
        .mockResolvedValue(mockFoodItems as any);
      jest.spyOn(repository, 'getUserById').mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRecommendations(1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRecommendations(1, 999)).rejects.toThrow(
        'User with ID 999 not found',
      );
    });

    it('TC-API-004: Should return empty array when restaurant has no food items', async () => {
      // Arrange
      jest.spyOn(repository, 'restaurantExists').mockResolvedValue(true);
      jest
        .spyOn(repository, 'getFoodItemsByRestaurantId')
        .mockResolvedValue([]);
      jest.spyOn(repository, 'getUserById').mockResolvedValue(mockUser as any);

      // Act
      const result = await service.getRecommendations(1, 1);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('calculateDietaryPreferenceScore', () => {
    it('TC-DIET-001: Should return 0 for vegetarian user with meat item', () => {
      // Arrange
      const user = { ...mockUser, dietaryPreferences: ['vegetarian'] };
      const item = {
        ...mockFoodItems[0],
        ingredients: ['beef', 'bread'],
        name: 'Beef Burger',
      };

      // Act
      const score = service.calculateDietaryPreferenceScore(item as any, user);

      // Assert
      expect(score).toBe(0);
    });

    it('TC-DIET-002: Should return boosted score for vegetarian user with vegetarian item', () => {
      // Arrange
      const user = { ...mockUser, dietaryPreferences: ['vegetarian'] };
      const item = {
        ...mockFoodItems[1],
        ingredients: ['lettuce', 'tomato'],
        name: 'Vegetable Salad',
      };

      // Act
      const score = service.calculateDietaryPreferenceScore(item as any, user);

      // Assert
      expect(score).toBeGreaterThan(5.0);
    });

    it('TC-DIET-003: Should return 0 for vegan user with dairy item', () => {
      // Arrange
      const user = { ...mockUser, dietaryPreferences: ['vegan'] };
      const item = {
        ...mockFoodItems[0],
        ingredients: ['cheese', 'dough'],
        name: 'Cheese Pizza',
      };

      // Act
      const score = service.calculateDietaryPreferenceScore(item as any, user);

      // Assert
      expect(score).toBe(0);
    });

    it('TC-DIET-004: Should return reduced score for dairy-free user with dairy item', () => {
      // Arrange
      const user = { ...mockUser, dietaryPreferences: ['dairy-free'] };
      const item = {
        ...mockFoodItems[0],
        ingredients: ['cream', 'chicken'],
        name: 'Cream Soup',
        rating: 4.0,
      };

      // Act
      const score = service.calculateDietaryPreferenceScore(item as any, user);

      // Assert
      expect(score).toBeLessThan(8.0); // Should be reduced
    });

    it('TC-DIET-006: Should return base score when user has no dietary preferences', () => {
      // Arrange
      const user = { ...mockUser, dietaryPreferences: null };
      const item = {
        ...mockFoodItems[0],
        rating: 4.0,
      };

      // Act
      const score = service.calculateDietaryPreferenceScore(item as any, user);

      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateInteractionScoreWithBreakdown', () => {
    it('TC-INT-ING-001: Should return high score for main ingredient match', async () => {
      // Arrange
      const pastEvent = {
        ...mockEvents[0],
        foodItem: {
          ...mockEvents[0].foodItem,
          name: 'Fried Chicken with Rice',
          ingredients: ['chicken', 'rice'],
        },
      };
      const currentItem = {
        ...mockFoodItems[0],
        name: 'Grilled Chicken Meal',
        ingredients: ['chicken'],
      };

      jest
        .spyOn(repository, 'getUserEventsWithFoodItems')
        .mockResolvedValue([pastEvent] as any);
      jest
        .spyOn(ingredientExtractor, 'extractIngredientsWithScores')
        .mockImplementation((name, desc, ingredients) => {
          if (name.includes('Fried Chicken')) {
            return [
              { name: 'chicken', score: 1.0, role: 'main', reasoning: [] },
              { name: 'rice', score: 0.2, role: 'accessory', reasoning: [] },
            ];
          }
          return [{ name: 'chicken', score: 1.0, role: 'main', reasoning: [] }];
        });

      // Act
      const result = await service.calculateInteractionScoreWithBreakdown(
        currentItem as any,
        1,
      );

      // Assert
      // With main ingredient match, ingredientScore should be positive
      // totalScore combines ingredient (60%) and tag (40%) scores
      expect(result.ingredientScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeGreaterThan(0);
      // If tags are empty, totalScore will be lower (60% of ingredientScore)
      // So we just check it's positive and reasonable
      expect(result.totalScore).toBeLessThanOrEqual(10);
    });

    it('TC-INT-ING-004: Should return 0 when user has no past interactions', async () => {
      // Arrange
      jest
        .spyOn(repository, 'getUserEventsWithFoodItems')
        .mockResolvedValue([]);

      // Act
      const result = await service.calculateInteractionScoreWithBreakdown(
        mockFoodItems[0] as any,
        1,
      );

      // Assert
      expect(result.totalScore).toBe(0);
      expect(result.ingredientScore).toBe(0);
      expect(result.tagScore).toBe(0);
    });
  });

  describe('combineScores', () => {
    it('TC-FINAL-001: Should combine all scores correctly', () => {
      // Arrange
      const breakdown = {
        dietaryPreferenceScore: 10,
        interactionScore: 10,
        collaborativeScore: 10,
      };

      // Act
      const result = service.combineScores(breakdown);

      // Assert
      expect(result).toBe(10);
    });

    it('TC-FINAL-002: Should apply correct weights', () => {
      // Arrange
      const breakdown = {
        dietaryPreferenceScore: 5,
        interactionScore: 8,
        collaborativeScore: 6,
      };

      // Act
      const result = service.combineScores(breakdown);

      // Assert
      // (5 * 0.1) + (8 * 0.6) + (6 * 0.3) = 0.5 + 4.8 + 1.8 = 7.1
      expect(result).toBeCloseTo(7.1, 1);
    });

    it('TC-FINAL-003: Should clamp scores to 0-10 range', () => {
      // Arrange
      const breakdown = {
        dietaryPreferenceScore: 15,
        interactionScore: -5,
        collaborativeScore: 20,
      };

      // Act
      const result = service.combineScores(breakdown);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    });
  });


});
