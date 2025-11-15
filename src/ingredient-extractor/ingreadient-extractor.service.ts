// ingredient-extractor.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IngredientExtractorService {
  private readonly logger = new Logger(IngredientExtractorService.name);

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
}
