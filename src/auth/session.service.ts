import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { AuthSessionEntity } from "./entities/auth-session.entity.js";
import { TokenService } from "./token.service.js";
@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private repo: Repository<AuthSessionEntity>,
    private tokens: TokenService,
  ) {}
  async create(
    userId: string,
    ttl: number,
    ua?: string,
    ip?: string,
    family?: string,
  ) {
    const raw = this.tokens.opaque();
    const row = this.repo.create({
      userId,
      tokenFamilyId: family ?? randomUUID(),
      refreshTokenHash: this.tokens.hash(raw),
      userAgent: ua ?? null,
      ipAddress: ip ?? null,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + ttl * 1000),
      revokedAt: null,
    });
    return { row: await this.repo.save(row), raw };
  }
  async rotate(raw: string, ttl: number, ua?: string, ip?: string) {
    const old = await this.repo.findOne({
      where: { refreshTokenHash: this.tokens.hash(raw) },
    });
    if (!old || old.revokedAt || old.expiresAt <= new Date()) {
      if (old)
        await this.repo.update(
          { tokenFamilyId: old.tokenFamilyId },
          { revokedAt: new Date() },
        );
      return null;
    }
    const revocation = await this.repo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where("id = :id AND revoked_at IS NULL", { id: old.id })
      .execute();
    if (revocation.affected !== 1) return null;
    return this.create(old.userId, ttl, ua, ip, old.tokenFamilyId);
  }
  async revoke(id: string) {
    await this.repo.update(id, { revokedAt: new Date() });
  }
  async revokeAll(userId: string) {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where("user_id=:userId AND revoked_at IS NULL", { userId })
      .execute();
  }
}
