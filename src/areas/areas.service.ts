import { Injectable } from '@nestjs/common';
import { AreaDto } from './dtos/area.dto';
import { TalService } from '@/external/providers/tal/tal.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AreasService {
  private readonly filePath = path.join(
    process.cwd(),
    'src',
    'data',
    'areas.json',
  );

  constructor(private readonly talservice: TalService) {}

  async getAreas(): Promise<AreaDto[]> {
    const areas = await this.talservice.getTalAreas();

    await this.saveAreasToFileIfChanged(areas);
    return areas;
  }

  private async saveAreasToFileIfChanged(newData: AreaDto[]) {
    let oldData: AreaDto[] = [];

    // ✅ Ensure the directory exists
    const dirPath = path.dirname(this.filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 🟩 Read old file if it exists
    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8').trim();

        if (fileContent.length > 0) {
          oldData = JSON.parse(fileContent);
        }
      } catch {
        oldData = [];
      }
    } else {
      // 🟩 Create empty file if not found
      fs.writeFileSync(this.filePath, '[]', 'utf-8');
    }

    const oldJson = JSON.stringify(oldData);
    const newJson = JSON.stringify(newData);

    // 🟩 Save new data only if changed
    if (oldJson !== newJson) {
      fs.writeFileSync(this.filePath, newJson, 'utf-8');
    }
  }
}
