import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AuthenticatedUser } from "./auth.types.js";
@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  canActivate(c: ExecutionContext) {
    const u = c.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!u?.emailVerified)
      throw new ForbiddenException({
        code: "EMAIL_NOT_VERIFIED",
        message: "E-mail não verificado.",
      });
    return true;
  }
}
