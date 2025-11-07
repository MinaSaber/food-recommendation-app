import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUserPayload;
    }
  }
}
