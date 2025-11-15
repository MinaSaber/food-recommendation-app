import { Module } from '@nestjs/common';
import { FoodItemsService } from './food-items.service';
import { FoodItemsRepository } from './food-items.repository';
import { PrismaModule } from '../prsima/prisma.module';
import { FoodItemsController } from './food-items.controller';
import { TalModule } from '@/external/providers/tal/tal.module';
import { IngredientExtractorModule } from '@/ingredient-extractor/ingredient-extractor.module';
import { RestaurantsModule } from '@/restaurants/restaurants.module';

@Module({
  imports: [
    PrismaModule,
    TalModule,
    IngredientExtractorModule,
    RestaurantsModule,
  ],
  controllers: [FoodItemsController],
  providers: [FoodItemsService, FoodItemsRepository],
  exports: [FoodItemsService],
})
export class FoodItemsModule {}
