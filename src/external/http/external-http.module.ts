import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalHttpService } from './external-http.service';

@Module({
  imports: [HttpModule],
  providers: [ExternalHttpService],
  exports: [ExternalHttpService], // ← so vendors/areas/menus can use it
})
export class ExternalHttpModule {}