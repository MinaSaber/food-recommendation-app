import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';

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

  async createRestaurants(restaurants: CreateRestaurantDto[]) {
    return this.prisma.restaurant.createMany({
      data: restaurants,
    });
  }

  async getRestaurantsByArea(areaId: number) {
    return this.prisma.restaurant.findMany({
      where: {
        areaId,
      },
    });
  }

  async getRestaurantByNameAndLocation(
    name: string,
    longitude: number,
    latitude: number,
  ) {
    return this.prisma.restaurant.findFirst({
      where: {
        name,
        latitude,
        longitude,
      },
    });
  }
}
