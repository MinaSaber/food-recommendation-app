import { RecommendationsService } from './recommendations.service';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '@/shared/decorators/public.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@/shared/decorators/current-user.decorator';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Public()
  @Post('train')
  async trainModel() {
    return this.recommendationsService.trainModel();
  }

  @Get('restaurant/:restaurantId')
  async getRecommendationsForUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('restaurantId') restaurantId: number,
  ) {
    return this.recommendationsService.getRecommendationsForUser(
      user,
      restaurantId,
    );
  }
}
