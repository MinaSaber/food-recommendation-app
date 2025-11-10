import { Controller, Get } from '@nestjs/common';
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
}
