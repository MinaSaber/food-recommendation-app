import { Controller, Get, Param, Post } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Public } from '@/shared/decorators/public.decorator';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Public()
  @Get()
  getAreas() {
    return this.areasService.getAreas();
  }
}
