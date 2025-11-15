import { Injectable } from '@nestjs/common';
import { FoodItemsRepository } from './food-items.repository';

@Injectable()
export class FoodItemsService {
  constructor(private readonly foodItemsRepository: FoodItemsRepository) {}

  async getFoodItemsForRestaurant(restaurantId: number) {
    return this.foodItemsRepository.getFoodItemsForRestaurant(restaurantId);
  }
}
