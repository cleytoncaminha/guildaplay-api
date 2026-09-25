import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { StorageService } from "../storage/storage.service";
import {
  CatalogPublicQueryDto,
  CatalogSort,
  SortOrder,
} from "./dto/catalog-public-query.dto";
import { CatalogStatus } from "./enums/catalog.enums";
import { CatalogItemEntity } from "./entities/catalog-item.entity";
import {
  CatalogReviewSummary,
  CatalogReviewsService,
} from "./catalog-reviews.service";

@Injectable()
export class CatalogPublicService {
  constructor(
    @InjectRepository(CatalogItemEntity)
    private items: Repository<CatalogItemEntity>,
    private storage: StorageService,
    private reviews: CatalogReviewsService,
  ) {}

  private relations() {
    return {
      systems: { rpgSystem: { publisher: true } },
      creators: { creator: true },
      categories: { category: true },
      tags: { tag: true },
      aliases: true,
      sources: true,
      editions: { publisher: true },
      media: { mediaAsset: true },
      outgoingRelations: { targetItem: true },
    } as const;
  }

  private async view(
    item: CatalogItemEntity,
    reviewSummary: CatalogReviewSummary,
  ) {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      description: item.description,
      originalReleaseYear: item.originalReleaseYear,
      experienceLevel: item.experienceLevel,
      systems: item.systems.map(({ rpgSystem }) => ({
        id: rpgSystem.id,
        name: rpgSystem.name,
        slug: rpgSystem.slug,
      })),
      creators: item.creators.map(({ creator, role }) => ({
        id: creator.id,
        name: creator.name,
        slug: creator.slug,
        role,
      })),
      categories: item.categories.map(({ category }) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })),
      tags: item.tags.map(({ tag }) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      editions: item.editions.map((edition) => ({
        id: edition.id,
        name: edition.name,
        slug: edition.slug,
        languageCode: edition.languageCode,
        releaseYear: edition.releaseYear,
        publisher: edition.publisher
          ? {
              id: edition.publisher.id,
              name: edition.publisher.name,
              slug: edition.publisher.slug,
            }
          : null,
      })),
      sources: item.sources.map((source) => ({
        label: source.label,
        url: source.url,
      })),
      relations: item.outgoingRelations
        .filter(
          (relation) => relation.targetItem.status === CatalogStatus.PUBLISHED,
        )
        .map((relation) => ({
          type: relation.type,
          item: {
            title: relation.targetItem.title,
            slug: relation.targetItem.slug,
          },
        })),
      media: await Promise.all(
        item.media.map(async (media) => ({
          id: media.id,
          kind: media.kind,
          position: media.position,
          url: await this.storage.signedGet(media.mediaAsset.objectKey),
        })),
      ),
      reviews: reviewSummary,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async list(query: CatalogPublicQueryDto) {
    const builder = this.items
      .createQueryBuilder("item")
      .where("item.status = :status", { status: CatalogStatus.PUBLISHED });

    if (query.q) {
      const normalized = query.q
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      builder.andWhere(
        `(item.title ILIKE :titleQuery OR EXISTS (
          SELECT 1 FROM catalog_item_aliases alias
          WHERE alias.catalog_item_id = item.id
            AND alias.alias_normalized ILIKE :aliasQuery
        ))`,
        { titleQuery: `%${query.q}%`, aliasQuery: `%${normalized}%` },
      );
    }
    if (query.systemId)
      builder.andWhere(
        `EXISTS (
          SELECT 1 FROM catalog_item_systems item_system
          WHERE item_system.catalog_item_id = item.id
            AND item_system.rpg_system_id = :systemId
        )`,
        { systemId: query.systemId },
      );
    if (query.type) builder.andWhere("item.type = :type", { type: query.type });
    if (query.genre)
      builder.andWhere(
        `EXISTS (
          SELECT 1 FROM catalog_item_categories item_category
          INNER JOIN catalog_categories category ON category.id = item_category.category_id
          WHERE item_category.catalog_item_id = item.id
            AND category.slug = :genre
        )`,
        { genre: query.genre },
      );
    if (query.year)
      builder.andWhere("item.original_release_year = :year", {
        year: query.year,
      });
    if (query.experienceLevel)
      builder.andWhere("item.experience_level = :experienceLevel", {
        experienceLevel: query.experienceLevel,
      });
    if (query.languageCode || query.publisherId) {
      const editionPredicates: string[] = ["edition.catalog_item_id = item.id"];
      if (query.languageCode)
        editionPredicates.push("edition.language_code = :languageCode");
      if (query.publisherId)
        editionPredicates.push("edition.publisher_id = :publisherId");
      builder.andWhere(
        `EXISTS (SELECT 1 FROM catalog_editions edition WHERE ${editionPredicates.join(" AND ")})`,
        {
          ...(query.languageCode ? { languageCode: query.languageCode } : {}),
          ...(query.publisherId ? { publisherId: query.publisherId } : {}),
        },
      );
    }

    const orderBy: Record<CatalogSort, string> = {
      [CatalogSort.TITLE]: "item.title",
      [CatalogSort.RELEASE_YEAR]: "item.original_release_year",
      [CatalogSort.NEWEST]: "item.created_at",
    };
    builder
      .orderBy(orderBy[query.sort], query.order)
      .addOrderBy("item.id", SortOrder.ASC)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [rows, total] = await builder.getManyAndCount();
    const ids = rows.map((item) => item.id);
    const items = ids.length
      ? await this.items.find({
          where: { id: In(ids) },
          relations: this.relations(),
        })
      : [];
    const byId = new Map(items.map((item) => [item.id, item]));
    const reviewSummaries = await this.reviews.summaryForItemIds(ids);
    return {
      data: await Promise.all(
        ids.map((id) => this.view(byId.get(id)!, reviewSummaries.get(id)!)),
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getBySlug(slug: string) {
    const item = await this.items.findOne({
      where: { slug, status: CatalogStatus.PUBLISHED },
      relations: this.relations(),
    });
    if (!item)
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo não encontrado.",
      });
    const reviewSummaries = await this.reviews.summaryForItemIds([item.id]);
    return this.view(item, reviewSummaries.get(item.id)!);
  }
}
