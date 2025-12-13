import { Module } from '@nestjs/common';
import { IngredientExtractorService } from './ingreadient-extractor.service';

@Module({
  providers: [IngredientExtractorService],
  exports: [IngredientExtractorService],
})
export class IngredientExtractorModule {}