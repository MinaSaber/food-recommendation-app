import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurants() {
    return this.prisma.restaurant.findMany();
  }

  async getRestaurantById(id: number) {
    return this.prisma.restaurant.findUnique({
      where: { id },
    });
  }
}
