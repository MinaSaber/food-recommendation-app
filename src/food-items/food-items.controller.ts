import { Public } from '@/shared/decorators/public.decorator';
import { FoodItemsService } from './food-items.service';
import { Controller, Query } from '@nestjs/common';
import { Get } from '@nestjs/common';

@Controller('food-items')
export class FoodItemsController {
  constructor(private readonly foodItemsService: FoodItemsService) {}

  @Public()
  @Get()
  getMenu(
    @Query('branchId') branchId: number,
    @Query('areaId') areaId: number, // will auto-remove soon
  ) {
    return this.foodItemsService.getTalMenu(Number(areaId), Number(branchId));
  }
}
