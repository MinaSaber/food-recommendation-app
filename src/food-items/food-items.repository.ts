import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateFoodItemDto } from './dtos/create-food-item.dto';

@Injectable()
export class FoodItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFoodItemsForRestaurant(restaurantId: number) {
    return this.prisma.foodItem.findMany({
      where: { restaurantId },
    });
  }

  async createFoodItems(foodItems: CreateFoodItemDto[]) {
    return this.prisma.foodItem.createMany({
      data: foodItems,
    });
  }

  async getFoodItemsByRestaurantId(restaurantId: number) {
    return this.prisma.foodItem.findMany({
      where: { restaurantId },
    });
  }
}
