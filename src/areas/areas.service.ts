import { Injectable } from '@nestjs/common';
import { AreaDto } from './dtos/area.dto';
import { TalService } from '@/external/providers/tal/tal.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AreasService {
      private readonly filePath = path.join(process.cwd(), 'src', 'data', 'areas.json');

  constructor(private readonly talservice: TalService) {}

  async getAreas(countryId?: number): Promise<AreaDto[]> {
    const result = await this.talservice.getTalAreas(countryId) as any

   const areas =  result.areas.map(area => ({
      id: area.id,
      name: area.name,
      slug: area.slug,
      cityId: area.cityId,
      cityName: area.cityName,
      lat: area.lat,
      lng: area.lng,
    } as AreaDto));

    await this.saveAreasToFileIfChanged(areas);
    return areas;
  }
  private async saveAreasToFileIfChanged(newData: AreaDto[]) {
    let oldData: AreaDto[] = [];

    // Read old file if it exists
   if (fs.existsSync(this.filePath)) {
    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf-8').trim();

      if (fileContent.length > 0) {
        oldData = JSON.parse(fileContent);
      }
    } catch {
      // ✅ If file is corrupted or invalid JSON, start with empty
      oldData = [];
    }
  }
    // Compare JSON contents (stringify ensures exact comparison)
    const oldJson = JSON.stringify(oldData);
    const newJson = JSON.stringify(newData);

    if (oldJson !== newJson) {
      fs.writeFileSync(this.filePath, newJson, 'utf-8');
      console.log('✅ areas.json updated (changes detected)');
    } else {
      console.log('⏳ No changes detected, file not updated');
    }
  }
}
