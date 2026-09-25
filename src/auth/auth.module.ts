import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { UserEntity } from "../users/entities/user.entity.js";
import { UserRoleEntity } from "../users/entities/user-role.entity.js";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PasswordService } from "./password.service.js";
import { SessionService } from "./session.service.js";
import { TokenService } from "./token.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

import { AuthCredentialEntity } from "./entities/auth-credential.entity.js";
import { AuthSessionEntity } from "./entities/auth-session.entity.js";
import { EmailVerificationTokenEntity } from "./entities/email-verification-token.entity.js";
import { PasswordResetTokenEntity } from "./entities/password-reset-token.entity.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthCredentialEntity,
      AuthSessionEntity,
      EmailVerificationTokenEntity,
      PasswordResetTokenEntity,
      UserEntity,
      UserRoleEntity,
      AuditLogEntity,
      GmProfileEntity,
    ]),
    PassportModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [TypeOrmModule, JwtAuthGuard],
})
export class AuthModule {}
