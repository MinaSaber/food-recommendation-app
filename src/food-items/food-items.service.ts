import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FoodItemsRepository } from './food-items.repository';
import * as path from 'path';
import { TalService } from '@/external/providers/tal/tal.service';
import { IngredientExtractorService } from '@/ingredient-extractor/ingreadient-extractor.service';
import * as fs from 'fs';
import { RestaurantsService } from '@/restaurants/restaurants.service';
import { CreateFoodItemDto } from './dtos/create-food-item.dto';

@Injectable()
export class FoodItemsService {
  private readonly logger = new Logger(FoodItemsService.name);
  private readonly foodItemsDir = path.join(
    process.cwd(),
    'src',
    'data',
    'food-items',
  );

  constructor(
    private readonly foodItemsRepository: FoodItemsRepository,
    private readonly talService: TalService,
    private readonly ingredientExtractionService: IngredientExtractorService,
    @Inject(forwardRef(() => RestaurantsService))
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async getFoodItemsForRestaurant(restaurantId: number) {
    return this.foodItemsRepository.getFoodItemsForRestaurant(restaurantId);
  }

  async getTalMenu(areaId: number, branchId: number) {
    this.logger.log(
      `📥 Fetching menu for branchId=${branchId}, areaId=${areaId}`,
    );

    const data = (await this.talService.getTalMenu(areaId, branchId)) as any;
    const menu = data?.pageProps?.initialMenuState?.menuData ?? {
      sections: [],
    };

    return data;
    // const { name, longitude, latitude } = result.restaurant;

    // const restaurantFromDatabase =
    //   await this.restaurantsService.getRestaurantByNameAndLocation(
    //     name,
    //     longitude,
    //     latitude,
    //   );

    // if (!restaurantFromDatabase) {
    //   throw new NotFoundException('Restaurant not found');
    // }

    // const existingFoodItems =
    //   await this.foodItemsRepository.getFoodItemsByRestaurantId(
    //     restaurantFromDatabase.id,
    //   );

    // const existingSet = new Set(
    //   existingFoodItems.map(
    //     (r) => `${r.name.toLowerCase()}-${r.description.toLowerCase()}`,
    //   ),
    // );

    // const newFoodItems = result.items.filter((item) => {
    //   const key = `${item.name.toLowerCase()}-${item.description.toLowerCase()}`;
    //   return !existingSet.has(key);
    // });

    // await Promise.all([
    //   this.saveMenuToFile(result.restaurant.name, result),
    //   this.saveFoodItemsToDatabase(restaurantFromDatabase.id, newFoodItems),
    // ]);

    // this.logger.log(`✅ Menu saved for branchId=${branchId}`);
    // return result;
  }

  private async saveFoodItemsToDatabase(restaurantId: number, foodItems: any) {
    const foodItemsToSave: CreateFoodItemDto[] = foodItems.map((item: any) => {
      // Extract category from originalSection (excluding "Picks for you 🔥")
      let category: string | undefined = undefined;
      if (
        item.originalSection &&
        item.originalSection !== 'Picks for you 🔥' &&
        item.originalSection.trim() !== ''
      ) {
        category = item.originalSection.trim();
      }

      // Extract tags from name, description, and ingredients
      const tags = this.ingredientExtractionService.extractTags(
        item.name || '',
        item.description || '',
        item.ingredients || [],
      );

      return {
        name: item.name,
        description: item.description,
        ingredients: item.ingredients,
        price: item.price,
        rating: item.rating,
        restaurantId,
        category,
        tags: tags.length > 0 ? tags : undefined,
      };
    });
    await this.foodItemsRepository.createFoodItems(foodItemsToSave);
  }

  private async saveMenuToFile(branchId: number, menuData: any) {
    try {
      if (!fs.existsSync(this.foodItemsDir)) {
        fs.mkdirSync(this.foodItemsDir, { recursive: true });
      }

      const filePath = path.join(
        this.foodItemsDir,
        `food-items-${branchId}.json`,
      );

      fs.writeFileSync(filePath, JSON.stringify(menuData, null, 2), 'utf8');
    } catch (error) {
      this.logger.error(
        `❌ Failed to save menu JSON for branchId=${branchId}`,
        error,
      );
    }
  }
}
