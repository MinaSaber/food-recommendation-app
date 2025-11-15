// src/vendors/vendors.service.ts
import { Injectable } from '@nestjs/common';
import { TalService } from '@/external/providers/tal/tal.service';
import { VendorDto } from './dtos/vendor.dto';
import { AreaDto } from '@/areas/dtos/area.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VendorsService {
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

  constructor(private readonly talservice: TalService) {}

  async getTalVendors(areaId: number): Promise<VendorDto[]> {
    const areaIdNum = Number(areaId);

    const areaSlug = await this.getAreaSlug(areaIdNum);
    if (!areaSlug) {
      throw new Error(
        `Area with ID ${areaIdNum} not found. Please ensure the area exists.`,
      );
    }

    const data = (await this.talservice.getTalVendors(
      areaIdNum,
      areaSlug,
    )) as any;
    const vendors = (data?.pageProps?.data?.vendors as VendorDto[]) ?? [];

    const mappedVendors = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      cuisineString: v.cuisineString,
      heroImage: v.heroImage,
      logo: v.logo,
      rate: v.rate,
      totalReviews: v.totalReviews,
      deliveryFee: v.deliveryFee,
      minimumOrderAmount: v.minimumOrderAmount,
      avgDeliveryTime: v.avgDeliveryTime,
      branchId: v.branchId,
      restaurantId: v.restaurantId,
      latitude: v.latitude,
      longitude: v.longitude,
      menuUrl: v.menuUrl,
    }));

    await this.saveVendorsToFileIfChanged(areaSlug, mappedVendors);

    return mappedVendors;
  }

  private async getAreaSlug(areaId: number): Promise<string | null> {
    // First, try to find in areas.json
    if (fs.existsSync(this.areasFilePath)) {
      try {
        const raw = fs.readFileSync(this.areasFilePath, 'utf8').trim();
        if (raw.length > 0) {
          const areas = JSON.parse(raw);
          const area = areas.find((a: any) => a.id === areaId);
          if (area?.slug) return area.slug;
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
          const area = popularAreas.find((a: any) => a.id === areaId);
          if (area?.slug) return area.slug;
        }
      } catch {
        // Continue to next check
      }
    }

    // Finally, try to fetch from API
    try {
      const areas = (await this.talservice.getTalAreas()) as AreaDto[];
      const area = areas.find((a) => a.id === areaId);
      if (area?.slug) return area.slug;
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
