import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import {
  CreateCatalogSubmissionDto,
  ListMyCatalogSubmissionsQueryDto,
} from "./dto/catalog-submission.dto.js";
import { CatalogItemEntity } from "./entities/catalog-item.entity.js";
import {
  CatalogSubmissionEntity,
  CatalogSubmissionStatus,
  CatalogSubmissionType,
} from "./entities/catalog-submission.entity.js";

@Injectable()
export class CatalogSubmissionsService {
  constructor(
    private db: DataSource,
    @InjectRepository(CatalogSubmissionEntity)
    private submissions: Repository<CatalogSubmissionEntity>,
  ) {}
  private view(s: CatalogSubmissionEntity) {
    return {
      id: s.id,
      type: s.type,
      catalogItemId: s.catalogItemId,
      payload: s.payload,
      status: s.status,
      catalogItem: s.catalogItem
        ? {
            id: s.catalogItem.id,
            slug: s.catalogItem.slug,
            title: s.catalogItem.title,
            type: s.catalogItem.type,
          }
        : null,
      reviewReason: s.reviewReason,
      reviewedAt: s.reviewedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
  async create(user: AuthenticatedUser, dto: CreateCatalogSubmissionDto) {
    return this.db.transaction(async (m) => {
      const catalogItem =
        dto.type === CatalogSubmissionType.UPDATE_ITEM
          ? await m.findOneBy(CatalogItemEntity, { id: dto.catalogItemId! })
          : null;
      if (dto.type === CatalogSubmissionType.UPDATE_ITEM && !catalogItem)
        throw new NotFoundException({
          code: "CATALOG_ITEM_NOT_FOUND",
          message: "Item de catálogo não encontrado.",
        });
      const s = await m.save(
        m.create(CatalogSubmissionEntity, {
          submittedByUserId: user.id,
          catalogItemId:
            dto.type === CatalogSubmissionType.UPDATE_ITEM
              ? dto.catalogItemId!
              : null,
          catalogItem,
          type: dto.type,
          payload: dto.payload,
          status: CatalogSubmissionStatus.PENDING,
        }),
      );
      await m.save(
        m.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: "CATALOG_SUBMISSION_CREATED",
          metadata: { submissionId: s.id, type: s.type },
        }),
      );
      return this.view(s);
    });
  }
  async listMine(user: AuthenticatedUser, q: ListMyCatalogSubmissionsQueryDto) {
    const [rows, total] = await this.submissions.findAndCount({
      where: { submittedByUserId: user.id },
      relations: { catalogItem: true },
      order: { createdAt: "DESC" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    });
    return {
      data: rows.map((s) => this.view(s)),
      meta: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    };
  }
  async getMine(user: AuthenticatedUser, id: string) {
    const s = await this.submissions.findOne({
      where: { id, submittedByUserId: user.id },
      relations: { catalogItem: true },
    });
    if (!s)
      throw new NotFoundException({
        code: "CATALOG_SUBMISSION_NOT_FOUND",
        message: "Proposta não encontrada.",
      });
    return this.view(s);
  }
}
