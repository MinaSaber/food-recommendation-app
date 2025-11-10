import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FoodItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFoodItemsForRestaurant(restaurantId: number) {
    return this.prisma.foodItem.findMany({
      where: { restaurantId },
    });
  }
}
