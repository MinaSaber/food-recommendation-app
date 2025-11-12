import { Module } from '@nestjs/common';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { TalModule } from '@/external/providers/tal/tal.module';

@Module({
  imports: [TalModule],
  controllers: [AreasController],
  providers: [AreasService],
})
export class AreasModule {}
