import { Controller, Get, Param } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Public } from '@/shared/decorators/public.decorator';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get(':areaId')
  getVendors(@Param('areaId') areaId: number) {
    return this.vendorsService.getTalVendors(areaId);
  }
}
