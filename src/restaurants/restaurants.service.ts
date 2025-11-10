import { RestaurantsRepository } from './restaurants.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantsService {
  constructor(private readonly restaurantsRepository: RestaurantsRepository) {}

  async getRestaurants() {
    return this.restaurantsRepository.getRestaurants();
  }
}
