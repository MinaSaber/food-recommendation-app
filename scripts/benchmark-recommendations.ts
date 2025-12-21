
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantRecommendationsService } from '../src/restaurants/restaurant-recommendations.service';
import { RestaurantRecommendationsRepository } from '../src/restaurants/restaurant-recommendations.repository';
import { IngredientExtractorService } from '../src/ingredient-extractor/ingreadient-extractor.service';
import { Prisma } from '@prisma/client';

async function runBenchmark() {
  console.log('Starting Recommendation System Benchmark...');

  // Mock Repository
  const mockRepository = {
    restaurantExists: jest.fn().mockResolvedValue(true),
    getFoodItemsByRestaurantId: jest.fn(),
    getUserById: jest.fn(),
    getUserEventsWithFoodItems: jest.fn(),
  };

  // Create Testing Module
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RestaurantRecommendationsService,
      IngredientExtractorService,
      {
        provide: RestaurantRecommendationsRepository,
        useValue: mockRepository,
      },
    ],
  }).compile();

  const service = module.get<RestaurantRecommendationsService>(
    RestaurantRecommendationsService,
  );

  // Mock Data
  const FOOD_ITEMS_COUNT = 100;
  const foodItems = Array.from({ length: FOOD_ITEMS_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Test Food Item ${i + 1}`,
    description: `Delicious food item with robust ingredients ${i + 1}`,
    price: new Prisma.Decimal(10 + i),
    ingredients: ['chicken', 'rice', 'garlic', 'onion', 'pepper'],
    rating: new Prisma.Decimal(4.5),
    category: 'Main Course',
    tags: ['meal', 'chicken', 'dinner'],
  }));

  const user = {
    id: 1,
    dietaryPreferences: ['gluten-free'],
    age: 25,
    gender: 'female',
    budgetPreference: 'medium',
  };

  const userEvents = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    userId: 1,
    itemId: (i % 20) + 1,
    createdAt: new Date(),
    value: 1,
    eventType: 'ORDER',
    foodItem: {
      id: (i % 20) + 1,
      name: `Past Item ${i + 1}`,
      description: 'Past item description',
      ingredients: ['chicken', 'rice'],
      tags: ['meal', 'chicken'],
    },
  }));

  // Setup Mocks
  mockRepository.getFoodItemsByRestaurantId.mockResolvedValue(foodItems);
  mockRepository.getUserById.mockResolvedValue(user);
  mockRepository.getUserEventsWithFoodItems.mockResolvedValue(userEvents);

  // Warmup
  console.log('Running warmup...');
  await service.getRecommendations(1, 1);

  // Benchmark
  console.log('Running benchmark (100 iterations)...');
  const latencies: number[] = [];
  const ITERATIONS = 100;

  for (let i = 0; i < ITERATIONS; i++) {
    const start = process.hrtime();
    await service.getRecommendations(1, 1);
    const end = process.hrtime(start);
    const latencyMs = (end[0] * 1e9 + end[1]) / 1e6;
    latencies.push(latencyMs);
  }

  // Calculate Stats
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log('\n--- Benchmark Results ---');
  console.log(`Food Items: ${FOOD_ITEMS_COUNT}`);
  console.log(`User History: 50 events`);
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Min Latency: ${min.toFixed(2)} ms`);
  console.log(`Max Latency: ${max.toFixed(2)} ms`);
  console.log(`Average Latency: ${avg.toFixed(2)} ms`);
  console.log(`P95 Latency: ${p95.toFixed(2)} ms`);
  console.log(
    `Efficiency Score: ${avg < 50 ? 'EXCELLENT (10/10)' : avg < 100 ? 'GOOD (8/10)' : 'NEEDS OPTIMIZATION (<5/10)'}`,
  );
}

runBenchmark();
