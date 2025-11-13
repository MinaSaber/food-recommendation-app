// src/menus/menus.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { TalService } from '@/external/providers/tal/tal.service';
import { IngredientExtractorService } from '@/ingredient-extractor/ingreadient-extractor.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MenusService {
  private readonly logger = new Logger(MenusService.name);
  private readonly menusDir = path.join(process.cwd(), 'src', 'data', 'menus');

  constructor(
    private readonly talService: TalService,
    private readonly ingredientExtractionService: IngredientExtractorService,
  ) {}

  async getTalMenu(areaId: number, branchId: number) {
    this.logger.log(`📥 Fetching menu for branchId=${branchId}, areaId=${areaId}`);

    const data = (await this.talService.getTalMenu(areaId, branchId)) as any;
    const menu = data?.pageProps?.initialMenuState?.menuData ?? { sections: [] };

    const result = {
      restaurant: data?.pageProps?.initialMenuState?.restaurant ?? {},
      items:
        menu.items?.map(item => ({
          ...item,
          ingredients: this.ingredientExtractionService.extractIngredients(
            item.description,
          ),
        })) ?? [],
    };

    await this.saveMenuToFile(result.restaurant.name, result);

    this.logger.log(`✅ Menu saved for branchId=${branchId}`);
    return result;
  }

  private async saveMenuToFile(branchId: number, menuData: any) {
    try {
      if (!fs.existsSync(this.menusDir)) {
        fs.mkdirSync(this.menusDir, { recursive: true });
      }

      const filePath = path.join(this.menusDir, `menu-${branchId}.json`);

      fs.writeFileSync(filePath, JSON.stringify(menuData, null, 2), 'utf8');
    } catch (error) {
      this.logger.error(`❌ Failed to save menu JSON for branchId=${branchId}`, error);
    }
  }
}
