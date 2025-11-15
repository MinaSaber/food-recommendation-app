import { RestaurantsRepository } from './restaurants.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FoodItemsService } from '../food-items/food-items.service';
import { TalService } from '@/external/providers/tal/tal.service';
import * as fs from 'fs';
import * as path from 'path';
import { AreaDto } from '@/areas/dtos/area.dto';
import { VendorDto } from '@/shared/dtos/vendor.dto';
import { AreasService } from '@/areas/areas.service';

@Injectable()
export class RestaurantsService {
  private readonly areasFilePath = path.join(
    process.cwd(),
    'src',
    'data',
    'areas.json',
  );
  private readonly popularAreasFilePath = path.join(
    process.cwd(),
    'src',
    'areas',
    'popular-areas.json',
  );
  private readonly vendorsFolder = path.join(
    process.cwd(),
    'src',
    'data',
    'vendors',
  );

  constructor(
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly talservice: TalService,
    private readonly areasService: AreasService,
  ) {}

  async getRestaurants() {
    return this.restaurantsRepository.getRestaurants();
  }

  async getRestaurantByNameAndLocation(
    name: string,
    longitude: number,
    latitude: number,
  ) {
    return this.restaurantsRepository.getRestaurantByNameAndLocation(
      name,
      longitude,
      latitude,
    );
  }

  async getFoodItemsForRestaurant(restaurantId: number) {
    // const restaurant =
    //   await this.restaurantsRepository.getRestaurantById(restaurantId);
    // if (!restaurant) {
    //   throw new NotFoundException('Restaurant not found');
    // }
    // return this.foodItemsService.getFoodItemsForRestaurant(restaurant.id);
  }

  async getTalVendors(areaSlug: string) {
    const talAreaId = await this.getAreaId(areaSlug);
    if (!talAreaId) {
      throw new Error(
        `Area with slug ${areaSlug} not found. Please ensure the area exists.`,
      );
    }

    const data = (await this.talservice.getTalVendors(
      talAreaId,
      areaSlug,
    )) as any;
    const vendors = (data?.pageProps?.data?.vendors as VendorDto[]) ?? [];

    const area = await this.areasService.getAreaBySlug(areaSlug);
    if (!area) {
      throw new Error(
        `Area with slug ${areaSlug} not found. Please ensure the area exists.`,
      );
    }

    const existingRestaurants =
      await this.restaurantsRepository.getRestaurantsByArea(area.id);

    const existingSet = new Set(
      existingRestaurants.map(
        (r) =>
          `${r.name.toLowerCase()}-${Number(r.latitude)}-${Number(r.longitude)}`,
      ),
    );

    const newRestaurants = vendors.filter((v) => {
      const key = `${v.name.toLowerCase()}-${Number(v.latitude)}-${Number(v.longitude)}`;
      return !existingSet.has(key);
    });

    await Promise.all([
      this.saveVendorsToFileIfChanged(areaSlug, vendors),
      this.saveRestaurantsIntoDatabase(area.id, newRestaurants),
    ]);

    return vendors;
  }

  private async saveRestaurantsIntoDatabase(
    areaId: number,
    vendors: VendorDto[],
  ) {
    const restaurants = vendors.map((v) => ({
      name: v.name,
      description: v.cuisineString ?? '',
      latitude: v.latitude ?? '',
      longitude: v.longitude ?? '',
      rating: v.rate ?? 0,
      areaId,
    }));
    await this.restaurantsRepository.createRestaurants(restaurants);
  }

  private async getAreaId(areaSlug: string): Promise<number | null> {
    // First, try to find in areas.json
    if (fs.existsSync(this.areasFilePath)) {
      try {
        const raw = fs.readFileSync(this.areasFilePath, 'utf8').trim();
        if (raw.length > 0) {
          const areas = JSON.parse(raw);
          const area = areas.find((a: any) => a.slug === areaSlug);
          if (area?.slug) return area.id;
        }
      } catch {
        // Continue to next check
      }
    }

    // Second, try to find in popular-areas.json
    if (fs.existsSync(this.popularAreasFilePath)) {
      try {
        const raw = fs.readFileSync(this.popularAreasFilePath, 'utf8').trim();
        if (raw.length > 0) {
          const popularAreas = JSON.parse(raw);
          const area = popularAreas.find((a: any) => a.slug === areaSlug);
          if (area?.slug) return area.id;
        }
      } catch {
        // Continue to next check
      }
    }

    // Finally, try to fetch from API
    try {
      const areas = (await this.talservice.getTalAreas()) as AreaDto[];
      const area = areas.find((a) => a.slug === areaSlug);
      if (area?.id) return area.id;
    } catch {
      // If API call fails, return null
    }

    return null;
  }

  private async saveVendorsToFileIfChanged(
    areaSlug: string,
    vendors: VendorDto[],
  ) {
    if (!fs.existsSync(this.vendorsFolder)) {
      fs.mkdirSync(this.vendorsFolder, { recursive: true });
    }

    const filePath = path.join(this.vendorsFolder, `${areaSlug}.json`);

    let oldData: VendorDto[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8').trim();
        if (raw.length > 0) oldData = JSON.parse(raw);
      } catch {
        oldData = [];
      }
    }

    const oldJson = JSON.stringify(oldData);
    const newJson = JSON.stringify(vendors);

    if (oldJson !== newJson) {
      fs.writeFileSync(filePath, newJson, 'utf8');
    }
  }
}
