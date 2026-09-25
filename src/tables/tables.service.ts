import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity";
import { StorageService } from "../storage/storage.service";
import {
  MediaAssetEntity,
  MediaStatus,
} from "../uploads/entities/media-asset.entity";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";
import {
  BillingInterval,
  BillingPlanEntity,
  BillingPlanStatus,
} from "./entities/billing-plan.entity";
import {
  GameTableEntity,
  GameTableStatus,
  ScheduleFrequency,
} from "./entities/game-table.entity";

@Injectable()
export class TablesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(GameTableEntity)
    private tables: Repository<GameTableEntity>,
    private storage: StorageService,
  ) {}
  private async gm(userId: string) {
    const profile = await this.dataSource
      .getRepository(GmProfileEntity)
      .findOne({ where: { userId } });
    if (!profile)
      throw new NotFoundException({
        code: "GM_PROFILE_NOT_FOUND",
        message: "Perfil de mestre não encontrado.",
      });
    return profile;
  }
  private plan(table: GameTableEntity) {
    return table.billingPlans.find(
      (p) => p.status === BillingPlanStatus.ACTIVE,
    );
  }
  private async view(table: GameTableEntity, cover?: MediaAssetEntity | null) {
    const plan = this.plan(table);
    return {
      id: table.id,
      name: table.name,
      description: table.description,
      system: table.systemName,
      status: table.status,
      maxPlayers: table.maxPlayers,
      activePlayers: 0,
      weekday: table.weekday,
      startTime: table.startTime,
      timezone: table.timezone,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
      cover: cover
        ? { id: cover.id, url: await this.storage.signedGet(cover.objectKey) }
        : null,
      ...(plan
        ? {
            monthlyPriceCents: plan.amountCents,
            currency: plan.currency,
            platformFeeBps: plan.platformFeeBps,
            billingPlan: {
              amountCents: plan.amountCents,
              currency: plan.currency,
              interval: plan.interval,
            },
          }
        : {}),
    };
  }
  private async coversFor(tables: GameTableEntity[]) {
    const ids = tables
      .map((table) => table.coverAssetId)
      .filter((id): id is string => Boolean(id));
    if (!ids.length) return new Map<string, MediaAssetEntity>();
    const assets = await this.dataSource
      .getRepository(MediaAssetEntity)
      .findBy({
        id: In(ids),
        status: MediaStatus.ACTIVE,
      });
    return new Map(assets.map((asset) => [asset.id, asset]));
  }
  private async owned(userId: string, id: string) {
    const table = await this.tables
      .createQueryBuilder("table")
      .innerJoin("table.gmProfile", "gm")
      .leftJoinAndSelect("table.billingPlans", "plan")
      .where("table.id = :id AND gm.user_id = :userId", { id, userId })
      .getOne();
    if (!table)
      throw new NotFoundException({
        code: "TABLE_NOT_FOUND",
        message: "Mesa não encontrada.",
      });
    return table;
  }
  async create(user: AuthenticatedUser, dto: CreateTableDto) {
    const result = await this.dataSource.transaction(async (m) => {
      const gm = await m.findOne(GmProfileEntity, {
        where: { userId: user.id },
      });
      if (!gm)
        throw new NotFoundException({
          code: "GM_PROFILE_NOT_FOUND",
          message: "Perfil de mestre não encontrado.",
        });
      const table = await m.save(
        m.create(GameTableEntity, {
          gmProfileId: gm.id,
          name: dto.name,
          description: dto.description ?? null,
          systemName: dto.system,
          coverAssetId: null,
          maxPlayers: dto.maxPlayers,
          scheduleFrequency: dto.scheduleFrequency ?? ScheduleFrequency.WEEKLY,
          weekday: dto.weekday ?? null,
          startTime: dto.startTime ?? null,
          timezone: dto.timezone,
          status: GameTableStatus.DRAFT,
        }),
      );
      const plan = await m.save(
        m.create(BillingPlanEntity, {
          gameTableId: table.id,
          amountCents: dto.monthlyPriceCents,
          currency: "BRL",
          interval: BillingInterval.MONTHLY,
          platformFeeBps: 800,
          status: BillingPlanStatus.ACTIVE,
          effectiveFrom: new Date(),
          archivedAt: null,
        }),
      );
      await m.save(
        m.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: "TABLE_CREATED",
          metadata: { tableId: table.id, gmProfileId: gm.id },
        }),
      );
      table.billingPlans = [plan];
      return table;
    });
    return this.view(result);
  }
  async listMine(user: AuthenticatedUser) {
    const gm = await this.gm(user.id);
    const tables = await this.tables.find({
      where: { gmProfileId: gm.id },
      relations: { billingPlans: true },
      order: { createdAt: "DESC" },
    });
    const covers = await this.coversFor(tables);
    return Promise.all(
      tables.map((table) =>
        this.view(
          table,
          table.coverAssetId ? covers.get(table.coverAssetId) : null,
        ),
      ),
    );
  }
  async getMine(user: AuthenticatedUser, id: string) {
    const table = await this.owned(user.id, id);
    const covers = await this.coversFor([table]);
    return this.view(
      table,
      table.coverAssetId ? covers.get(table.coverAssetId) : null,
    );
  }
  async update(user: AuthenticatedUser, id: string, dto: UpdateTableDto) {
    const table = await this.owned(user.id, id);
    const updated = await this.dataSource.transaction(async (m) => {
      const row = await m.findOneByOrFail(GameTableEntity, { id: table.id });
      if (dto.name !== undefined) row.name = dto.name;
      if (dto.description !== undefined) row.description = dto.description;
      if (dto.system !== undefined) row.systemName = dto.system;
      if (dto.maxPlayers !== undefined) row.maxPlayers = dto.maxPlayers;
      if (dto.scheduleFrequency !== undefined)
        row.scheduleFrequency = dto.scheduleFrequency;
      if (dto.weekday !== undefined) row.weekday = dto.weekday;
      if (dto.startTime !== undefined) row.startTime = dto.startTime;
      if (dto.timezone !== undefined) row.timezone = dto.timezone;
      const saved = await m.save(row);
      let plan = await m.findOneByOrFail(BillingPlanEntity, {
        gameTableId: row.id,
        status: BillingPlanStatus.ACTIVE,
      });
      if (
        dto.monthlyPriceCents !== undefined &&
        dto.monthlyPriceCents !== plan.amountCents
      ) {
        plan.status = BillingPlanStatus.ARCHIVED;
        plan.archivedAt = new Date();
        await m.save(plan);
        plan = await m.save(
          m.create(BillingPlanEntity, {
            gameTableId: row.id,
            amountCents: dto.monthlyPriceCents,
            currency: "BRL",
            interval: BillingInterval.MONTHLY,
            platformFeeBps: 800,
            status: BillingPlanStatus.ACTIVE,
            effectiveFrom: new Date(),
            archivedAt: null,
          }),
        );
      }
      await m.save(
        m.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: "TABLE_UPDATED",
          metadata: { tableId: row.id },
        }),
      );
      saved.billingPlans = [plan];
      return saved;
    });
    return this.view(updated);
  }
  async transition(
    user: AuthenticatedUser,
    id: string,
    target: GameTableStatus,
    event: string,
  ) {
    const table = await this.owned(user.id, id);
    const allowed: Record<GameTableStatus, GameTableStatus[]> = {
      DRAFT: [GameTableStatus.ACTIVE, GameTableStatus.ARCHIVED],
      ACTIVE: [GameTableStatus.PAUSED, GameTableStatus.ARCHIVED],
      PAUSED: [GameTableStatus.ACTIVE, GameTableStatus.ARCHIVED],
      ARCHIVED: [],
    };
    if (!allowed[table.status].includes(target))
      throw new ConflictException({
        code: "INVALID_TABLE_STATUS_TRANSITION",
        message: "Transição de status inválida.",
      });
    const oldStatus = table.status;
    table.status = target;
    const saved = await this.tables.save(table);
    await this.dataSource.getRepository(AuditLogEntity).save({
      actorUserId: user.id,
      eventType: event,
      metadata: { tableId: id, oldStatus, newStatus: target },
    });
    return { id: saved.id, status: saved.status };
  }
}
