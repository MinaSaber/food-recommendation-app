import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { FoodItemsService } from '../food-items/food-items.service';

@Injectable()
export class RecommendationsService {
  constructor(private readonly foodItemsService: FoodItemsService) {}

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

  async getRecommendationsForUser(userId: number, restaurantId: number) {
    const trainingUsersPath = path.join(process.cwd(), 'training_users.json');
    const users = JSON.parse(fs.readFileSync(trainingUsersPath, 'utf-8'));
    const user = users.find((u: { id: number }) => u.id === userId);

    if (!user) {
      throw new Error(
        `User with ID ${userId} not found in training_users.json`,
      );
    }

    // Fetch restaurant food items
    // const foodItems =
    //   await this.foodItemsService.getFoodItemsForRestaurant(restaurantId);
    // if (!foodItems || foodItems.length === 0) return [];

    const foodItems = [
      {
        id: 1,
        restaurant_id: 1,
        name: 'Kung Pao Chicken',
        description: 'Spicy stir-fried chicken with peanuts and vegetables',
        category: 'Main Course',
        price: 16.99,
        ingredients: [
          'chicken',
          'peanuts',
          'bell peppers',
          'chili',
          'soy sauce',
          'ginger',
          'garlic',
        ],
        image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d',
        rating: 4.5,
      },
    ];

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
        String(userId),
        itemsJson,
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
        } catch (err) {
          reject(
            new Error(`Failed to parse prediction result: ${err.message}`),
          );
        }
      });
    });
  }
}
