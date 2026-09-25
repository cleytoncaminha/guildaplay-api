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
  AddCatalogFeaturedListItemDto,
  CreateCatalogFeaturedListDto,
  ListCatalogFeaturedListsQueryDto,
  UpdateCatalogFeaturedListDto,
} from "./dto/catalog-featured-list.dto.js";
import { CatalogStatus } from "./enums/catalog.enums.js";
import { CatalogFeaturedListItemEntity } from "./entities/catalog-featured-list-item.entity.js";
import { CatalogFeaturedListEntity } from "./entities/catalog-featured-list.entity.js";
import { CatalogItemEntity } from "./entities/catalog-item.entity.js";

@Injectable()
export class CatalogFeaturedListsService {
  constructor(private db: DataSource) {}

  async create(user: AuthenticatedUser, dto: CreateCatalogFeaturedListDto) {
    return this.db.transaction(async (manager) => {
      const title = this.requiredText(
        dto.title,
        "CATALOG_LIST_TITLE_REQUIRED",
        "Informe o título da lista.",
      );
      const slug = this.requiredText(
        dto.slug,
        "CATALOG_LIST_SLUG_REQUIRED",
        "Informe o slug da lista.",
      ).toLowerCase();
      await this.ensureSlugAvailable(manager, slug);
      const list = await manager.save(
        manager.create(CatalogFeaturedListEntity, {
          title,
          slug,
          description: dto.description?.trim() || null,
          curatedByUserId: user.id,
          status: CatalogStatus.DRAFT,
          publishedAt: null,
        }),
      );
      await this.audit(manager, user.id, "CATALOG_FEATURED_LIST_CREATED", {
        listId: list.id,
      });
      return this.view(list, false);
    });
  }

  async listAdmin(query: ListCatalogFeaturedListsQueryDto) {
    const [lists, total] = await this.db
      .getRepository(CatalogFeaturedListEntity)
      .findAndCount({
        relations: { items: { catalogItem: true } },
        order: { updatedAt: "DESC" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return {
      data: lists.map((list) => this.view(list, false)),
      meta: this.pagination(query, total),
    };
  }

  async getAdmin(id: string) {
    return this.view(await this.listOrFail(id), false);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCatalogFeaturedListDto,
  ) {
    return this.db.transaction(async (manager) => {
      const list = await this.listOrFail(id, manager);
      if (dto.title !== undefined) {
        list.title = this.requiredText(
          dto.title,
          "CATALOG_LIST_TITLE_REQUIRED",
          "Informe o título da lista.",
        );
      }
      if (dto.slug !== undefined) {
        const slug = this.requiredText(
          dto.slug,
          "CATALOG_LIST_SLUG_REQUIRED",
          "Informe o slug da lista.",
        ).toLowerCase();
        await this.ensureSlugAvailable(manager, slug, list.id);
        list.slug = slug;
      }
      if (dto.description !== undefined)
        list.description = dto.description?.trim() || null;
      const saved = await manager.save(list);
      await this.audit(manager, user.id, "CATALOG_FEATURED_LIST_UPDATED", {
        listId: id,
      });
      return this.view(saved, false);
    });
  }

  async transition(user: AuthenticatedUser, id: string, target: CatalogStatus) {
    return this.db.transaction(async (manager) => {
      const list = await this.listOrFail(id, manager);
      if (
        list.status === CatalogStatus.ARCHIVED ||
        (target === CatalogStatus.PUBLISHED &&
          list.status !== CatalogStatus.DRAFT)
      ) {
        throw new ConflictException({
          code: "INVALID_CATALOG_STATUS_TRANSITION",
          message: "Transição de status inválida.",
        });
      }
      list.status = target;
      list.publishedAt =
        target === CatalogStatus.PUBLISHED ? new Date() : list.publishedAt;
      const saved = await manager.save(list);
      await this.audit(
        manager,
        user.id,
        target === CatalogStatus.PUBLISHED
          ? "CATALOG_FEATURED_LIST_PUBLISHED"
          : "CATALOG_FEATURED_LIST_ARCHIVED",
        { listId: id },
      );
      return {
        id: saved.id,
        status: saved.status,
        publishedAt: saved.publishedAt,
      };
    });
  }

  async addItem(
    user: AuthenticatedUser,
    listId: string,
    itemId: string,
    dto: AddCatalogFeaturedListItemDto,
  ) {
    return this.db.transaction(async (manager) => {
      await this.listOrFail(listId, manager);
      await this.publishedItemOrFail(manager, itemId);
      const existing = await manager.findOneBy(CatalogFeaturedListItemEntity, {
        featuredListId: listId,
        catalogItemId: itemId,
      });
      if (existing) {
        throw new ConflictException({
          code: "CATALOG_FEATURED_LIST_ITEM_ALREADY_EXISTS",
          message: "O item já pertence a esta lista.",
        });
      }
      const item = await manager.save(
        manager.create(CatalogFeaturedListItemEntity, {
          featuredListId: listId,
          catalogItemId: itemId,
          position: dto.position,
        }),
      );
      await this.audit(manager, user.id, "CATALOG_FEATURED_LIST_ITEM_ADDED", {
        listId,
        catalogItemId: itemId,
      });
      return { catalogItemId: item.catalogItemId, position: item.position };
    });
  }

  async removeItem(user: AuthenticatedUser, listId: string, itemId: string) {
    return this.db.transaction(async (manager) => {
      await this.listOrFail(listId, manager);
      const item = await manager.findOneBy(CatalogFeaturedListItemEntity, {
        featuredListId: listId,
        catalogItemId: itemId,
      });
      if (!item) {
        throw new NotFoundException({
          code: "CATALOG_FEATURED_LIST_ITEM_NOT_FOUND",
          message: "O item não pertence a esta lista.",
        });
      }
      await manager.remove(item);
      await this.audit(manager, user.id, "CATALOG_FEATURED_LIST_ITEM_REMOVED", {
        listId,
        catalogItemId: itemId,
      });
    });
  }

  async listPublic(query: ListCatalogFeaturedListsQueryDto) {
    const [lists, total] = await this.db
      .getRepository(CatalogFeaturedListEntity)
      .findAndCount({
        where: { status: CatalogStatus.PUBLISHED },
        relations: { curatedBy: true, items: { catalogItem: true } },
        order: { publishedAt: "DESC" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return {
      data: lists.map((list) => this.view(list, true)),
      meta: this.pagination(query, total),
    };
  }

  async getPublic(slug: string) {
    const list = await this.db
      .getRepository(CatalogFeaturedListEntity)
      .findOne({
        where: { slug, status: CatalogStatus.PUBLISHED },
        relations: { curatedBy: true, items: { catalogItem: true } },
      });
    if (!list) {
      throw new NotFoundException({
        code: "CATALOG_FEATURED_LIST_NOT_FOUND",
        message: "Lista temática não encontrada.",
      });
    }
    return this.view(list, true);
  }

  private async listOrFail(
    id: string,
    manager: EntityManager = this.db.manager,
  ) {
    const list = await manager.findOne(CatalogFeaturedListEntity, {
      where: { id },
      relations: { items: { catalogItem: true } },
    });
    if (!list) {
      throw new NotFoundException({
        code: "CATALOG_FEATURED_LIST_NOT_FOUND",
        message: "Lista temática não encontrada.",
      });
    }
    return list;
  }

  private async publishedItemOrFail(manager: EntityManager, itemId: string) {
    const item = await manager.findOneBy(CatalogItemEntity, {
      id: itemId,
      status: CatalogStatus.PUBLISHED,
    });
    if (!item) {
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo publicado não encontrado.",
      });
    }
  }

  private async ensureSlugAvailable(
    manager: EntityManager,
    slug: string,
    currentId?: string,
  ) {
    const existing = await manager.findOneBy(CatalogFeaturedListEntity, {
      slug,
    });
    if (existing && existing.id !== currentId) {
      throw new ConflictException({
        code: "CATALOG_FEATURED_LIST_SLUG_ALREADY_EXISTS",
        message: "Já existe uma lista com este slug.",
      });
    }
  }

  private view(list: CatalogFeaturedListEntity, publicView: boolean) {
    return {
      id: list.id,
      title: list.title,
      slug: list.slug,
      description: list.description,
      ...(publicView
        ? { curator: { id: list.curatedBy.id, name: list.curatedBy.name } }
        : { status: list.status }),
      items: (list.items ?? [])
        .filter(
          (item) =>
            !publicView || item.catalogItem.status === CatalogStatus.PUBLISHED,
        )
        .sort((left, right) => left.position - right.position)
        .map((item) => ({
          position: item.position,
          item: {
            id: item.catalogItem.id,
            title: item.catalogItem.title,
            slug: item.catalogItem.slug,
            type: item.catalogItem.type,
          },
        })),
      publishedAt: list.publishedAt,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }

  private pagination(query: ListCatalogFeaturedListsQueryDto, total: number) {
    return {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  private requiredText(value: string, code: string, message: string) {
    const text = value.trim();
    if (!text) throw new BadRequestException({ code, message });
    return text;
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
