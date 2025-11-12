import { Controller, Get, Query } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Public } from '@/auth/decorators/public.decorator';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Public()  
  @Get()
  getAreas(@Query('countryId') countryId?: number) {
    return this.areasService.getAreas(countryId);
  }
}
