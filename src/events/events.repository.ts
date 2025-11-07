import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prsima/prisma.service';
import { CreateEventDto } from './dtos/create-event-dto';
import { getEventValue } from '@/shared/utils/utils';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(userId: number, createEventDto: CreateEventDto) {
    const value = getEventValue(createEventDto.eventType);
    return this.prisma.event.create({
      data: {
        userId,
        ...createEventDto,
        value,
      },
    });
  }
}
