import { CreateEventDto } from './dtos/create-event-dto';
import { EventsService } from './events.service';
import { Body, Controller, Post } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../shared/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async createEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.createEvent(user.id, createEventDto);
  }
}
