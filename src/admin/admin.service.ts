import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "passwordhash",
  "accesstoken",
  "refreshtoken",
  "token",
  "rawtoken",
  "cookie",
  "authorization",
  "secret",
  "r2_secret_access_key",
  "presignedurl",
  "uploadurl",
]);

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private auditLogs: Repository<AuditLogEntity>,
  ) {}

  private sanitize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SENSITIVE_METADATA_KEYS.has(key.toLowerCase()))
        .map(([key, nested]) => [key, this.sanitize(nested)]),
    );
  }

  async list(query: ListAuditLogsQueryDto) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to))
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Intervalo de datas inválido.",
      });
    const builder = this.auditLogs
      .createQueryBuilder("audit")
      .orderBy("audit.created_at", "DESC")
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    if (query.eventType)
      builder.andWhere("audit.event_type = :eventType", {
        eventType: query.eventType,
      });
    if (query.actorUserId)
      builder.andWhere("audit.actor_user_id = :actorUserId", {
        actorUserId: query.actorUserId,
      });
    if (query.from)
      builder.andWhere("audit.created_at >= :from", { from: query.from });
    if (query.to) builder.andWhere("audit.created_at <= :to", { to: query.to });
    const [logs, total] = await builder.getManyAndCount();
    return {
      data: logs.map((log) => ({
        id: log.id,
        eventType: log.eventType,
        actorUserId: log.actorUserId,
        metadata: log.metadata ? this.sanitize(log.metadata) : null,
        createdAt: log.createdAt,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
