import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import { GameTableEntity } from "../tables/entities/game-table.entity";
import { UserEntity } from "../users/entities/user.entity";
import {
  TableMemberEntity,
  TableMemberStatus,
} from "./entities/table-member.entity";
@Injectable()
export class MembershipsService {
  constructor(
    private db: DataSource,
    @InjectRepository(TableMemberEntity)
    private members: Repository<TableMemberEntity>,
  ) {}
  async owned(userId: string, tableId: string) {
    const t = await this.db
      .getRepository(GameTableEntity)
      .createQueryBuilder("t")
      .innerJoin("t.gmProfile", "g")
      .where("t.id=:tableId AND g.user_id=:userId", { tableId, userId })
      .getOne();
    if (!t)
      throw new NotFoundException({
        code: "TABLE_NOT_FOUND",
        message: "Mesa não encontrada.",
      });
    return t;
  }
  async list(u: AuthenticatedUser, id: string) {
    await this.owned(u.id, id);
    const rows = await this.members.find({ where: { gameTableId: id } });
    const users = await this.db
      .getRepository(UserEntity)
      .findBy({ id: In(rows.map((x) => x.userId)) });
    return rows.map((x) => ({
      id: x.id,
      status: x.status,
      joinedAt: x.joinedAt,
      user: { id: x.userId, name: users.find((u) => u.id === x.userId)?.name },
    }));
  }
  async remove(u: AuthenticatedUser, tableId: string, id: string) {
    await this.owned(u.id, tableId);
    const m = await this.members.findOneBy({ id, gameTableId: tableId });
    if (!m)
      throw new NotFoundException({
        code: "TABLE_MEMBER_NOT_FOUND",
        message: "Membro não encontrado.",
      });
    if (m.status === TableMemberStatus.REMOVED)
      throw new ConflictException({
        code: "TABLE_MEMBER_ALREADY_REMOVED",
        message: "Membro já removido.",
      });
    m.status = TableMemberStatus.REMOVED;
    m.leftAt = new Date();
    await this.members.save(m);
    await this.db.getRepository(AuditLogEntity).save({
      actorUserId: u.id,
      eventType: "TABLE_MEMBER_REMOVED",
      metadata: { tableId, membershipId: id },
    });
    return { id: m.id, status: m.status };
  }
  async mine(u: AuthenticatedUser) {
    const rows = await this.members.find({ where: { userId: u.id } });
    const tables = await this.db.getRepository(GameTableEntity).find({
      where: { id: In(rows.map((x) => x.gameTableId)) },
      relations: { gmProfile: true },
    });
    return rows.map((x) => ({
      id: x.id,
      status: x.status,
      table: (() => {
        const t = tables.find((v) => v.id === x.gameTableId);
        return {
          id: x.gameTableId,
          name: t?.name,
          status: t?.status,
          gm: t
            ? { id: t.gmProfile.id, displayName: t.gmProfile.displayName }
            : null,
        };
      })(),
    }));
  }
}
