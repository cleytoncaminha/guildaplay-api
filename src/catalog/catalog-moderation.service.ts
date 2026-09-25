import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { ReviewCatalogSubmissionDto } from "./dto/catalog-moderation.dto.js";
import {
  CatalogExperienceLevel,
  CatalogItemType,
  CatalogStatus,
} from "./enums/catalog.enums.js";
import { CatalogItemEntity } from "./entities/catalog-item.entity.js";
import {
  CatalogSubmissionEntity,
  CatalogSubmissionStatus,
  CatalogSubmissionType,
} from "./entities/catalog-submission.entity.js";

@Injectable()
export class CatalogModerationService {
  constructor(
    private db: DataSource,
    @InjectRepository(CatalogSubmissionEntity)
    private submissions: Repository<CatalogSubmissionEntity>,
  ) {}
  async pending() {
    return {
      data: await this.submissions.find({
        where: { status: CatalogSubmissionStatus.PENDING },
        order: { createdAt: "ASC" },
      }),
    };
  }
  async review(
    user: AuthenticatedUser,
    id: string,
    status: CatalogSubmissionStatus.APPROVED | CatalogSubmissionStatus.REJECTED,
    dto: ReviewCatalogSubmissionDto,
  ) {
    return this.db.transaction(async (m) => {
      const s = await m.findOneBy(CatalogSubmissionEntity, { id });
      if (!s)
        throw new NotFoundException({
          code: "CATALOG_SUBMISSION_NOT_FOUND",
          message: "Proposta não encontrada.",
        });
      if (s.status !== CatalogSubmissionStatus.PENDING)
        throw new ConflictException({
          code: "CATALOG_SUBMISSION_ALREADY_REVIEWED",
          message: "Proposta já foi revisada.",
        });
      const appliedItem =
        status === CatalogSubmissionStatus.APPROVED
          ? await this.applySubmission(m, s)
          : null;

      s.status = status;
      s.reviewedByUserId = user.id;
      s.reviewReason = dto.reason ?? null;
      s.reviewedAt = new Date();
      const saved = await m.save(s);
      await m.save(
        m.create(AuditLogEntity, {
          actorUserId: user.id,
          eventType: `CATALOG_SUBMISSION_${status}`,
          metadata: { submissionId: id, appliedItemId: appliedItem?.id },
        }),
      );
      return {
        id: saved.id,
        status: saved.status,
        reviewReason: saved.reviewReason,
        reviewedAt: saved.reviewedAt,
        appliedItemId: appliedItem?.id ?? null,
      };
    });
  }

  private async applySubmission(
    manager: EntityManager,
    submission: CatalogSubmissionEntity,
  ): Promise<CatalogItemEntity> {
    const values = this.editableItemValues(submission.payload);
    let item: CatalogItemEntity;

    if (submission.type === CatalogSubmissionType.CREATE_ITEM) {
      if (!values.title || !values.slug || !values.type) {
        throw new BadRequestException({
          code: "CATALOG_SUBMISSION_INVALID_PAYLOAD",
          message:
            "Uma proposta de novo item precisa de title, slug e type válidos.",
        });
      }

      item = manager.create(CatalogItemEntity, {
        ...values,
        status: CatalogStatus.DRAFT,
      });
    } else {
      if (!submission.catalogItemId) {
        throw new BadRequestException({
          code: "CATALOG_SUBMISSION_INVALID_TARGET",
          message: "A proposta de alteração não possui item de destino.",
        });
      }

      const existingItem = await manager.findOneBy(CatalogItemEntity, {
        id: submission.catalogItemId,
      });
      if (!existingItem) {
        throw new NotFoundException({
          code: "CATALOG_ITEM_NOT_FOUND",
          message: "O item alvo da proposta não foi encontrado.",
        });
      }
      item = existingItem;
      Object.assign(item, values);
    }

    if (values.slug) {
      const slugOwner = await manager.findOneBy(CatalogItemEntity, {
        slug: values.slug,
      });
      if (slugOwner && slugOwner.id !== item.id) {
        throw new ConflictException({
          code: "CATALOG_ITEM_SLUG_ALREADY_EXISTS",
          message: "Já existe um item com este slug.",
        });
      }
    }

    return manager.save(item);
  }

  private editableItemValues(
    payload: Record<string, unknown>,
  ): Partial<CatalogItemEntity> {
    const values: Partial<CatalogItemEntity> = {};

    if (typeof payload.title === "string" && payload.title.trim()) {
      values.title = payload.title.trim();
    }
    if (typeof payload.slug === "string" && payload.slug.trim()) {
      values.slug = payload.slug.trim().toLowerCase();
    }
    if (
      typeof payload.type === "string" &&
      Object.values(CatalogItemType).includes(payload.type as CatalogItemType)
    ) {
      values.type = payload.type as CatalogItemType;
    }
    if (
      typeof payload.experienceLevel === "string" &&
      Object.values(CatalogExperienceLevel).includes(
        payload.experienceLevel as CatalogExperienceLevel,
      )
    ) {
      values.experienceLevel =
        payload.experienceLevel as CatalogExperienceLevel;
    }
    if (payload.experienceLevel === null) values.experienceLevel = null;
    if (typeof payload.summary === "string" || payload.summary === null) {
      values.summary = payload.summary;
    }
    if (
      typeof payload.description === "string" ||
      payload.description === null
    ) {
      values.description = payload.description;
    }
    if (
      Number.isInteger(payload.originalReleaseYear) &&
      (payload.originalReleaseYear as number) >= 1800 &&
      (payload.originalReleaseYear as number) <= 2200
    ) {
      values.originalReleaseYear = payload.originalReleaseYear as number;
    }
    if (payload.originalReleaseYear === null) {
      values.originalReleaseYear = null;
    }

    return values;
  }
}
