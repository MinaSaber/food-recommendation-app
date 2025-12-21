// ingredient-extractor.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface ScoredIngredient {
  name: string;
  score: number; // 0.0 to 1.0 (importance weight)
  role: 'main' | 'secondary' | 'accessory';
  reasoning: string[]; // For debugging: why this score?
}

@Injectable()
export class IngredientExtractorService {
  private readonly logger = new Logger(IngredientExtractorService.name);

  // ========================================================================
  // INGREDIENT CATEGORIZATION LISTS
  // ========================================================================

  // Common side dishes (low score unless they're the main dish)
  private readonly COMMON_SIDES = [
    'rice',
    'bread',
    'salad',
    'fries',  // Fixed: removed duplicate
    'chips',
    'potato',
    'potatoes',
  ];

  // Common condiments/sauces (very low score)
  private readonly CONDIMENTS = [
    'mayo',
    'mayonnaise',
    'mustard',
    'ketchup',
    'ranch',
    'bbq sauce',
    'hot sauce',
    'salsa',
    'sauce',
    'dressing',
    'sesame', // sesame paste is usually a side
  ];

  // Proteins (usually main ingredients)
  private readonly PROTEINS = [
    'chicken',
    'beef',
    'pork',
    'turkey',
    'salmon',
    'tuna',
    'shrimp',
    'bacon',
    'ham',
    'sausage',
    'kofta',
    'tofu',
    'lamb',
    'duck',
    'fish',
    'egg',
    'eggs',
  ];

  // Common ingredients database
  private readonly ingredients = [
    // Proteins
    'chicken',
    'beef',
    'pork',
    'turkey',
    'salmon',
    'tuna',
    'shrimp',
    'bacon',
    'ham',
    'sausage',
    'egg',
    'eggs',
    'kofta',
    'tofu',
    'lamb',
    'duck',
    'fish',
    // Vegetables
    'lettuce',
    'tomato',
    'tomatoes',
    'onion',
    'onions',
    'cucumber',
    'pickle',
    'pickles',
    'pepper',
    'peppers',
    'carrot',
    'carrots',
    'spinach',
    'kale',
    'broccoli',
    'mushroom',
    'mushrooms',
    'celery',
    'avocado',
    'corn',
    'cabbage',
    'arugula',
    'zucchini',
    'eggplant',
    'jalapeno',
    'olives',
    // Cheese & Dairy
    'cheese',
    'cheddar',
    'mozzarella',
    'parmesan',
    'swiss',
    'provolone',
    'feta',
    'goat cheese',
    'cream cheese',
    'blue cheese',
    'brie',
    'ricotta',
    'butter',
    'milk',
    'cream',
    'sour cream',
    'yogurt',
    // Bread & Grains
    'bread',
    'bun',
    'roll',
    'bagel',
    'tortilla',
    'wrap',
    'pita',
    'baguette',
    'ciabatta',
    'sourdough',
    'wheat',
    'rye',
    'rice',
    'pasta',
    'noodles',
    'quinoa',
    'couscous',
    'croutons',
    // Sauces & Condiments
    'mayo',
    'mayonnaise',
    'mustard',
    'ketchup',
    'ranch',
    'bbq sauce',
    'hot sauce',
    'salsa',
    'guacamole',
    'hummus',
    'pesto',
    'aioli',
    'vinaigrette',
    'dressing',
    'sauce',
    'gravy',
    'soy sauce',
    'teriyaki',
    'sriracha',
    'chipotle',
    'tahini',
    // Fruits
    'apple',
    'banana',
    'orange',
    'lemon',
    'lime',
    'strawberry',
    'blueberry',
    'mango',
    'pineapple',
    'grape',
    'watermelon',
    'peach',
    'pear',
    // Herbs & Spices
    'basil',
    'oregano',
    'parsley',
    'cilantro',
    'thyme',
    'rosemary',
    'mint',
    'dill',
    'garlic',
    'ginger',
    'pepper',
    'salt',
    'paprika',
    'cumin',
    'chili',
    'curry',
    // Nuts & Seeds
    'almond',
    'peanut',
    'walnut',
    'pecan',
    'cashew',
    'pistachio',
    'sesame',
    'sunflower seeds',
    'chia seeds',
    // Other
    'oil',
    'olive oil',
    'honey',
    'sugar',
    'chocolate',
    'caramel',
    'vanilla',
    'beans',
    'chickpeas',
    'lentils',
    'potato',
    'fries',
    'chips',
  ];

  extractIngredients(description: string): string[] {
    const text = description.toLowerCase();
    const foundIngredients: string[] = [];

    // Find all ingredients in the description
    for (const ingredient of this.ingredients) {
      const regex = new RegExp(`\\b${ingredient}\\b`, 'i');

      if (regex.test(text)) {
        foundIngredients.push(ingredient);
      }
    }

    // Remove duplicates
    const unique = this.removeDuplicates(foundIngredients);

    this.logger.log(`Extracted ${unique.length} ingredients from description`);
    return unique;
  }

  private removeDuplicates(ingredients: string[]): string[] {
    const seen = new Set<string>();
    return ingredients.filter((ing) => {
      const key = ing.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  extractIngredientsFromBatch(descriptions: string[]): string[][] {
    return descriptions.map((desc) => this.extractIngredients(desc));
  }

  /**
   * Extract ingredients with importance scores based on name, description, and category
   */
  extractIngredientsWithScores(
    name: string,
    description: string,
    ingredients: string[],
    category?: string,
  ): ScoredIngredient[] {
    // Remove duplicates first
    const uniqueIngredients = this.removeDuplicates(ingredients);

    const scoredIngredients: ScoredIngredient[] = [];
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();

    for (const ingredient of uniqueIngredients) {
      const ingLower = ingredient.toLowerCase();
      let score = 0.5; // Default score
      let role: 'main' | 'secondary' | 'accessory' = 'secondary';
      const reasoning: string[] = [];

      // 1. Check if ingredient is in the dish name (HIGHEST PRIORITY)
      const nameWords = nameLower.split(/\s+/);
      const ingWords = ingLower.split(/\s+/);

      // Check if ingredient appears in first 3 words of name
      let namePosition = -1;
      for (let i = 0; i < Math.min(3, nameWords.length); i++) {
        if (
          nameWords[i].includes(ingLower) ||
          ingWords.some((w) => nameWords[i].includes(w))
        ) {
          namePosition = i;
          break;
        }
      }

      if (namePosition === 0) {
        // First word in name = main ingredient
        score = 1.0;
        role = 'main';
        reasoning.push('First word in dish name');
      } else if (namePosition === 1) {
        // Second word = likely main
        score = 0.9;
        role = 'main';
        reasoning.push('Second word in dish name');
      } else if (namePosition === 2) {
        // Third word = could be main or secondary
        score = 0.8;
        role = 'main';
        reasoning.push('Third word in dish name');
      } else if (nameLower.includes(ingLower)) {
        // In name but later = secondary
        score = 0.6;
        role = 'secondary';
        reasoning.push('Appears in dish name');
      }

      // 2. Check for "served with" pattern (LOW SCORE)
      const servedWithPattern = /served\s+with[^.]*/i;
      const servedWithMatch = descLower.match(servedWithPattern);
      if (servedWithMatch) {
        const afterServedWith = descLower.substring(
          servedWithMatch.index! + servedWithMatch[0].length,
        );
        if (afterServedWith.includes(ingLower)) {
          score = Math.min(score, 0.3);
          role = 'accessory';
          reasoning.push('Appears after "served with"');
        }
      }

      // 3. Check for "+" or "and" connectors
      const plusPattern = /(\w+)\s*\+\s*(\w+)/i;
      const andPattern = /(\w+)\s+and\s+(\w+)/i;

      const plusMatch = nameLower.match(plusPattern);
      if (plusMatch) {
        const beforePlus = plusMatch[1];
        const afterPlus = plusMatch[2];
        if (beforePlus.includes(ingLower) || ingLower.includes(beforePlus)) {
          score = Math.max(score, 0.9);
          role = 'main';
          reasoning.push('Before "+" connector');
        } else if (
          afterPlus.includes(ingLower) ||
          ingLower.includes(afterPlus)
        ) {
          score = Math.max(score, 0.7);
          role = 'secondary';
          reasoning.push('After "+" connector');
        }
      }

      const andMatch = nameLower.match(andPattern);
      if (andMatch) {
        const beforeAnd = andMatch[1];
        const afterAnd = andMatch[2];
        if (beforeAnd.includes(ingLower) || ingLower.includes(beforeAnd)) {
          score = Math.max(score, 0.9);
          role = 'main';
          reasoning.push('Before "and" connector');
        } else if (afterAnd.includes(ingLower) || ingLower.includes(afterAnd)) {
          score = Math.max(score, 0.7);
          role = 'secondary';
          reasoning.push('After "and" connector');
        }
      }

      // 4. Category-based adjustments
      if (category) {
        const catLower = category.toLowerCase();

        // Main Course: Proteins are main, sides are secondary
        if (catLower.includes('main') || catLower.includes('entree')) {
          if (
            this.PROTEINS.some((p) => ingLower.includes(p) || p.includes(ingLower))
          ) {
            if (!reasoning.includes('First word in dish name')) {
              score = Math.max(score, 0.8);
              role = 'main';
              reasoning.push('Protein in main course');
            }
          }
          if (
            this.COMMON_SIDES.some(
              (s) => ingLower.includes(s) || s.includes(ingLower),
            )
          ) {
            score = Math.min(score, 0.3);
            role = 'accessory';
            reasoning.push('Side dish in main course');
          }
        }

        // Side Dish: All ingredients are main
        if (catLower.includes('side')) {
          score = Math.max(score, 0.8);
          role = 'main';
          reasoning.push('Ingredient in side dish');
        }

        // Salad: Main vegetable is main
        if (catLower.includes('salad')) {
          // Check if this ingredient is the main one (e.g., "Sesame Paste Salad")
          if (
            nameWords[0].includes(ingLower) ||
            ingLower.includes(nameWords[0])
          ) {
            score = 1.0;
            role = 'main';
            reasoning.push('Main ingredient in salad');
          } else if (
            this.CONDIMENTS.some((c) => ingLower.includes(c) || c.includes(ingLower))
          ) {
            score = Math.min(score, 0.3);
            role = 'accessory';
            reasoning.push('Condiment in salad');
          }
        }

        // Soup: First ingredient is main
        if (catLower.includes('soup')) {
          if (
            nameWords[0].includes(ingLower) ||
            ingLower.includes(nameWords[0])
          ) {
            score = 1.0;
            role = 'main';
            reasoning.push('Main ingredient in soup');
          } else {
            score = Math.min(score, 0.5);
            role = 'secondary';
            reasoning.push('Secondary ingredient in soup');
          }
        }

        // Meal/Combo: Use "served with" pattern
        if (catLower.includes('meal') || catLower.includes('combo')) {
          // Already handled by "served with" pattern above
        }
      }

      // 5. Common sides default (unless already determined to be main)
      if (
        score === 0.5 &&
        this.COMMON_SIDES.some((s) => ingLower.includes(s) || s.includes(ingLower))
      ) {
        score = 0.2;
        role = 'accessory';
        reasoning.push('Common side dish');
      }

      // 6. Condiments default
      if (
        score === 0.5 &&
        this.CONDIMENTS.some((c) => ingLower.includes(c) || c.includes(ingLower))
      ) {
        score = 0.1;
        role = 'accessory';
        reasoning.push('Condiment/sauce');
      }

      // 7. If ingredient IS the dish name (e.g., "Sesame Paste Salad")
      if (nameLower === ingLower || nameLower.startsWith(ingLower + ' ')) {
        score = 1.0;
        role = 'main';
        reasoning.push('Ingredient is the dish name');
      }

      scoredIngredients.push({
        name: ingredient,
        score: Math.max(0.0, Math.min(1.0, score)),
        role,
        reasoning: reasoning.length > 0 ? reasoning : ['Default scoring'],
      });
    }

    this.logger.log(
      `Scored ${scoredIngredients.length} ingredients for "${name}"`,
    );
    return scoredIngredients;
  }

  /**
   * Extract tags from food item name, description, and ingredients
   */
  extractTags(
    name: string,
    description: string,
    ingredients: string[],
  ): string[] {
    const tags: Set<string> = new Set();
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();
    const ingredientsLower = ingredients.map((ing) => ing.toLowerCase());

    const searchableText =
      `${nameLower} ${descLower} ${ingredientsLower.join(' ')}`.toLowerCase();

    // Product type tags
    const productTypePatterns = [
      { pattern: /\bmeal\b/i, tag: 'meal' },
      { pattern: /\bmeals\b/i, tag: 'meal' },
      { pattern: /\bburger\b/i, tag: 'burger' },
      { pattern: /\bsandwich\b/i, tag: 'sandwich' },
      { pattern: /\bsandwiches\b/i, tag: 'sandwich' },
      { pattern: /\bpizza\b/i, tag: 'pizza' },
      { pattern: /\bpasta\b/i, tag: 'pasta' },
      { pattern: /\bsoup\b/i, tag: 'soup' },
      { pattern: /\bsalad\b/i, tag: 'salad' },
      { pattern: /\bsalads\b/i, tag: 'salad' },
      { pattern: /\bappetizer\b/i, tag: 'appetizer' },
      { pattern: /\bappetizers\b/i, tag: 'appetizer' },
      { pattern: /\bcombo\b/i, tag: 'combo' },
      { pattern: /\bcombos\b/i, tag: 'combo' },
      { pattern: /\bloaf\b/i, tag: 'sandwich' },
      { pattern: /\bwrap\b/i, tag: 'sandwich' },
    ];

    for (const { pattern, tag } of productTypePatterns) {
      if (pattern.test(searchableText)) {
        tags.add(tag);
      }
    }

    // Main ingredient tags (proteins)
    const proteinTags = [
      'chicken',
      'beef',
      'pork',
      'turkey',
      'salmon',
      'tuna',
      'shrimp',
      'bacon',
      'ham',
      'sausage',
      'kofta',
      'tofu',
      'lamb',
      'duck',
      'fish',
      'kebab',
      'tarb',
      'shish',
      'tawook',
    ];

    for (const protein of proteinTags) {
      if (searchableText.includes(protein)) {
        tags.add(protein);
      }
    }

    // Vegetarian/Vegan detection
    if (
      searchableText.includes('vegetarian') ||
      searchableText.includes('veggie')
    ) {
      tags.add('vegetarian');
    }
    if (searchableText.includes('vegan')) {
      tags.add('vegan');
    }

    // Preparation method tags
    const preparationPatterns = [
      { pattern: /\bgrilled\b/i, tag: 'grilled' },
      { pattern: /\bfried\b/i, tag: 'fried' },
      { pattern: /\broasted\b/i, tag: 'roasted' },
      { pattern: /\bbaked\b/i, tag: 'baked' },
      { pattern: /\bsteamed\b/i, tag: 'steamed' },
    ];

    for (const { pattern, tag } of preparationPatterns) {
      if (pattern.test(searchableText)) {
        tags.add(tag);
      }
    }

    // Characteristic tags
    if (searchableText.includes('spicy') || searchableText.includes('hot')) {
      tags.add('spicy');
    }
    if (searchableText.includes('mild')) {
      tags.add('mild');
    }
    if (
      searchableText.includes('signature') ||
      searchableText.includes('special')
    ) {
      tags.add('signature');
    }

    // Check for combo/meal indicators
    if (
      nameLower.includes('+') ||
      nameLower.includes('and') ||
      descLower.includes('served with')
    ) {
      if (!tags.has('combo')) {
        tags.add('combo');
      }
    }

    this.logger.log(`Extracted ${tags.size} tags from "${name}"`);
    return Array.from(tags);
  }
}
