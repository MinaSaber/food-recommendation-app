import { Injectable } from '@nestjs/common';
import { TalService } from '@/external/providers/tal/tal.service';

@Injectable()
export class MenusService {
  constructor(private readonly talService: TalService) {}

  async getTalMenu(areaId: number, branchId: number) {
    const data = (await this.talService.getTalMenu(areaId, branchId)) as any;

    const menu = data?.pageProps?.data?.menu ?? { sections: [] };

    // Basic clean struct
    return {
      restaurant: data?.pageProps?.data?.restaurant ?? {},
      sections: menu.sections?.map(section => ({
        name: section.name,
        items: section.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
        })),
      })),
    };
  }
}
