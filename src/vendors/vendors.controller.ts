import { Controller, Get, Param, Query } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Public } from '@/auth/decorators/public.decorator';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get(':areaId')
  getVendors(@Param('areaId') areaId: number) {
    return this.vendorsService.getTalVendors(areaId);
  }
}
