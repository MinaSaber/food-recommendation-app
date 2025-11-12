import { Injectable } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { CreateEventDto } from './dtos/create-event-dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async createEvent(userId: number, createEventDto: CreateEventDto) {
    return this.eventsRepository.createEvent(userId, createEventDto);
  }

  async getEventsForUser(userId: number) {
    const trainingUsersPath = path.join(process.cwd(), 'training_users.json');
    const users = JSON.parse(fs.readFileSync(trainingUsersPath, 'utf-8'));
    const user = users.find((u: { id: number }) => u.id === userId);
    if (!user) {
      throw new Error(
        `User with ID ${userId} not found in training_users.json`,
      );
    }

    const trainingEventsPath = path.join(process.cwd(), 'training_events.json');
    const events = JSON.parse(fs.readFileSync(trainingEventsPath, 'utf-8'));
    const userEvents = events.filter(
      (e: { user_id: number }) => e.user_id === userId,
    );

    const trainingFoodItemsPath = path.join(
      process.cwd(),
      'training_food_items.json',
    );
    const foodItems = JSON.parse(
      fs.readFileSync(trainingFoodItemsPath, 'utf-8'),
    );
    const userFoodItems = foodItems.filter((f: { id: number }) =>
      userEvents.some((e: { item_id: number }) => e.item_id === f.id),
    );
    return userFoodItems.map((f: { id: number }) => {
      return {
        foodItem: f,
        userEvents: userEvents.filter(
          (e: { item_id: number }) => e.item_id === f.id,
        ),
      };
    });
  }
}
