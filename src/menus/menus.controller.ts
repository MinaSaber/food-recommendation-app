import { Controller, Get, Param, Query } from '@nestjs/common';
import { MenusService } from './menus.service';
import { Public } from '@/auth/decorators/public.decorator';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Public()
  @Get()
  getMenu(
    @Query('branchId') branchId: number,
    @Query('areaId') areaId: number, // will auto-remove soon
  ) {
    return this.menusService.getTalMenu(Number(areaId), Number(branchId));
  }
}
