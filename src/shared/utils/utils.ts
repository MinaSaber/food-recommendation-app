import { EventType } from '../../../generated/prisma/client.js';

export const getEventValue = (eventType: EventType) => {
  switch (eventType) {
    case EventType.view:
      return 0.1;
    case EventType.click:
      return 0.4;
    case EventType.like:
      return 0.6;
    case EventType.share:
      return 0.8;
    case EventType.order:
      return 1.0;
    // case EventType.rate:
    //   return 2.0;
    default:
      return 0.0;
  }
};
