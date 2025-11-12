// src/vendors/vendors.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { TalModule } from '@/external/providers/tal/tal.module';

@Module({
  imports: [TalModule],
  providers: [VendorsService],
  controllers: [VendorsController],
})
export class VendorsModule {}
