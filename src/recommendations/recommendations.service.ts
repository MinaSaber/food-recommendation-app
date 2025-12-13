import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { FoodItemsService } from '../food-items/food-items.service';
import { CurrentUserPayload } from '@/shared/decorators/current-user.decorator';
import { PrismaService } from '../prsima/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly foodItemsService: FoodItemsService,
    private readonly prisma: PrismaService,
  ) {}

  async trainModel() {
    const scriptPath = path.join(process.cwd(), 'ml/train_model.py');
    const venvPython = path.join(process.cwd(), 'ml/venv/bin/python3');

    // Prefer venv Python if it exists, otherwise try Python 3.11 (for lightfm compatibility)
    let pythonExecutable: string;
    if (fs.existsSync(venvPython)) {
      pythonExecutable = venvPython;
    } else {
      // Try Python 3.11 first (lightfm is compatible with 3.11)
      const python311 = '/usr/bin/python3.11';
      pythonExecutable = fs.existsSync(python311) ? python311 : 'python3';
    }

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(pythonExecutable, [scriptPath]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output || '✅ Training completed.');
        } else {
          // Combine both stdout and stderr for error messages
          const errorMessage =
            errorOutput || output || 'Unknown error occurred';
          reject(`❌ Error (code ${code}): ${errorMessage}`);
        }
      });
    });
  }

  async getRecommendationsForUser(
    user: CurrentUserPayload,
    restaurantId: number,
  ) {
    // Fetch full user data from database to get dietary preferences and other features
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        dietaryPreferences: true,
        budgetPreference: true,
        gender: true,
        age: true,
      },
    });

    if (!dbUser) {
      throw new Error(`User with ID ${user.id} not found in database`);
    }

    // Check if user exists in training data
    const trainingUsersPath = path.join(process.cwd(), 'training_users.json');
    let trainingUser: any = null;
    let userIdArg: string;
    let userFeaturesArg: string;

    if (fs.existsSync(trainingUsersPath)) {
      const users = JSON.parse(fs.readFileSync(trainingUsersPath, 'utf-8'));
      trainingUser = users.find((u: { id: number }) => u.id === user.id);
    }

    // Fetch user's past interactions to extract preferred ingredients
    const userEvents = await this.prisma.event.findMany({
      where: { userId: user.id },
      include: {
        foodItem: {
          select: {
            ingredients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      // take: 100, // Get last 100 interactions
    });

    // Extract unique ingredients from items user interacted with
    const preferredIngredients = new Set<string>();
    userEvents.forEach((event) => {
      if (event.foodItem?.ingredients) {
        event.foodItem.ingredients.forEach((ingredient) => {
          if (typeof ingredient === 'string') {
            preferredIngredients.add(ingredient.toLowerCase());
          }
        });
      }
    });

    // Prepare user features from database user
    const userFeatures: {
      dietary_preferences?: string[];
      budget_preference?: string;
      gender?: string;
      age?: number;
      preferred_ingredients?: string[];
    } = {};

    if (dbUser.dietaryPreferences) {
      if (Array.isArray(dbUser.dietaryPreferences)) {
        userFeatures.dietary_preferences = dbUser.dietaryPreferences.filter(
          (pref): pref is string => typeof pref === 'string',
        );
      } else if (typeof dbUser.dietaryPreferences === 'string') {
        userFeatures.dietary_preferences = [dbUser.dietaryPreferences];
      }
    }

    if (dbUser.budgetPreference) {
      userFeatures.budget_preference = dbUser.budgetPreference;
    }

    if (dbUser.gender) {
      userFeatures.gender = dbUser.gender.toLowerCase();
    }

    if (dbUser.age) {
      userFeatures.age = dbUser.age;
    }

    // Add preferred ingredients from past interactions
    if (preferredIngredients.size > 0) {
      userFeatures.preferred_ingredients = Array.from(preferredIngredients);
    }

    // Always pass user features for content-based scoring (needed for items not in training data)
    if (trainingUser) {
      userIdArg = String(trainingUser.id);
    } else {
      userIdArg = 'null';
    }
    // Always pass user features for content-based scoring
    userFeaturesArg = JSON.stringify(userFeatures);

    const foodItems =
      await this.foodItemsService.getFoodItemsForRestaurant(restaurantId);
    if (!foodItems || foodItems.length === 0) return [];

    // Run the Python script to get predictions
    const scriptPath = path.join(process.cwd(), 'ml', 'predict.py');
    const venvPython = path.join(process.cwd(), 'ml/venv/bin/python3');

    // Prefer venv Python if it exists, otherwise try Python 3.11 (for lightfm compatibility)
    let pythonExecutable: string;
    if (fs.existsSync(venvPython)) {
      pythonExecutable = venvPython;
    } else {
      // Try Python 3.11 first (lightfm is compatible with 3.11)
      const python311 = '/usr/bin/python3.11';
      pythonExecutable = fs.existsSync(python311) ? python311 : 'python3';
    }

    const itemsJson = JSON.stringify(foodItems);

    return new Promise((resolve, reject) => {
      const process = spawn(pythonExecutable, [
        scriptPath,
        userIdArg,
        itemsJson,
        userFeaturesArg,
      ]);

      let result = '';
      let error = '';

      process.stdout.on('data', (data) => (result += data.toString()));
      process.stderr.on('data', (data) => (error += data.toString()));

      process.on('close', (code) => {
        if (code !== 0) {
          console.error('Python error:', error);
          return reject(new Error(`Python script failed: ${error}`));
        }

        try {
          const predictions = JSON.parse(result);
          // Sort items by predicted score (descending)
          const sorted = predictions.sort(
            (a: any, b: any) => b.predicted_score - a.predicted_score,
          );
          resolve(sorted);
        } catch (err: any) {
          reject(
            new Error(`Failed to parse prediction result: ${err.message}`),
          );
        }
      });
    });
  }
}
