import { RestaurantsRepository } from './restaurants.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FoodItemsService } from '../food-items/food-items.service';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly foodItemsService: FoodItemsService,
  ) {}

  async getRestaurants() {
    return this.restaurantsRepository.getRestaurants();
  }

  async getFoodItemsForRestaurant(restaurantId: number) {
    const restaurant =
      await this.restaurantsRepository.getRestaurantById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.foodItemsService.getFoodItemsForRestaurant(restaurant.id);
  }
}
