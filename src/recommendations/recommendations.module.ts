import { PrismaModule } from '@/prsima/prisma.module';
import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { FoodItemsModule } from '../food-items/food-items.module';

@Module({
  imports: [PrismaModule, FoodItemsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
