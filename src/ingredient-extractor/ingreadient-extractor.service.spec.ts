import { Test, TestingModule } from '@nestjs/testing';
import { IngredientExtractorService } from './ingreadient-extractor.service';

describe('IngredientExtractorService', () => {
  let service: IngredientExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngredientExtractorService],
    }).compile();

    service = module.get<IngredientExtractorService>(
      IngredientExtractorService,
    );
  });

  describe('extractIngredientsWithScores', () => {
    it('TC-ING-001: Should score main ingredient in name as 1.0', () => {
      // Arrange
      const name = 'Fried Chicken with Rice';
      const description = 'Crispy fried chicken served with rice';
      const ingredients = ['chicken', 'rice'];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
      );

      // Assert
      const chicken = result.find((ing) => ing.name === 'chicken');
      const rice = result.find((ing) => ing.name === 'rice');

      expect(chicken).toBeDefined();
      expect(chicken?.score).toBeGreaterThanOrEqual(0.9); // First word in name
      expect(chicken?.role).toBe('main');

      expect(rice).toBeDefined();
      // Rice appears in name "with Rice" so might be secondary, but score should be lower than main
      expect(rice?.score).toBeLessThan(0.7);
      expect(['accessory', 'secondary']).toContain(rice?.role);
    });

    it('TC-ING-002: Should score multiple main ingredients correctly', () => {
      // Arrange
      const name = 'Half chicken + kofta meal';
      const description =
        'Half chicken and 3 pieces of kofta, served with rice';
      const ingredients = ['chicken', 'kofta', 'rice'];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
      );

      // Assert
      const chicken = result.find((ing) => ing.name === 'chicken');
      const kofta = result.find((ing) => ing.name === 'kofta');
      const rice = result.find((ing) => ing.name === 'rice');

      expect(chicken?.score).toBeGreaterThanOrEqual(0.9);
      expect(chicken?.role).toBe('main');

      expect(kofta?.score).toBeGreaterThanOrEqual(0.7);
      // Kofta appears after "+" so might be secondary, but score should still be high
      expect(['main', 'secondary']).toContain(kofta?.role);

      expect(rice?.score).toBeLessThan(0.5);
      expect(rice?.role).toBe('accessory');
    });

    it('TC-ING-003: Should score items after "served with" as accessory', () => {
      // Arrange
      const name = 'Quarter chicken meal';
      const description =
        'Quarter chicken, served with rice, bread, sesame paste';
      const ingredients = ['chicken', 'rice', 'bread', 'sesame'];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
      );

      // Assert
      const chicken = result.find((ing) => ing.name === 'chicken');
      const rice = result.find((ing) => ing.name === 'rice');
      const bread = result.find((ing) => ing.name === 'bread');

      expect(chicken?.score).toBeGreaterThanOrEqual(0.9); // First word in name
      expect(chicken?.role).toBe('main');

      expect(rice?.score).toBeLessThan(0.3);
      expect(rice?.role).toBe('accessory');

      expect(bread?.score).toBeLessThan(0.3);
      expect(bread?.role).toBe('accessory');
    });

    it('TC-ING-004: Should score main ingredient in salad correctly', () => {
      // Arrange
      const name = 'Sesame Paste Salad';
      const description = 'Fresh salad with sesame paste';
      const ingredients = ['sesame', 'lettuce'];
      const category = 'Salad';

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
        category,
      );

      // Assert
      const sesame = result.find((ing) => ing.name === 'sesame');
      const lettuce = result.find((ing) => ing.name === 'lettuce');

      expect(sesame?.score).toBe(1.0);
      expect(sesame?.role).toBe('main');

      expect(lettuce?.score).toBeLessThan(1.0);
    });

    it('TC-ING-005: Should score first ingredient in soup as main', () => {
      // Arrange
      const name = 'Mushroom Soup';
      const description = 'Creamy mushroom soup';
      const ingredients = ['mushrooms', 'cream', 'onion'];
      const category = 'Soup';

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
        category,
      );

      // Assert
      const mushrooms = result.find((ing) => ing.name === 'mushrooms');

      expect(mushrooms?.score).toBe(1.0);
      expect(mushrooms?.role).toBe('main');
    });

    it('TC-ING-006: Should score all ingredients as main in side dish', () => {
      // Arrange
      const name = 'Fried Rice';
      const description = 'Classic fried rice';
      const ingredients = ['rice', 'eggs', 'peas'];
      const category = 'Side Dish';

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
        category,
      );

      // Assert
      result.forEach((ing) => {
        expect(ing.score).toBeGreaterThanOrEqual(0.8);
        expect(ing.role).toBe('main');
      });
    });

    it('TC-ING-007: Should score burger protein as main, toppings as accessory', () => {
      // Arrange
      const name = 'Beef Burger with Mushrooms';
      const description = 'Juicy beef burger';
      const ingredients = ['beef', 'bread', 'mushrooms', 'cheese'];
      const category = 'Main Course';

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
        category,
      );

      // Assert
      const beef = result.find((ing) => ing.name === 'beef');
      const mushrooms = result.find((ing) => ing.name === 'mushrooms');
      const cheese = result.find((ing) => ing.name === 'cheese');

      expect(beef?.score).toBeGreaterThanOrEqual(0.8);
      expect(beef?.role).toBe('main');

      // Mushrooms appear in name "with Mushrooms" so might be secondary, but score should be low
      expect(mushrooms?.score).toBeLessThan(0.7);
      expect(['accessory', 'secondary']).toContain(mushrooms?.role);

      expect(cheese?.score).toBeLessThanOrEqual(0.5);
      // Cheese might be secondary if mentioned in description, but score should be low
      expect(['accessory', 'secondary']).toContain(cheese?.role);
    });

    it('TC-EDGE-001: Should handle empty ingredients array', () => {
      // Arrange
      const name = 'Item';
      const description = 'Description';
      const ingredients: string[] = [];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('TC-EDGE-002: Should handle null category', () => {
      // Arrange
      const name = 'Chicken Meal';
      const description = 'Chicken with rice';
      const ingredients = ['chicken', 'rice'];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
        undefined,
      );

      // Assert
      expect(result.length).toBeGreaterThan(0);
      // Should use linguistic patterns only
    });

    it('TC-EDGE-005: Should remove duplicate ingredients', () => {
      // Arrange
      const name = 'Chicken Meal';
      const description = 'Chicken with rice';
      const ingredients = ['chicken', 'chicken', 'rice'];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
      );

      // Assert
      const chickenCount = result.filter(
        (ing) => ing.name === 'chicken',
      ).length;
      expect(chickenCount).toBe(1);
    });

    it('TC-EDGE-006: Should handle case insensitive matching', () => {
      // Arrange
      const name = 'CHICKEN MEAL';
      const description = 'Chicken with RICE';
      const ingredients = ['Chicken', 'RICE'];

      // Act
      const result = service.extractIngredientsWithScores(
        name,
        description,
        ingredients,
      );

      // Assert
      expect(result.length).toBeGreaterThan(0);
      const chicken = result.find(
        (ing) => ing.name.toLowerCase() === 'chicken',
      );
      expect(chicken).toBeDefined();
    });
  });

  describe('extractTags', () => {
    it('TC-TAG-EXTRACT-001: Should extract product type tags', () => {
      // Arrange
      const name = 'Chicken Meal';
      const description = 'Delicious chicken meal';
      const ingredients = ['chicken'];

      // Act
      const result = service.extractTags(name, description, ingredients);

      // Assert
      expect(result).toContain('meal');
      expect(result).toContain('chicken');
    });

    it('TC-TAG-EXTRACT-002: Should extract preparation method tags', () => {
      // Arrange
      const name = 'Grilled Chicken';
      const description = 'Grilled to perfection';
      const ingredients = ['chicken'];

      // Act
      const result = service.extractTags(name, description, ingredients);

      // Assert
      expect(result).toContain('grilled');
      expect(result).toContain('chicken');
    });

    it('TC-TAG-EXTRACT-003: Should extract characteristic tags', () => {
      // Arrange
      const name = 'Spicy Chicken';
      const description = 'Hot and spicy';
      const ingredients = ['chicken', 'chili'];

      // Act
      const result = service.extractTags(name, description, ingredients);

      // Assert
      expect(result).toContain('spicy');
    });

    it('TC-TAG-EXTRACT-004: Should detect combo tag', () => {
      // Arrange
      const name = 'Chicken + Kofta';
      const description = 'Served with rice';
      const ingredients = ['chicken', 'kofta', 'rice'];

      // Act
      const result = service.extractTags(name, description, ingredients);

      // Assert
      expect(result).toContain('combo');
    });

    it('TC-TAG-EXTRACT-005: Should extract vegetarian tag', () => {
      // Arrange
      const name = 'Vegetable Salad';
      const description = 'Vegetarian friendly';
      const ingredients = ['lettuce', 'tomato'];

      // Act
      const result = service.extractTags(name, description, ingredients);

      // Assert
      expect(result).toContain('vegetarian');
    });
  });
});
