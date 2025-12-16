import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantRecommendationsRepository } from './restaurant-recommendations.repository';
import {
  ScoredFoodItemDto,
  ScoreBreakdownDto,
  InteractionScoreBreakdownDto,
  IngredientScoreDto,
  TagScoreDto,
} from './dtos/scored-food-item.dto';
import {
  IngredientExtractorService,
  ScoredIngredient,
} from '../ingredient-extractor/ingreadient-extractor.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { Prisma } from '../../generated/prisma/client';

const execAsync = promisify(exec);

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: Prisma.Decimal | number;
  ingredients: string[];
  rating: Prisma.Decimal | number;
  category?: string | null;
  tags?: string[] | null;
}

interface User {
  id: number;
  dietaryPreferences: any;
  age: number | null;
  gender: string | null;
  budgetPreference: string | null;
}

interface UserEvent {
  id: number;
  userId: number;
  itemId: number;
  eventType: string;
  value: number;
  createdAt: Date;
  foodItem: {
    id: number;
    ingredients: string[];
    name: string;
    description: string;
    category?: string | null;
    tags?: string[] | null;
  };
}

@Injectable()
export class RestaurantRecommendationsService {
  private readonly mlModelPath = path.join(process.cwd(), 'ml', 'model.pkl');

  constructor(
    private readonly repository: RestaurantRecommendationsRepository,
    private readonly ingredientExtractor: IngredientExtractorService,
  ) {}

  /**
   * Get recommendations for a restaurant
   */
  async getRecommendations(
    restaurantId: number,
    userId: number,
  ): Promise<ScoredFoodItemDto[]> {
    // Verify restaurant exists
    const restaurantExists =
      await this.repository.restaurantExists(restaurantId);
    if (!restaurantExists) {
      throw new NotFoundException(
        `Restaurant with ID ${restaurantId} not found`,
      );
    }

    // Get food items for the restaurant
    const foodItems =
      await this.repository.getFoodItemsByRestaurantId(restaurantId);

    if (foodItems.length === 0) {
      return [];
    }

    // Get user data
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Score all food items
    const scoredItems = await Promise.all(
      foodItems.map(async (item) => {
        const dietaryScore = this.calculateDietaryPreferenceScore(item, user);
        const interactionBreakdown =
          await this.calculateInteractionScoreWithBreakdown(item, userId);
        const collaborativeScore = await this.calculateCollaborativeScore(
          item,
          userId,
        );

        const scoreBreakdown: ScoreBreakdownDto = {
          dietaryPreferenceScore: dietaryScore,
          interactionScore: interactionBreakdown.totalScore,
          interactionScoreBreakdown: interactionBreakdown,
          collaborativeScore: collaborativeScore,
        };

        const finalScore = this.combineScores(scoreBreakdown);

        // Convert Prisma Decimal types to numbers
        const price =
          typeof item.price === 'object' && 'toNumber' in item.price
            ? item.price.toNumber()
            : Number(item.price);
        const rating =
          typeof item.rating === 'object' && 'toNumber' in item.rating
            ? item.rating.toNumber()
            : Number(item.rating);

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: price,
          ingredients: item.ingredients,
          rating: rating,
          score: finalScore,
          scoreBreakdown,
        } as ScoredFoodItemDto;
      }),
    );

    // Sort by score (descending)
    return scoredItems.sort((a, b) => b.score - a.score);
  }

  /**
   * Factor 1: Calculate dietary preference score (0-10)
   */
  calculateDietaryPreferenceScore(foodItem: FoodItem, user: User): number {
    // Start with base score from item rating (0-5 scale, convert to 0-10)
    let baseScore = 5.0; // Default neutral score
    if (foodItem.rating != null) {
      // Handle Prisma Decimal type
      const rating =
        typeof foodItem.rating === 'object' && 'toNumber' in foodItem.rating
          ? foodItem.rating.toNumber()
          : Number(foodItem.rating);
      if (rating > 0) {
        baseScore = Math.min(10.0, Math.max(0.0, rating * 2.0));
      }
    }

    // If no dietary preferences, return base score
    const dietaryPrefs = user.dietaryPreferences;
    if (
      !dietaryPrefs ||
      !Array.isArray(dietaryPrefs) ||
      dietaryPrefs.length === 0
    ) {
      return baseScore;
    }

    // Normalize dietary preferences to lowercase
    const prefs = dietaryPrefs.map((p: string) => String(p).toLowerCase());

    // Create searchable text from ingredients, name, and description
    const itemIngredients = (foodItem.ingredients || []).map((ing) =>
      String(ing).toLowerCase(),
    );
    const itemName = String(foodItem.name || '').toLowerCase();
    const itemDescription = String(foodItem.description || '').toLowerCase();
    const searchableText = [...itemIngredients, itemName, itemDescription].join(
      ' ',
    );

    // Define keywords
    const vegetarianKeywords = ['vegetarian', 'vegan'];
    const meatKeywords = [
      'chicken',
      'beef',
      'pork',
      'lamb',
      'duck',
      'turkey',
      'meat',
      'fish',
      'seafood',
      'bacon',
      'sausage',
      'ham',
    ];
    const dairyKeywords = [
      'milk',
      'cheese',
      'butter',
      'cream',
      'yogurt',
      'dairy',
      'cheddar',
      'mozzarella',
      'parmesan',
    ];
    const glutenKeywords = ['wheat', 'flour', 'bread', 'pasta', 'gluten'];

    // Check user preferences
    const isVegetarian = prefs.some((pref) =>
      vegetarianKeywords.some((kw) => pref.includes(kw)),
    );
    const isVegan = prefs.some((pref) => pref.includes('vegan'));
    const isDairyFree = prefs.some(
      (pref) => pref.includes('dairy-free') || pref.includes('dairy_free'),
    );
    const isGlutenFree = prefs.some(
      (pref) => pref.includes('gluten-free') || pref.includes('gluten_free'),
    );

    // Check item content
    const hasMeat = meatKeywords.some((meat) => searchableText.includes(meat));
    const hasDairy = dairyKeywords.some((dairy) =>
      searchableText.includes(dairy),
    );
    const hasGluten = glutenKeywords.some((gluten) =>
      searchableText.includes(gluten),
    );

    let score = baseScore;

    // Apply penalties for conflicts
    if ((isVegetarian || isVegan) && hasMeat) {
      score = 0; // Hard conflict
    }

    if (isVegan && hasDairy) {
      score = 0; // Hard conflict
    }

    if (isDairyFree && hasDairy) {
      score = score * 0.5; // 50% reduction
    }

    if (isGlutenFree && hasGluten) {
      score = score * 0.5; // 50% reduction
    }

    // Apply bonuses for matches (only if no conflicts)
    if (score > 0) {
      if (isVegetarian && !hasMeat) {
        score = Math.min(10.0, score * 1.3); // 30% boost
      }
      if (isVegan && !hasMeat && !hasDairy) {
        score = Math.min(10.0, score * 1.3); // 30% boost
      }
      if (isDairyFree && !hasDairy) {
        score = Math.min(10.0, score * 1.2); // 20% boost
      }
      if (isGlutenFree && !hasGluten) {
        score = Math.min(10.0, score * 1.2); // 20% boost
      }
    }

    return Math.max(0.0, Math.min(10.0, score));
  }

  /**
   * Factor 2: Calculate interaction score based on user's past interactions (0-10)
   * Now includes ingredient importance scoring and tag-based matching
   */
  async calculateInteractionScore(
    foodItem: FoodItem,
    userId: number,
  ): Promise<number> {
    const breakdown = await this.calculateInteractionScoreWithBreakdown(
      foodItem,
      userId,
    );
    return breakdown.totalScore;
  }

  /**
   * Calculate interaction score with detailed breakdown
   */
  async calculateInteractionScoreWithBreakdown(
    foodItem: FoodItem,
    userId: number,
  ): Promise<InteractionScoreBreakdownDto> {
    // Get user's past events with food items
    const eventsData = await this.repository.getUserEventsWithFoodItems(userId);
    const events = eventsData as unknown as UserEvent[];

    if (events.length === 0) {
      return {
        ingredientScore: 0,
        tagScore: 0,
        ingredientMatches: [],
        tagMatches: [],
        combinationBonus: 0,
        totalScore: 0,
      };
    }

    // Calculate ingredient score with importance
    const ingredientResult = await this.calculateIngredientMatchScore(
      foodItem,
      events,
    );

    // Calculate tag score
    const tagResult = this.calculateTagMatchScore(foodItem, events);

    // Combine scores (60% ingredients, 40% tags)
    const totalScore = ingredientResult.score * 0.6 + tagResult.score * 0.4;

    return {
      ingredientScore: ingredientResult.score,
      tagScore: tagResult.score,
      ingredientMatches: ingredientResult.matches,
      tagMatches: tagResult.matches,
      combinationBonus: tagResult.combinationBonus,
      totalScore: Math.max(0.0, Math.min(10.0, totalScore)),
    };
  }

  /**
   * Calculate ingredient match score with importance weighting
   */
  private async calculateIngredientMatchScore(
    foodItem: FoodItem,
    events: UserEvent[],
  ): Promise<{
    score: number;
    matches: IngredientScoreDto[];
  }> {
    // Get scored ingredients for current food item
    const currentScoredIngredients =
      this.ingredientExtractor.extractIngredientsWithScores(
        foodItem.name,
        foodItem.description,
        foodItem.ingredients || [],
        foodItem.category || undefined,
      );

    // Build preferred ingredients from past interactions (with importance scores)
    const preferredIngredients = new Map<
      string,
      { weight: number; importanceScore: number }
    >(); // ingredient -> {weight, importanceScore}
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const event of events) {
      const eventDate = new Date(event.createdAt);
      const isRecent = eventDate >= thirtyDaysAgo;
      const timeWeight = isRecent ? 2.0 : 1.0;

      if (event.foodItem?.ingredients) {
        // Get scored ingredients for past event
        const eventScoredIngredients =
          this.ingredientExtractor.extractIngredientsWithScores(
            event.foodItem.name,
            event.foodItem.description,
            event.foodItem.ingredients,
            event.foodItem.category || undefined,
          );

        for (const scoredIng of eventScoredIngredients) {
          const ing = scoredIng.name.toLowerCase();
          const existing = preferredIngredients.get(ing) || {
            weight: 0,
            importanceScore: 0,
          };

          // Weight by time and importance
          const importanceWeight = scoredIng.score; // 0.0 to 1.0
          preferredIngredients.set(ing, {
            weight: existing.weight + timeWeight,
            importanceScore:
              (existing.importanceScore * existing.weight +
                importanceWeight * timeWeight) /
              (existing.weight + timeWeight), // Weighted average
          });
        }
      }
    }

    if (preferredIngredients.size === 0) {
      return {
        score: 5.0,
        matches: [],
      };
    }

    // Match current ingredients with preferred ingredients
    const matches: IngredientScoreDto[] = [];
    let matchingWeight = 0;
    let totalWeight = 0;

    for (const [prefIng, prefData] of preferredIngredients.entries()) {
      totalWeight += prefData.weight;

      // Find matching ingredient in current item
      const matchedIngredient = currentScoredIngredients.find(
        (ing) =>
          ing.name.toLowerCase().includes(prefIng) ||
          prefIng.includes(ing.name.toLowerCase()),
      );

      if (matchedIngredient) {
        // Weight by both preference importance and current importance
        const matchWeight =
          prefData.weight * prefData.importanceScore * matchedIngredient.score;
        matchingWeight += matchWeight;

        matches.push({
          name: matchedIngredient.name,
          score: matchedIngredient.score,
          role: matchedIngredient.role,
        });
      }
    }

    // Calculate score: (matching_weight / total_weight) * 10
    const score = totalWeight > 0 ? (matchingWeight / totalWeight) * 10 : 5.0;

    return {
      score: Math.max(0.0, Math.min(10.0, score)),
      matches,
    };
  }

  /**
   * Calculate tag match score with multi-tag bonuses
   */
  private calculateTagMatchScore(
    foodItem: FoodItem,
    events: UserEvent[],
  ): {
    score: number;
    matches: TagScoreDto[];
    combinationBonus: number;
  } {
    const itemTags = (foodItem.tags || []).map((t) => String(t).toLowerCase());

    if (itemTags.length === 0) {
      return {
        score: 5.0,
        matches: [],
        combinationBonus: 0,
      };
    }

    // Build preferred tags from past interactions
    const preferredTags = new Map<string, number>(); // tag -> weighted count
    const preferredTagCombinations = new Map<string, number>(); // "tag1,tag2" -> count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Define tag importance weights
    const tagWeights: Record<string, number> = {
      // Product types (HIGH)
      meal: 1.0,
      burger: 1.0,
      sandwich: 1.0,
      pizza: 1.0,
      pasta: 1.0,
      soup: 1.0,
      salad: 1.0,
      appetizer: 1.0,
      // Main ingredients (MEDIUM)
      chicken: 0.8,
      beef: 0.8,
      pork: 0.8,
      vegetarian: 0.8,
      seafood: 0.8,
      kofta: 0.8,
      kebab: 0.8,
      // Characteristics (LOW)
      spicy: 0.5,
      grilled: 0.5,
      fried: 0.5,
      combo: 0.5,
      signature: 0.5,
      mild: 0.5,
    };

    for (const event of events) {
      const eventDate = new Date(event.createdAt);
      const isRecent = eventDate >= thirtyDaysAgo;
      const timeWeight = isRecent ? 2.0 : 1.0;

      if (event.foodItem?.tags && Array.isArray(event.foodItem.tags)) {
        const eventTags = event.foodItem.tags.map((t) =>
          String(t).toLowerCase(),
        );

        // Track individual tags
        for (const tag of eventTags) {
          const tagWeight = tagWeights[tag] || 0.6; // Default weight
          preferredTags.set(
            tag,
            (preferredTags.get(tag) || 0) + timeWeight * tagWeight,
          );
        }

        // Track tag combinations (sorted for consistency)
        if (eventTags.length > 1) {
          const sortedTags = [...eventTags].sort();
          const combination = sortedTags.join(',');
          preferredTagCombinations.set(
            combination,
            (preferredTagCombinations.get(combination) || 0) + timeWeight,
          );
        }
      }
    }

    if (preferredTags.size === 0) {
      return {
        score: 5.0,
        matches: [],
        combinationBonus: 0,
      };
    }

    // Calculate individual tag matches
    const matches: TagScoreDto[] = [];
    let matchingWeight = 0;
    let totalWeight = 0;

    for (const [prefTag, weight] of preferredTags.entries()) {
      totalWeight += weight;
      const matched = itemTags.includes(prefTag);

      if (matched) {
        matchingWeight += weight;
      }

      matches.push({
        tag: prefTag,
        matched,
        weight,
      });
    }

    // Calculate combination bonus
    let combinationBonus = 0;
    if (itemTags.length > 1) {
      const sortedItemTags = [...itemTags].sort();
      const itemCombination = sortedItemTags.join(',');

      // Check for exact combination match
      if (preferredTagCombinations.has(itemCombination)) {
        combinationBonus = preferredTagCombinations.get(itemCombination)! * 2.0; // 2x bonus
      } else {
        // Check for partial combination matches
        for (const [combo, weight] of preferredTagCombinations.entries()) {
          const comboTags = combo.split(',');
          const matchingCount = comboTags.filter((t) =>
            itemTags.includes(t),
          ).length;
          if (matchingCount >= 2) {
            // At least 2 tags match
            combinationBonus +=
              weight * (matchingCount / comboTags.length) * 1.5;
          }
        }
      }
    }

    // Multi-tag bonus (more tags = more signals)
    const tagCountBonus = itemTags.length > 1 ? itemTags.length * 0.1 : 0;

    // Calculate base score
    const baseScore =
      totalWeight > 0 ? (matchingWeight / totalWeight) * 10 : 5.0;

    // Apply bonuses
    const finalScore = Math.min(
      10.0,
      baseScore +
        (combinationBonus / Math.max(totalWeight, 1)) * 2.0 + // Combination bonus
        tagCountBonus, // Multi-tag bonus
    );

    return {
      score: Math.max(0.0, Math.min(10.0, finalScore)),
      matches,
      combinationBonus,
    };
  }

  /**
   * Factor 3: Calculate collaborative filtering score using LightFM (0-10)
   * Falls back to content-based scoring (dietary + interaction) if ML unavailable
   */
  async calculateCollaborativeScore(
    foodItem: FoodItem,
    userId: number,
  ): Promise<number> {
    // Check if model exists
    if (!fs.existsSync(this.mlModelPath)) {
      // No model available, use content-based fallback
      return this.calculateContentBasedFallback(foodItem, userId);
    }

    try {
      // Prepare food items data for ML prediction
      // Handle Prisma Decimal type conversion
      const rating =
        typeof foodItem.rating === 'object' && 'toNumber' in foodItem.rating
          ? foodItem.rating.toNumber()
          : Number(foodItem.rating);

      const foodItemsJson = JSON.stringify([
        {
          id: foodItem.id,
          name: foodItem.name,
          description: foodItem.description,
          ingredients: foodItem.ingredients,
          rating: rating,
        },
      ]);

      // Get user features (dietary preferences, preferred ingredients)
      const user = await this.repository.getUserById(userId);
      const userEventsData =
        await this.repository.getUserEventsWithFoodItems(userId);
      const userEvents = userEventsData as unknown as UserEvent[];

      // Extract preferred ingredients from events
      const preferredIngredients = new Set<string>();
      for (const event of userEvents) {
        if (event.foodItem?.ingredients) {
          for (const ingredient of event.foodItem.ingredients) {
            preferredIngredients.add(String(ingredient).toLowerCase());
          }
        }
      }

      const userFeatures = {
        dietary_preferences: user?.dietaryPreferences || [],
        preferred_ingredients: Array.from(preferredIngredients),
      };

      const userFeaturesJson = JSON.stringify(userFeatures);

      // Call Python prediction script
      const pythonScriptPath = path.join(process.cwd(), 'ml', 'predict.py');

      // Escape JSON strings for shell command (they're already JSON strings)
      // Use proper shell escaping by wrapping in single quotes and escaping internal quotes
      const escapedFoodItemsJson = foodItemsJson.replace(/'/g, "'\\''");
      const escapedUserFeaturesJson = userFeaturesJson.replace(/'/g, "'\\''");

      const { stdout, stderr } = await execAsync(
        `python3 "${pythonScriptPath}" ${userId} '${escapedFoodItemsJson}' '${escapedUserFeaturesJson}'`,
      );

      // Check for expected errors (missing dependencies, etc.) and suppress warnings
      if (stderr) {
        const isExpectedError =
          stderr.includes('ModuleNotFoundError') ||
          stderr.includes('No module named') ||
          stderr.includes('DEBUG:');

        if (!isExpectedError) {
          console.warn('ML prediction warning:', stderr);
        }
      }

      // Parse result
      const results = JSON.parse(stdout);
      if (results && results.length > 0) {
        const prediction = results[0].predicted_score;
        // Normalize to 0-10 scale (LightFM predictions might be in different range)
        // Assuming predictions are already in reasonable range, but clamp to 0-10
        return Math.max(0.0, Math.min(10.0, Number(prediction)));
      }

      // Fallback to content-based if parsing fails
      return this.calculateContentBasedFallback(foodItem, userId);
    } catch (error: any) {
      // Check if it's an expected error (missing Python dependencies)
      const errorMessage = error?.message || String(error);
      const isExpectedError =
        errorMessage.includes('ModuleNotFoundError') ||
        errorMessage.includes('No module named') ||
        errorMessage.includes('lightfm');

      // Only log unexpected errors
      if (!isExpectedError) {
        console.warn(
          `ML prediction failed for user ${userId}, item ${foodItem.id}:`,
          error,
        );
      }

      // If ML prediction fails, fallback to content-based scoring
      return this.calculateContentBasedFallback(foodItem, userId);
    }
  }

  /**
   * Content-based fallback for collaborative score when ML is unavailable
   * Combines dietary preference score and interaction score
   */
  private async calculateContentBasedFallback(
    foodItem: FoodItem,
    userId: number,
  ): Promise<number> {
    // Get user data
    const user = await this.repository.getUserById(userId);
    if (!user) {
      return 5.0; // Neutral if user not found
    }

    // Calculate dietary preference score
    const dietaryScore = this.calculateDietaryPreferenceScore(foodItem, user);

    // Calculate interaction score
    const interactionScore = await this.calculateInteractionScore(
      foodItem,
      userId,
    );

    // Combine both scores (average of the two)
    const combinedScore = (dietaryScore + interactionScore) / 2;

    return Math.max(0.0, Math.min(10.0, combinedScore));
  }

  /**
   * Combine all three scores with weights
   * Weights: 60% interaction (user's past behavior), 30% collaborative (ML), 10% dietary preferences
   * This prioritizes actual user interactions - if a user really likes an item,
   * it should score high even if it doesn't perfectly match dietary preferences
   */
  combineScores(breakdown: ScoreBreakdownDto): number {
    const finalScore =
      breakdown.dietaryPreferenceScore * 0.1 + // 10% - dietary preferences
      breakdown.interactionScore * 0.6 + // 60% - user interaction history (most important)
      breakdown.collaborativeScore * 0.3; // 30% - collaborative filtering (ML)

    return Math.max(0.0, Math.min(10.0, finalScore));
  }
}
