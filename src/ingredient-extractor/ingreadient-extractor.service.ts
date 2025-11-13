// ingredient-extractor.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
  preparation?: string;
}

@Injectable()
export class IngredientExtractorService {
  private readonly logger = new Logger(IngredientExtractorService.name);

  // Common ingredients database
  private readonly ingredients = [
    // Proteins
    'chicken', 'beef', 'pork', 'turkey', 'salmon', 'tuna', 'shrimp', 'bacon',
    'ham', 'sausage', 'egg', 'eggs', 'tofu', 'lamb', 'duck', 'fish',
    // Vegetables
    'lettuce', 'tomato', 'tomatoes', 'onion', 'onions', 'cucumber', 'pickle',
    'pickles', 'pepper', 'peppers', 'carrot', 'carrots', 'spinach', 'kale',
    'broccoli', 'mushroom', 'mushrooms', 'celery', 'avocado', 'corn',
    'cabbage', 'arugula', 'zucchini', 'eggplant', 'jalapeno', 'olives',
    // Cheese & Dairy
    'cheese', 'cheddar', 'mozzarella', 'parmesan', 'swiss', 'provolone',
    'feta', 'goat cheese', 'cream cheese', 'blue cheese', 'brie', 'ricotta',
    'butter', 'milk', 'cream', 'sour cream', 'yogurt',
    // Bread & Grains
    'bread', 'bun', 'roll', 'bagel', 'tortilla', 'wrap', 'pita', 'baguette',
    'ciabatta', 'sourdough', 'wheat', 'rye', 'rice', 'pasta', 'noodles',
    'quinoa', 'couscous', 'croutons',
    // Sauces & Condiments
    'mayo', 'mayonnaise', 'mustard', 'ketchup', 'ranch', 'bbq sauce',
    'hot sauce', 'salsa', 'guacamole', 'hummus', 'pesto', 'aioli',
    'vinaigrette', 'dressing', 'sauce', 'gravy', 'soy sauce', 'teriyaki',
    'sriracha', 'chipotle', 'tahini',
    // Fruits
    'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry',
    'mango', 'pineapple', 'grape', 'watermelon', 'peach', 'pear',
    // Herbs & Spices
    'basil', 'oregano', 'parsley', 'cilantro', 'thyme', 'rosemary', 'mint',
    'dill', 'garlic', 'ginger', 'pepper', 'salt', 'paprika', 'cumin',
    'chili', 'curry',
    // Nuts & Seeds
    'almond', 'peanut', 'walnut', 'pecan', 'cashew', 'pistachio', 'sesame',
    'sunflower seeds', 'chia seeds',
    // Other
    'oil', 'olive oil', 'honey', 'sugar', 'chocolate', 'caramel', 'vanilla',
    'beans', 'chickpeas', 'lentils', 'potato', 'fries', 'chips',
  ];

  // Preparation methods
  private readonly preparations = [
    'grilled', 'fried', 'baked', 'roasted', 'steamed', 'boiled', 'sauteed',
    'fresh', 'raw', 'crispy', 'breaded', 'marinated', 'smoked', 'pickled',
    'diced', 'sliced', 'chopped', 'shredded', 'melted', 'toasted', 'caramelized',
  ];

  // Units of measurement
  private readonly units = [
    'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon',
    'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 'gram',
    'grams', 'kg', 'kilogram', 'ml', 'l', 'liter', 'slice', 'slices', 'piece',
    'pieces', 'clove', 'cloves', 'pinch',
  ];

  extractIngredients(description: string): Ingredient[] {
    const text = description.toLowerCase();
    const foundIngredients: Ingredient[] = [];
    const words = text.split(/\s+/);

    // Find all ingredients in the description
    for (const ingredient of this.ingredients) {
      const ingredientWords = ingredient.split(' ');
      const regex = new RegExp(`\\b${ingredient}\\b`, 'i');

      if (regex.test(text)) {
        const result: Ingredient = { name: ingredient };

        // Look for preparation methods before the ingredient
        const ingredientIndex = words.findIndex((w) =>
          ingredientWords.every((iw) => text.includes(iw)),
        );

        if (ingredientIndex > 0) {
          const prevWord = words[ingredientIndex - 1];
          if (this.preparations.includes(prevWord)) {
            result.preparation = prevWord;
          }
        }

        // Look for quantity and unit
        const quantityMatch = this.extractQuantity(text, ingredient);
        if (quantityMatch) {
          result.quantity = quantityMatch.quantity;
          result.unit = quantityMatch.unit;
        }

        foundIngredients.push(result);
      }
    }

    // Remove duplicates
    const unique = this.removeDuplicates(foundIngredients);

    this.logger.log(`Extracted ${unique.length} ingredients from description`);
    return unique;
  }

  private extractQuantity(
    text: string,
    ingredient: string,
  ): { quantity: string; unit?: string } | null {
    // Pattern: number + optional unit + ingredient
    // e.g., "2 cups flour", "100g cheese", "3 slices bacon"
    const pattern = new RegExp(
      `(\\d+(?:\\.\\d+)?(?:/\\d+)?)\\s*(${this.units.join('|')})?\\s*(?:of\\s+)?${ingredient}`,
      'i',
    );

    const match = text.match(pattern);
    if (match) {
      return {
        quantity: match[1],
        unit: match[2] || undefined,
      };
    }

    return null;
  }

  private removeDuplicates(ingredients: Ingredient[]): Ingredient[] {
    const seen = new Set<string>();
    return ingredients.filter((ing) => {
      const key = ing.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  extractIngredientsFromBatch(descriptions: string[]): Ingredient[][] {
    return descriptions.map((desc) => this.extractIngredients(desc));
  }
}