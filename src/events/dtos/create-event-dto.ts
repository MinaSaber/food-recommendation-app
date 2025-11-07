import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { EventType } from '../../../generated/prisma/client.js';

export class CreateEventDto {
  @IsNumber()
  @IsNotEmpty()
  itemId: number;

  @IsEnum(EventType)
  @IsNotEmpty()
  eventType: EventType;
}
