import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { UserEntity } from "../users/entities/user.entity";
import { UserRoleEntity } from "../users/entities/user-role.entity";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";
import { TokenService } from "./token.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";

import { AuthCredentialEntity } from "./entities/auth-credential.entity";
import { AuthSessionEntity } from "./entities/auth-session.entity";
import { EmailVerificationTokenEntity } from "./entities/email-verification-token.entity";
import { PasswordResetTokenEntity } from "./entities/password-reset-token.entity";

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
