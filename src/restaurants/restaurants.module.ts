import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsRepository } from './restaurants.repository';
import { PrismaModule } from '../prsima/prisma.module';
import { FoodItemsModule } from '../food-items/food-items.module';
import { TalModule } from '@/external/providers/tal/tal.module';
import { AreasModule } from '@/areas/areas.module';

@Module({
  imports: [PrismaModule, FoodItemsModule, TalModule, AreasModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
