import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import {
  ListCatalogReviewsQueryDto,
  ModerateCatalogReviewDto,
  UpsertCatalogReviewDto,
} from "./dto/catalog-review.dto.js";
import { CatalogStatus } from "./enums/catalog.enums.js";
import { CatalogItemEntity } from "./entities/catalog-item.entity.js";
import {
  CatalogItemReviewEntity,
  CatalogReviewStatus,
} from "./entities/catalog-item-review.entity.js";

export type CatalogReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
};

@Injectable()
export class CatalogReviewsService {
  constructor(private db: DataSource) {}

  async upsert(
    user: AuthenticatedUser,
    itemId: string,
    dto: UpsertCatalogReviewDto,
  ) {
    return this.db.transaction(async (manager) => {
      await this.publishedItemOrFail(manager, itemId);
      let review = await manager.findOneBy(CatalogItemReviewEntity, {
        userId: user.id,
        catalogItemId: itemId,
      });
      const isNew = !review;
      if (!review) {
        review = manager.create(CatalogItemReviewEntity, {
          userId: user.id,
          catalogItemId: itemId,
        });
      }
      review.rating = dto.rating;
      review.content = dto.content?.trim() || null;
      review.status = CatalogReviewStatus.PENDING;
      review.moderatedByUserId = null;
      review.moderationReason = null;
      review.moderatedAt = null;
      const saved = await manager.save(review);
      await this.audit(
        manager,
        user.id,
        isNew ? "CATALOG_REVIEW_CREATED" : "CATALOG_REVIEW_UPDATED",
        { reviewId: saved.id, catalogItemId: itemId },
      );
      return this.ownView(saved);
    });
  }

  async listMine(user: AuthenticatedUser, query: ListCatalogReviewsQueryDto) {
    const [reviews, total] = await this.db
      .getRepository(CatalogItemReviewEntity)
      .findAndCount({
        where: { userId: user.id },
        relations: { catalogItem: true },
        order: { updatedAt: "DESC" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return {
      data: reviews.map((review) => this.ownView(review)),
      meta: this.pagination(query, total),
    };
  }

  async remove(user: AuthenticatedUser, itemId: string) {
    return this.db.transaction(async (manager) => {
      const review = await manager.findOneBy(CatalogItemReviewEntity, {
        userId: user.id,
        catalogItemId: itemId,
      });
      if (!review) {
        throw new NotFoundException({
          code: "CATALOG_REVIEW_NOT_FOUND",
          message: "Você ainda não avaliou este item.",
        });
      }
      await manager.remove(review);
      await this.audit(manager, user.id, "CATALOG_REVIEW_REMOVED", {
        reviewId: review.id,
        catalogItemId: itemId,
      });
    });
  }

  async listPublishedBySlug(slug: string, query: ListCatalogReviewsQueryDto) {
    const item = await this.db.getRepository(CatalogItemEntity).findOneBy({
      slug,
      status: CatalogStatus.PUBLISHED,
    });
    if (!item) {
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo não encontrado.",
      });
    }
    const [reviews, total] = await this.db
      .getRepository(CatalogItemReviewEntity)
      .findAndCount({
        where: {
          catalogItemId: item.id,
          status: CatalogReviewStatus.PUBLISHED,
        },
        relations: { user: true },
        order: { createdAt: "DESC" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return {
      data: reviews.map((review) => this.publicView(review)),
      summary: await this.summaryForItemIds([item.id]).then((summaries) =>
        summaries.get(item.id)!,
      ),
      meta: this.pagination(query, total),
    };
  }

  async pending(query: ListCatalogReviewsQueryDto) {
    const [reviews, total] = await this.db
      .getRepository(CatalogItemReviewEntity)
      .findAndCount({
        where: { status: CatalogReviewStatus.PENDING },
        relations: { user: true, catalogItem: true },
        order: { createdAt: "ASC" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return {
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        author: { id: review.user.id, name: review.user.name },
        catalogItem: {
          id: review.catalogItem.id,
          title: review.catalogItem.title,
          slug: review.catalogItem.slug,
        },
      })),
      meta: this.pagination(query, total),
    };
  }

  async moderate(
    user: AuthenticatedUser,
    reviewId: string,
    dto: ModerateCatalogReviewDto,
  ) {
    if (dto.status === CatalogReviewStatus.PENDING) {
      throw new BadRequestException({
        code: "CATALOG_REVIEW_INVALID_MODERATION_STATUS",
        message: "A moderação deve publicar ou rejeitar a avaliação.",
      });
    }
    return this.db.transaction(async (manager) => {
      const review = await manager.findOneBy(CatalogItemReviewEntity, {
        id: reviewId,
      });
      if (!review) {
        throw new NotFoundException({
          code: "CATALOG_REVIEW_NOT_FOUND",
          message: "Avaliação não encontrada.",
        });
      }
      if (review.status !== CatalogReviewStatus.PENDING) {
        throw new ConflictException({
          code: "CATALOG_REVIEW_ALREADY_MODERATED",
          message: "A avaliação já foi moderada.",
        });
      }
      review.status = dto.status;
      review.moderatedByUserId = user.id;
      review.moderationReason = dto.reason ?? null;
      review.moderatedAt = new Date();
      const saved = await manager.save(review);
      await this.audit(manager, user.id, `CATALOG_REVIEW_${dto.status}`, {
        reviewId,
        catalogItemId: saved.catalogItemId,
      });
      return {
        id: saved.id,
        status: saved.status,
        moderationReason: saved.moderationReason,
        moderatedAt: saved.moderatedAt,
      };
    });
  }

  async summaryForItemIds(itemIds: string[]) {
    const summaries = new Map<string, CatalogReviewSummary>();
    if (!itemIds.length) return summaries;
    const rows = await this.db
      .getRepository(CatalogItemReviewEntity)
      .createQueryBuilder("review")
      .select("review.catalog_item_id", "catalogItemId")
      .addSelect("AVG(review.rating)", "averageRating")
      .addSelect("COUNT(*)", "reviewCount")
      .where("review.catalog_item_id IN (:...itemIds)", { itemIds })
      .andWhere("review.status = :status", {
        status: CatalogReviewStatus.PUBLISHED,
      })
      .groupBy("review.catalog_item_id")
      .getRawMany<{
        catalogItemId: string;
        averageRating: string;
        reviewCount: string;
      }>();
    for (const row of rows) {
      summaries.set(row.catalogItemId, {
        averageRating: Number(Number(row.averageRating).toFixed(2)),
        reviewCount: Number(row.reviewCount),
      });
    }
    for (const itemId of itemIds) {
      if (!summaries.has(itemId)) {
        summaries.set(itemId, { averageRating: null, reviewCount: 0 });
      }
    }
    return summaries;
  }

  private async publishedItemOrFail(manager: EntityManager, id: string) {
    const item = await manager.findOneBy(CatalogItemEntity, {
      id,
      status: CatalogStatus.PUBLISHED,
    });
    if (!item) {
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo publicado não encontrado.",
      });
    }
  }

  private ownView(review: CatalogItemReviewEntity) {
    return {
      id: review.id,
      catalogItem: review.catalogItem
        ? {
            id: review.catalogItem.id,
            title: review.catalogItem.title,
            slug: review.catalogItem.slug,
          }
        : { id: review.catalogItemId },
      rating: review.rating,
      content: review.content,
      status: review.status,
      moderationReason: review.moderationReason,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private publicView(review: CatalogItemReviewEntity) {
    return {
      id: review.id,
      rating: review.rating,
      content: review.content,
      author: { id: review.user.id, name: review.user.name },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private pagination(query: ListCatalogReviewsQueryDto, total: number) {
    return {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private async audit(
    manager: EntityManager,
    userId: string,
    eventType: string,
    metadata: Record<string, string>,
  ) {
    await manager.save(
      manager.create(AuditLogEntity, {
        actorUserId: userId,
        eventType,
        metadata,
      }),
    );
  }
}
