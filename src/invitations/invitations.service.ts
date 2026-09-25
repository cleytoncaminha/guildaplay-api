import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "node:crypto";
import { DataSource, Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import {
  GameTableEntity,
  GameTableStatus,
} from "../tables/entities/game-table.entity.js";
import {
  TableMemberEntity,
  TableMemberStatus,
} from "../memberships/entities/table-member.entity.js";
import {
  InvitationEntity,
  InvitationStatus,
} from "./entities/invitation.entity.js";
import { CreateInvitationDto } from "./dto/create-invitation.dto.js";
@Injectable()
export class InvitationsService {
  constructor(
    private db: DataSource,
    @InjectRepository(InvitationEntity)
    private invites: Repository<InvitationEntity>,
  ) {}
  hash(v: string) {
    return createHash("sha256").update(v).digest("hex");
  }
  async create(u: AuthenticatedUser, tableId: string, d: CreateInvitationDto) {
    const table = await this.db
      .getRepository(GameTableEntity)
      .createQueryBuilder("t")
      .innerJoin("t.gmProfile", "g")
      .where("t.id=:tableId AND g.user_id=:userId", { tableId, userId: u.id })
      .getOne();
    if (!table)
      throw new NotFoundException({
        code: "TABLE_NOT_FOUND",
        message: "Mesa não encontrada.",
      });
    if (table.status === GameTableStatus.ARCHIVED)
      throw new ConflictException({
        code: "INVALID_TABLE_STATUS",
        message: "Mesa arquivada.",
      });
    const raw = randomBytes(48).toString("base64url"),
      expires = d.expiresAt ? new Date(d.expiresAt) : null;
    if (expires && expires <= new Date())
      throw new ConflictException({
        code: "INVITATION_EXPIRED",
        message: "Expiração inválida.",
      });
    const i = await this.db.transaction(async (manager) => {
      const invitation = await manager.save(
        manager.create(InvitationEntity, {
          gameTableId: tableId,
          createdByUserId: u.id,
          tokenHash: this.hash(raw),
          status: InvitationStatus.ACTIVE,
          maxUses: d.maxUses ?? null,
          usesCount: 0,
          expiresAt: expires,
          revokedAt: null,
        }),
      );
      await manager.save(
        manager.create(AuditLogEntity, {
          actorUserId: u.id,
          eventType: "TABLE_INVITATION_CREATED",
          metadata: {
            tableId,
            invitationId: invitation.id,
            maxUses: invitation.maxUses,
            expiresAt: invitation.expiresAt?.toISOString() ?? null,
          },
        }),
      );
      return invitation;
    });
    return {
      id: i.id,
      token: raw,
      maxUses: i.maxUses,
      usesCount: 0,
      expiresAt: i.expiresAt,
    };
  }
  async preview(raw: string) {
    const i = await this.invites.findOne({
      where: { tokenHash: this.hash(raw) },
    });
    if (
      !i ||
      i.status !== InvitationStatus.ACTIVE ||
      (i.expiresAt && i.expiresAt <= new Date()) ||
      (i.maxUses !== null && i.usesCount >= i.maxUses)
    )
      throw new NotFoundException({
        code: "INVITATION_NOT_FOUND",
        message: "Convite não encontrado.",
      });
    const t = await this.db
      .getRepository(GameTableEntity)
      .findOneBy({ id: i.gameTableId });
    if (!t || t.status === GameTableStatus.ARCHIVED)
      throw new NotFoundException({
        code: "INVITATION_NOT_FOUND",
        message: "Convite não encontrado.",
      });
    return {
      table: { name: t.name, system: t.systemName, maxPlayers: t.maxPlayers },
      expiresAt: i.expiresAt,
      maxUses: i.maxUses,
      usesRemaining: i.maxUses === null ? null : i.maxUses - i.usesCount,
    };
  }
  async accept(u: AuthenticatedUser, raw: string) {
    return this.db.transaction(async (m) => {
      const i = await m
        .getRepository(InvitationEntity)
        .createQueryBuilder("i")
        .setLock("pessimistic_write")
        .where("i.token_hash=:h", { h: this.hash(raw) })
        .getOne();
      if (
        !i ||
        i.status !== InvitationStatus.ACTIVE ||
        (i.expiresAt && i.expiresAt <= new Date())
      )
        throw new NotFoundException({
          code: "INVITATION_NOT_FOUND",
          message: "Convite não encontrado.",
        });
      if (i.maxUses !== null && i.usesCount >= i.maxUses)
        throw new ConflictException({
          code: "INVITATION_MAX_USES_REACHED",
          message: "Convite esgotado.",
        });
      const t = await m.findOneByOrFail(GameTableEntity, { id: i.gameTableId });
      if (t.status === GameTableStatus.ARCHIVED)
        throw new ConflictException({
          code: "INVALID_TABLE_STATUS",
          message: "Mesa arquivada.",
        });
      let member = await m.findOneBy(TableMemberEntity, {
        gameTableId: t.id,
        userId: u.id,
      });
      if (member?.status === TableMemberStatus.ACTIVE)
        throw new ConflictException({
          code: "ALREADY_TABLE_MEMBER",
          message: "Usuário já participa da mesa.",
        });
      const reactivated = Boolean(member);
      if (member) {
        member.status = TableMemberStatus.ACTIVE;
        member.leftAt = null;
        member.joinedAt = new Date();
        member.joinedViaInvitationId = i.id;
      } else
        member = m.create(TableMemberEntity, {
          gameTableId: t.id,
          userId: u.id,
          joinedViaInvitationId: i.id,
          status: TableMemberStatus.ACTIVE,
          joinedAt: new Date(),
          leftAt: null,
        });
      member = await m.save(member);
      i.usesCount++;
      await m.save(i);
      await m.save(
        m.create(AuditLogEntity, {
          actorUserId: u.id,
          eventType: reactivated
            ? "TABLE_MEMBER_REACTIVATED"
            : "TABLE_INVITATION_ACCEPTED",
          metadata: {
            tableId: t.id,
            invitationId: i.id,
            membershipId: member.id,
            actorUserId: u.id,
          },
        }),
      );
      return {
        membership: { id: member.id, tableId: t.id, status: member.status },
      };
    });
  }
}
