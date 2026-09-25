import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UserEntity, UserStatus } from "../users/entities/user.entity.js";
import {
  UserRole,
  UserRoleEntity,
} from "../users/entities/user-role.entity.js";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { AuthCredentialEntity } from "./entities/auth-credential.entity.js";
import { AuthSessionEntity } from "./entities/auth-session.entity.js";
import { EmailVerificationTokenEntity } from "./entities/email-verification-token.entity.js";
import { PasswordResetTokenEntity } from "./entities/password-reset-token.entity.js";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity.js";
import { LoginDto, RegisterDto } from "./dto/auth.dto.js";
import { PasswordService } from "./password.service.js";
import { SessionService } from "./session.service.js";
import { TokenService } from "./token.service.js";
import { AuthenticatedUser } from "./auth.types.js";
const unauthorized = (code = "UNAUTHORIZED", message = "Não autorizado.") =>
  new UnauthorizedException({ code, message });
@Injectable()
export class AuthService {
  constructor(
    private db: DataSource,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(AuthCredentialEntity)
    private creds: Repository<AuthCredentialEntity>,
    @InjectRepository(EmailVerificationTokenEntity)
    private verify: Repository<EmailVerificationTokenEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private reset: Repository<PasswordResetTokenEntity>,
    @InjectRepository(AuditLogEntity) private audit: Repository<AuditLogEntity>,
    @InjectRepository(GmProfileEntity)
    private gmProfiles: Repository<GmProfileEntity>,
    private pass: PasswordService,
    private sessions: SessionService,
    private tokens: TokenService,
  ) {}
  private email(v: string) {
    return v.trim().toLowerCase();
  }
  private async log(eventType: string, actorUserId: string | null) {
    await this.audit.save(
      this.audit.create({ eventType, actorUserId, metadata: null }),
    );
  }
  private view(u: UserEntity, roles: UserRole[]) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: !!u.emailVerifiedAt,
      roles,
    };
  }
  async register(d: RegisterDto) {
    const email = this.email(d.email);
    if (await this.users.exists({ where: { emailNormalized: email } }))
      throw new ConflictException({
        code: "EMAIL_ALREADY_EXISTS",
        message: "E-mail já cadastrado.",
      });
    const hash = await this.pass.hashPassword(d.password),
      raw = this.tokens.opaque();
    const u = await this.db.transaction(async (m) => {
      const user = await m.save(
        m.create(UserEntity, {
          name: d.name.trim(),
          email: d.email.trim(),
          emailNormalized: email,
          timezone: "America/Sao_Paulo",
          status: UserStatus.ACTIVE,
          countryCode: null,
        }),
      );
      await m.save(
        m.create(UserRoleEntity, { userId: user.id, role: UserRole.USER }),
      );
      await m.save(
        m.create(AuthCredentialEntity, {
          userId: user.id,
          passwordHash: hash,
          passwordChangedAt: new Date(),
        }),
      );
      await m.save(
        m.create(EmailVerificationTokenEntity, {
          userId: user.id,
          tokenHash: this.tokens.hash(raw),
          expiresAt: new Date(Date.now() + 86400000),
          usedAt: null,
        }),
      );
      return user;
    });
    await this.log("USER_REGISTERED", u.id);
    return { user: this.view(u, [UserRole.USER]), raw };
  }
  async login(d: LoginDto, ua?: string, ip?: string) {
    const u = await this.users.findOne({
        where: { emailNormalized: this.email(d.email) },
      }),
      c = u && (await this.creds.findOne({ where: { userId: u.id } }));
    if (
      !u ||
      !c ||
      u.status !== UserStatus.ACTIVE ||
      !(await this.pass.verifyPassword(c.passwordHash, d.password))
    ) {
      await this.log("LOGIN_FAILED", u?.id ?? null);
      throw unauthorized("INVALID_CREDENTIALS", "Credenciais inválidas.");
    }
    const roles = (
        await this.db
          .getRepository(UserRoleEntity)
          .find({ where: { userId: u.id } })
      ).map((x) => x.role),
      s = await this.sessions.create(u.id, this.tokens.refreshTtl(), ua, ip);
    await this.log("LOGIN_SUCCEEDED", u.id);
    return {
      accessToken: await this.tokens.access({
        sub: u.id,
        sid: s.row.id,
        roles,
      }),
      expiresIn: this.tokens.accessTtl(),
      refreshToken: s.raw,
      user: this.view(u, roles),
    };
  }
  async me(a: AuthenticatedUser) {
    const [u, gmProfile] = await Promise.all([
      this.users.findOneByOrFail({ id: a.id }),
      this.gmProfiles.findOne({ where: { userId: a.id } }),
    ]);
    return {
      ...this.view(u, a.roles),
      gmProfile: gmProfile
        ? {
            id: gmProfile.id,
            displayName: gmProfile.displayName,
            status: gmProfile.status,
          }
        : null,
    };
  }
  async refresh(raw: string, ua?: string, ip?: string) {
    const s = await this.sessions.rotate(raw, this.tokens.refreshTtl(), ua, ip);
    if (!s) throw unauthorized();
    const roles = (
      await this.db
        .getRepository(UserRoleEntity)
        .find({ where: { userId: s.row.userId } })
    ).map((x) => x.role);
    return {
      accessToken: await this.tokens.access({
        sub: s.row.userId,
        sid: s.row.id,
        roles,
      }),
      expiresIn: this.tokens.accessTtl(),
      refreshToken: s.raw,
    };
  }
  async logout(a: AuthenticatedUser) {
    await this.sessions.revoke(a.sessionId);
    await this.log("LOGOUT", a.id);
  }
  async logoutAll(a: AuthenticatedUser) {
    await this.sessions.revokeAll(a.id);
    await this.log("ALL_SESSIONS_REVOKED", a.id);
  }
  async consumeVerification(raw: string) {
    const t = await this.verify.findOne({
      where: { tokenHash: this.tokens.hash(raw) },
    });
    if (!t || t.usedAt || t.expiresAt <= new Date())
      throw unauthorized("UNAUTHORIZED", "Token inválido.");
    await this.db.transaction(async (m) => {
      await m.update(EmailVerificationTokenEntity, t.id, {
        usedAt: new Date(),
      });
      await m.update(UserEntity, t.userId, { emailVerifiedAt: new Date() });
    });
    await this.log("EMAIL_VERIFIED", t.userId);
  }
  async resend(email: string) {
    const u = await this.users.findOne({
      where: { emailNormalized: this.email(email) },
    });
    if (!u || u.emailVerifiedAt) return null;
    const raw = this.tokens.opaque();
    await this.verify
      .createQueryBuilder()
      .update()
      .set({ usedAt: new Date() })
      .where("user_id = :userId AND used_at IS NULL", { userId: u.id })
      .execute();
    await this.verify.save(
      this.verify.create({
        userId: u.id,
        tokenHash: this.tokens.hash(raw),
        expiresAt: new Date(Date.now() + 86400000),
        usedAt: null,
      }),
    );
    return raw;
  }
  async forgot(email: string) {
    const u = await this.users.findOne({
      where: { emailNormalized: this.email(email) },
    });
    if (!u) return null;
    const raw = this.tokens.opaque();
    await this.reset
      .createQueryBuilder()
      .update()
      .set({ usedAt: new Date() })
      .where("user_id = :userId AND used_at IS NULL", { userId: u.id })
      .execute();
    await this.reset.save(
      this.reset.create({
        userId: u.id,
        tokenHash: this.tokens.hash(raw),
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      }),
    );
    return raw;
  }
  async resetPassword(raw: string, password: string) {
    const t = await this.reset.findOne({
      where: { tokenHash: this.tokens.hash(raw) },
    });
    if (!t || t.usedAt || t.expiresAt <= new Date())
      throw unauthorized("UNAUTHORIZED", "Token inválido.");
    const hash = await this.pass.hashPassword(password);
    await this.db.transaction(async (m) => {
      await m.update(AuthCredentialEntity, t.userId, {
        passwordHash: hash,
        passwordChangedAt: new Date(),
      });
      await m
        .createQueryBuilder()
        .update(PasswordResetTokenEntity)
        .set({ usedAt: new Date() })
        .where("user_id = :userId AND used_at IS NULL", { userId: t.userId })
        .execute();
      await m
        .createQueryBuilder()
        .update(AuthSessionEntity)
        .set({ revokedAt: new Date() })
        .where("user_id=:id", { id: t.userId })
        .execute();
    });
    await this.log("PASSWORD_RESET", t.userId);
  }
}
