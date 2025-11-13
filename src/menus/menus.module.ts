// src/Menus/Menus.module.ts
import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { TalModule } from '@/external/providers/tal/tal.module';
import { IngredientExtractorModule } from '@/ingredient-extractor/ingredient-extractor.module';

@Module({
  imports: [TalModule , IngredientExtractorModule],
  providers: [MenusService],
  controllers: [MenusController],
})
export class MenusModule {}
