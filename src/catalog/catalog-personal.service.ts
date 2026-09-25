import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity";
import { AuthenticatedUser } from "../auth/auth.types";
import {
  AddCatalogCollectionItemDto,
  CreateCatalogCollectionDto,
  ListCatalogUserItemsQueryDto,
  UpdateCatalogCollectionDto,
  UpdateCatalogUserItemDto,
} from "./dto/catalog-personal.dto";
import { CatalogStatus } from "./enums/catalog.enums";
import { CatalogCollectionItemEntity } from "./entities/catalog-collection-item.entity";
import { CatalogCollectionEntity } from "./entities/catalog-collection.entity";
import { CatalogItemEntity } from "./entities/catalog-item.entity";
import { CatalogUserItemEntity } from "./entities/catalog-user-item.entity";

@Injectable()
export class CatalogPersonalService {
  constructor(private db: DataSource) {}

  async updateItem(
    user: AuthenticatedUser,
    itemId: string,
    dto: UpdateCatalogUserItemDto,
  ) {
    return this.db.transaction(async (manager) => {
      const catalogItem = await this.publishedItemOrFail(manager, itemId);
      let entry = await manager.findOneBy(CatalogUserItemEntity, {
        userId: user.id,
        catalogItemId: itemId,
      });
      if (!entry) {
        entry = manager.create(CatalogUserItemEntity, {
          userId: user.id,
          catalogItemId: itemId,
          hasItem: false,
          wantsItem: false,
          playedItem: false,
          isFavorite: false,
          privateComment: null,
        });
      }
      entry.catalogItem = catalogItem;

      if (dto.hasItem !== undefined) entry.hasItem = dto.hasItem;
      if (dto.wantsItem !== undefined) entry.wantsItem = dto.wantsItem;
      if (dto.playedItem !== undefined) entry.playedItem = dto.playedItem;
      if (dto.isFavorite !== undefined) entry.isFavorite = dto.isFavorite;
      if (dto.privateComment !== undefined)
        entry.privateComment = dto.privateComment?.trim() || null;
      const saved = await manager.save(entry);
      await this.audit(manager, user.id, "CATALOG_USER_ITEM_UPDATED", {
        catalogItemId: itemId,
      });
      return this.userItemView(saved);
    });
  }

  async listItems(
    user: AuthenticatedUser,
    query: ListCatalogUserItemsQueryDto,
  ) {
    const builder = this.db
      .getRepository(CatalogUserItemEntity)
      .createQueryBuilder("userItem")
      .innerJoinAndSelect("userItem.catalogItem", "catalogItem")
      .where("userItem.user_id = :userId", { userId: user.id });
    if (query.hasItem !== undefined)
      builder.andWhere("userItem.has_item = :hasItem", {
        hasItem: query.hasItem,
      });
    if (query.wantsItem !== undefined)
      builder.andWhere("userItem.wants_item = :wantsItem", {
        wantsItem: query.wantsItem,
      });
    if (query.playedItem !== undefined)
      builder.andWhere("userItem.played_item = :playedItem", {
        playedItem: query.playedItem,
      });
    if (query.isFavorite !== undefined)
      builder.andWhere("userItem.is_favorite = :isFavorite", {
        isFavorite: query.isFavorite,
      });
    builder
      .orderBy("userItem.updated_at", "DESC")
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [rows, total] = await builder.getManyAndCount();
    return {
      data: rows.map((entry) => this.userItemView(entry)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async removeItem(user: AuthenticatedUser, itemId: string) {
    return this.db.transaction(async (manager) => {
      const entry = await manager.findOneBy(CatalogUserItemEntity, {
        userId: user.id,
        catalogItemId: itemId,
      });
      if (!entry) {
        throw new NotFoundException({
          code: "CATALOG_USER_ITEM_NOT_FOUND",
          message: "Este item não está em suas listas pessoais.",
        });
      }
      await manager.remove(entry);
      await this.audit(manager, user.id, "CATALOG_USER_ITEM_REMOVED", {
        catalogItemId: itemId,
      });
    });
  }

  async createCollection(
    user: AuthenticatedUser,
    dto: CreateCatalogCollectionDto,
  ) {
    return this.db.transaction(async (manager) => {
      const name = this.collectionName(dto.name);
      const collection = await manager.save(
        manager.create(CatalogCollectionEntity, {
          ownerUserId: user.id,
          name,
          description: dto.description?.trim() || null,
          isPublic: dto.isPublic,
        }),
      );
      await this.audit(manager, user.id, "CATALOG_COLLECTION_CREATED", {
        collectionId: collection.id,
      });
      return this.collectionView(collection, false);
    });
  }

  async listMyCollections(user: AuthenticatedUser) {
    const collections = await this.db
      .getRepository(CatalogCollectionEntity)
      .find({
        where: { ownerUserId: user.id },
        relations: { items: { catalogItem: true } },
        order: { updatedAt: "DESC" },
      });
    return {
      data: collections.map((collection) =>
        this.collectionView(collection, false),
      ),
    };
  }

  async getMyCollection(user: AuthenticatedUser, id: string) {
    return this.collectionView(await this.ownedCollection(user.id, id), false);
  }

  async updateCollection(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCatalogCollectionDto,
  ) {
    return this.db.transaction(async (manager) => {
      const collection = await this.ownedCollection(user.id, id, manager);
      if (dto.name !== undefined)
        collection.name = this.collectionName(dto.name);
      if (dto.description !== undefined)
        collection.description = dto.description?.trim() || null;
      if (dto.isPublic !== undefined) collection.isPublic = dto.isPublic;
      const saved = await manager.save(collection);
      await this.audit(manager, user.id, "CATALOG_COLLECTION_UPDATED", {
        collectionId: id,
      });
      return this.collectionView(saved, false);
    });
  }

  async removeCollection(user: AuthenticatedUser, id: string) {
    return this.db.transaction(async (manager) => {
      const collection = await this.ownedCollection(user.id, id, manager);
      await manager.remove(collection);
      await this.audit(manager, user.id, "CATALOG_COLLECTION_REMOVED", {
        collectionId: id,
      });
    });
  }

  async addCollectionItem(
    user: AuthenticatedUser,
    collectionId: string,
    itemId: string,
    dto: AddCatalogCollectionItemDto,
  ) {
    return this.db.transaction(async (manager) => {
      await this.ownedCollection(user.id, collectionId, manager);
      await this.publishedItemOrFail(manager, itemId);
      const existing = await manager.findOneBy(CatalogCollectionItemEntity, {
        collectionId,
        catalogItemId: itemId,
      });
      if (existing) {
        throw new ConflictException({
          code: "CATALOG_COLLECTION_ITEM_ALREADY_EXISTS",
          message: "O item já está nesta coleção.",
        });
      }
      const saved = await manager.save(
        manager.create(CatalogCollectionItemEntity, {
          collectionId,
          catalogItemId: itemId,
          position: dto.position,
        }),
      );
      await this.audit(manager, user.id, "CATALOG_COLLECTION_ITEM_ADDED", {
        collectionId,
        catalogItemId: itemId,
      });
      return { catalogItemId: saved.catalogItemId, position: saved.position };
    });
  }

  async removeCollectionItem(
    user: AuthenticatedUser,
    collectionId: string,
    itemId: string,
  ) {
    return this.db.transaction(async (manager) => {
      await this.ownedCollection(user.id, collectionId, manager);
      const item = await manager.findOneBy(CatalogCollectionItemEntity, {
        collectionId,
        catalogItemId: itemId,
      });
      if (!item) {
        throw new NotFoundException({
          code: "CATALOG_COLLECTION_ITEM_NOT_FOUND",
          message: "O item não pertence a esta coleção.",
        });
      }
      await manager.remove(item);
      await this.audit(manager, user.id, "CATALOG_COLLECTION_ITEM_REMOVED", {
        collectionId,
        catalogItemId: itemId,
      });
    });
  }

  async getPublicCollection(id: string) {
    const collection = await this.db
      .getRepository(CatalogCollectionEntity)
      .findOne({
        where: { id, isPublic: true },
        relations: { owner: true, items: { catalogItem: true } },
      });
    if (!collection) {
      throw new NotFoundException({
        code: "CATALOG_COLLECTION_NOT_FOUND",
        message: "Coleção pública não encontrada.",
      });
    }
    return this.collectionView(collection, true);
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
    return item;
  }

  private async ownedCollection(
    userId: string,
    id: string,
    manager: EntityManager = this.db.manager,
  ) {
    const collection = await manager.findOne(CatalogCollectionEntity, {
      where: { id, ownerUserId: userId },
      relations: { items: { catalogItem: true } },
    });
    if (!collection) {
      throw new NotFoundException({
        code: "CATALOG_COLLECTION_NOT_FOUND",
        message: "Coleção não encontrada.",
      });
    }
    return collection;
  }

  private userItemView(entry: CatalogUserItemEntity) {
    return {
      catalogItem: {
        id: entry.catalogItem.id,
        title: entry.catalogItem.title,
        slug: entry.catalogItem.slug,
        type: entry.catalogItem.type,
      },
      hasItem: entry.hasItem,
      wantsItem: entry.wantsItem,
      playedItem: entry.playedItem,
      isFavorite: entry.isFavorite,
      privateComment: entry.privateComment,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private collectionView(
    collection: CatalogCollectionEntity,
    publicView: boolean,
  ) {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      ...(publicView
        ? { owner: { id: collection.owner.id, name: collection.owner.name } }
        : {}),
      items: (collection.items ?? [])
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
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  private collectionName(name: string) {
    const value = name.trim();
    if (!value) {
      throw new BadRequestException({
        code: "CATALOG_COLLECTION_NAME_REQUIRED",
        message: "Informe o nome da coleção.",
      });
    }
    return value;
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
