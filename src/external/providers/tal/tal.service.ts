import { Injectable } from '@nestjs/common';
import {
  TAL_BASE_URL,
  TAL_LISTING_VENDORS_PATH,
  TAL_AREA_PATH,
  TAL_MENU_PATH,
} from './tal.config';
import { ExternalHttpService } from '@/external/http/external-http.service';
import { AreaDto } from '@/areas/dtos/area.dto';

@Injectable()
export class TalService {
  constructor(private readonly http: ExternalHttpService) {}

  async getTalAreas(): Promise<AreaDto[]> {
    const egyptCountryId = 9;
    const url = `${TAL_BASE_URL}${TAL_AREA_PATH}/${egyptCountryId}`;
    return this.http.get(url);
  }

  getTalVendors(areaId: number, areaSlug: string, countrySlug = 'egypt') {
    const url = `${TAL_BASE_URL}${TAL_LISTING_VENDORS_PATH}`;
    return this.http.get(url, { params: { areaId, areaSlug, countrySlug } });
  }

  getTalMenu(
    aid: number,
    branchId: number,
    countrySlug = 'egypt',
    vertical = 'restaurant',
  ) {
    const url = `${TAL_BASE_URL}${TAL_MENU_PATH}`;
    return this.http.get(url, {
      params: { aid, branchId, countrySlug, vertical },
    });
  }
}
