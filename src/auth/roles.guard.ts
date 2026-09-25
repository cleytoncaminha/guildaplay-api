import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./auth.decorators.js";
import { AuthenticatedUser } from "./auth.types.js";
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private r: Reflector) {}
  canActivate(c: ExecutionContext) {
    const roles = this.r.getAllAndOverride<string[]>(ROLES_KEY, [
      c.getHandler(),
      c.getClass(),
    ]);
    if (!roles?.length) return true;
    const u = c.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!u?.roles.some((x) => roles.includes(x)))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Sem permissão.",
      });
    return true;
  }
}
