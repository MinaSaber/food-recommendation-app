import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAreaBySlug(slug: string) {
    return this.prisma.area.findUnique({
      where: { slug },
    });
  }

  async upsertArea(data: {
    slug: string;
    name: string;
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
  }) {
    return this.prisma.area.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      create: data,
    });
  }

  async upsertAreas(
    areas: Array<{
      slug: string;
      name: string;
      latitude: Prisma.Decimal;
      longitude: Prisma.Decimal;
    }>,
  ) {
    return Promise.all(areas.map((area) => this.upsertArea(area)));
  }
}
