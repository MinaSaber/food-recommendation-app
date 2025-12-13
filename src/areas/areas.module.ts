import { Module } from '@nestjs/common';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { TalModule } from '@/external/providers/tal/tal.module';
import { AreasRepository } from './areas.repository';
import { PrismaModule } from '@/prsima/prisma.module';

@Module({
  imports: [TalModule, PrismaModule],
  controllers: [AreasController],
  providers: [AreasService, AreasRepository],
  exports: [AreasService],
})
export class AreasModule {}
