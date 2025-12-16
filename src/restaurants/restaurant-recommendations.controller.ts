import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RestaurantRecommendationsService } from './restaurant-recommendations.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@/shared/decorators/current-user.decorator';
import { ScoredFoodItemDto } from './dtos/scored-food-item.dto';

@Controller('restaurants')
export class RestaurantRecommendationsController {
  constructor(
    private readonly recommendationsService: RestaurantRecommendationsService,
  ) {}

  @Get(':restaurantId/recommendations')
  async getRecommendations(
    @CurrentUser() user: CurrentUserPayload,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<ScoredFoodItemDto[]> {
    return this.recommendationsService.getRecommendations(
      restaurantId,
      user.id,
    );
  }
}



