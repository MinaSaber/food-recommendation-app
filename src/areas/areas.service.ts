import { Injectable } from '@nestjs/common';
import { AreaDto } from './dtos/area.dto';
import { TalService } from '@/external/providers/tal/tal.service';
import * as fs from 'fs';
import * as path from 'path';
import { AreasRepository } from './areas.repository';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AreasService {
  private readonly filePath = path.join(
    process.cwd(),
    'src',
    'data',
    'areas.json',
  );

  constructor(
    private readonly talservice: TalService,
    private readonly areasRepository: AreasRepository,
  ) {}

  async getAreas(): Promise<AreaDto[]> {
    const areas = await this.talservice.getTalAreas();

    // Ensure areas is an array
    const areasArray = Array.isArray(areas) ? areas : [];

    await this.saveAreasToFileIfChanged(areasArray);
    await this.saveAreasToDatabase(areasArray);
    return areasArray;
  }

  async getAreaBySlug(slug: string) {
    return this.areasRepository.getAreaBySlug(slug);
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

  private async saveAreasToDatabase(areas: AreaDto[]) {
    // Ensure we have an array before mapping
    if (!Array.isArray(areas) || areas.length === 0) {
      return;
    }

    const areasToSave = areas.map((area) => ({
      slug: area.slug,
      name: area.name,
      latitude: new Prisma.Decimal(area.lat),
      longitude: new Prisma.Decimal(area.lng),
    }));

    await this.areasRepository.upsertAreas(areasToSave);
  }
}
