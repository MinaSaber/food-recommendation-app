// src/Menus/Menus.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { TalModule } from '@/external/providers/tal/tal.module';

@Module({
  imports: [TalModule],
  providers: [MenusService],
  controllers: [MenusController],
})
export class MenusModule {}
