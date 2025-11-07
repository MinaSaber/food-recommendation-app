import { Injectable } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { CreateEventDto } from './dtos/create-event-dto';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async createEvent(userId: number, createEventDto: CreateEventDto) {
    return this.eventsRepository.createEvent(userId, createEventDto);
  }
}
