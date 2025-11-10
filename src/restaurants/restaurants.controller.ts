import { Controller, Get, Param } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Public } from '../shared/decorators/public.decorator';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Public()
  @Get()
  async getRestaurants() {
    return this.restaurantsService.getRestaurants();
  }

  @Public()
  @Get(':id/food-items')
  async getFoodItemsForRestaurant(@Param('id') id: number) {
    return this.restaurantsService.getFoodItemsForRestaurant(id);
  }
}
