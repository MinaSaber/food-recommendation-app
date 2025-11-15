import { PrismaService } from '@/prsima/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAreaBySlug(slug: string) {
    return this.prisma.area.findUnique({
      where: { slug },
    });
  }
}
