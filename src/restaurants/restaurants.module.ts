import { forwardRef, Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsRepository } from './restaurants.repository';
import { PrismaModule } from '../prsima/prisma.module';
import { TalModule } from '@/external/providers/tal/tal.module';
import { AreasModule } from '@/areas/areas.module';
import { FoodItemsModule } from '@/food-items/food-items.module';

@Module({
  imports: [
    PrismaModule,
    TalModule,
    AreasModule,
    forwardRef(() => FoodItemsModule),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
