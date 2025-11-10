import { RecommendationsService } from './recommendations.service';
import { Controller, Post } from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';

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
}
