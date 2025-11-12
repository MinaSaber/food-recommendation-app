import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsRepository } from './restaurants.repository';
import { PrismaModule } from '../prsima/prisma.module';
import { FoodItemsModule } from '../food-items/food-items.module';

@Module({
  imports: [PrismaModule, FoodItemsModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
