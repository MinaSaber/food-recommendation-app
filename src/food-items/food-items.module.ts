import { Module } from '@nestjs/common';
import { FoodItemsService } from './food-items.service';
import { FoodItemsRepository } from './food-items.repository';
import { PrismaModule } from '../prsima/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FoodItemsService, FoodItemsRepository],
  exports: [FoodItemsService],
})
export class FoodItemsModule {}
