import { Module } from '@nestjs/common';
import { RestaurantRecommendationsController } from './restaurant-recommendations.controller';
import { RestaurantRecommendationsService } from './restaurant-recommendations.service';
import { RestaurantRecommendationsRepository } from './restaurant-recommendations.repository';
import { PrismaModule } from '@/prsima/prisma.module';
import { IngredientExtractorModule } from '@/ingredient-extractor/ingredient-extractor.module';

@Module({
  imports: [PrismaModule, IngredientExtractorModule],
  controllers: [RestaurantRecommendationsController],
  providers: [
    RestaurantRecommendationsService,
    RestaurantRecommendationsRepository,
  ],
  exports: [RestaurantRecommendationsService],
})
export class RestaurantRecommendationsModule {}



