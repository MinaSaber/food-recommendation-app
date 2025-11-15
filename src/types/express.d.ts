import { CurrentUserPayload } from '../shared/decorators/current-user.decorator';

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUserPayload;
    }
  }
}
