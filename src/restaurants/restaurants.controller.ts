import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Public } from '../shared/decorators/public.decorator';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  async getRestaurants() {
    return this.restaurantsService.getRestaurants();
  }

  @Public()
  @Post('area')
  getRestaurantsForArea(@Query('areaSlug') areaSlug: string) {
    return this.restaurantsService.getTalVendors(areaSlug);
  }

  @Get(':id/food-items')
  async getFoodItemsForRestaurant(@Param('id') id: number) {
    return this.restaurantsService.getFoodItemsForRestaurant(id);
  }
}
