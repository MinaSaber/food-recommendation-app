import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantRecommendationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all food items for a restaurant
   */
  async getFoodItemsByRestaurantId(restaurantId: number) {
    return this.prisma.foodItem.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        rating: 'desc',
      },
    });
  }

  /**
   * Get user with dietary preferences
   */
  async getUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        dietaryPreferences: true,
        age: true,
        gender: true,
        budgetPreference: true,
      },
    });
  }

  /**
   * Get user's interaction events with food items
   * Includes food item details for ingredient extraction
   */
  async getUserEventsWithFoodItems(userId: number) {
    return this.prisma.event.findMany({
      where: {
        userId,
      },
      include: {
        foodItem: {
          select: {
            id: true,
            ingredients: true,
            name: true,
            description: true,
            category: true,
            tags: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Check if restaurant exists
   */
  async restaurantExists(restaurantId: number): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });
    return !!restaurant;
  }
}
