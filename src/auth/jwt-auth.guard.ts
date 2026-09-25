import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./auth.decorators";
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(c: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        c.getHandler(),
        c.getClass(),
      ])
    )
      return true;
    return super.canActivate(c);
  }
  handleRequest<T>(e: unknown, u: T) {
    if (e || !u)
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Não autenticado.",
      });
    return u;
  }
}
