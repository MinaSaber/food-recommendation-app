import { RecommendationsService } from './recommendations.service';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '@/shared/decorators/public.decorator';

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

  @Public()
  @Get('user/:userId/restaurant/:restaurantId')
  async getRecommendationsForUser(
    @Param('userId') userId: number,
    @Param('restaurantId') restaurantId: number,
  ) {
    return this.recommendationsService.getRecommendationsForUser(
      userId,
      restaurantId,
    );
  }
}
