// src/vendors/vendors.service.ts
import { Injectable } from '@nestjs/common';
import { TalService } from '@/external/providers/tal/tal.service';
import { VendorDto } from './dtos/vendor.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VendorsService {
  private readonly areasFilePath = path.join(process.cwd(), 'src', 'data', 'areas.json');
  private readonly vendorsFolder = path.join(process.cwd(), 'src', 'data', 'vendors');

  constructor(private readonly talservice: TalService) {}

  async getTalVendors(areaId: number): Promise<VendorDto[]> {
    const areaIdNum = Number(areaId);

    const areaSlug = this.getAreaSlug(areaIdNum);
    if (!areaSlug) {
      throw new Error(
        `Area with ID ${areaIdNum} not found in areas.json. Run /areas first.`
      );
    }

    const data = (await this.talservice.getTalVendors(areaIdNum, areaSlug)) as any;
    const vendors = data?.pageProps?.data?.vendors as VendorDto[] ?? [];

    const mappedVendors = vendors.map(v => ({
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

    await this.saveVendorsToFileIfChanged(areaIdNum, mappedVendors);

    return mappedVendors;
  }

  private getAreaSlug(areaId: number): string | null {
    if (!fs.existsSync(this.areasFilePath)) return null;

    try {
      const raw = fs.readFileSync(this.areasFilePath, 'utf8').trim();
      if (!raw.length) return null;

      const areas = JSON.parse(raw);
      const area = areas.find(a => a.id === areaId);
      return area?.slug ?? null;

    } catch {
      return null;
    }
  }

  private async saveVendorsToFileIfChanged(areaId: number, vendors: VendorDto[]) {
    if (!fs.existsSync(this.vendorsFolder)) {
      fs.mkdirSync(this.vendorsFolder, { recursive: true });
    }

    const filePath = path.join(this.vendorsFolder, `${areaId}.json`);

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
