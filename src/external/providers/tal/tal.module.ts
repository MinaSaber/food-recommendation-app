import { Module } from '@nestjs/common';
import { TalService } from './tal.service';
import { ExternalHttpModule } from '@/external/http/external-http.module';

@Module({
  imports: [ExternalHttpModule],
  providers: [TalService],
  exports: [TalService],   // allow other modules to use it
})
export class TalModule {}
