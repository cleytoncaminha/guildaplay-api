import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EnvironmentVariables } from "../config/env.validation.js";
import { UserEntity, UserStatus } from "../users/entities/user.entity.js";
import { UserRoleEntity } from "../users/entities/user-role.entity.js";
import { JwtPayload, AuthenticatedUser } from "./auth.types.js";
import { AuthSessionEntity } from "./entities/auth-session.entity.js";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService<EnvironmentVariables>,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity) private roles: Repository<UserRoleEntity>,
    @InjectRepository(AuthSessionEntity)
    private sessions: Repository<AuthSessionEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }
  async validate(p: JwtPayload): Promise<AuthenticatedUser> {
    const [u, session] = await Promise.all([
      this.users.findOne({ where: { id: p.sub } }),
      this.sessions.findOne({ where: { id: p.sid } }),
    ]);
    if (
      !u ||
      u.status !== UserStatus.ACTIVE ||
      !session ||
      session.userId !== p.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    )
      throw new Error("unauthorized");
    const roles = (await this.roles.find({ where: { userId: u.id } })).map(
      (x) => x.role,
    );
    return {
      id: u.id,
      sessionId: p.sid,
      roles,
      emailVerified: !!u.emailVerifiedAt,
    };
  }
}
