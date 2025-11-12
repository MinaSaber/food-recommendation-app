import { CreateEventDto } from './dtos/create-event-dto';
import { EventsService } from './events.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../shared/decorators/current-user.decorator';
import { Public } from '@/shared/decorators/public.decorator';

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

  @Public()
  @Get('user/:userId')
  async getEventsForUser(@Param('userId') userId: number) {
    return this.eventsService.getEventsForUser(userId);
  }
}
