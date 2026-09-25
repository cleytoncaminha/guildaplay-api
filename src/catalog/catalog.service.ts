import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from "typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { StorageService } from "../storage/storage.service.js";
import {
  CreateCatalogEditionDto,
  CreateCatalogCategoryDto,
  CreateCatalogItemAliasDto,
  CreateCatalogItemDto,
  CreateCatalogItemSourceDto,
  CreateCatalogTagDto,
  CreateCreatorDto,
  CreatePublisherDto,
  CreateRpgSystemDto,
  PaginationQueryDto,
  UpdateCatalogEditionDto,
  UpdateCatalogCategoryDto,
  UpdateCatalogItemAliasDto,
  UpdateCatalogItemDto,
  UpdateCatalogItemSourceDto,
  UpdateCatalogTagDto,
  UpdateCreatorDto,
  UpdatePublisherDto,
  UpdateRpgSystemDto,
} from "./dto/catalog-admin.dto.js";
import { CreateCatalogItemRelationDto } from "./dto/catalog-item-relation.dto.js";
import { CatalogStatus } from "./enums/catalog.enums.js";
import { CatalogEditionEntity } from "./entities/catalog-edition.entity.js";
import { CatalogCategoryEntity } from "./entities/catalog-category.entity.js";
import { CatalogItemAliasEntity } from "./entities/catalog-item-alias.entity.js";
import { CatalogItemCategoryEntity } from "./entities/catalog-item-category.entity.js";
import { CatalogItemCreatorEntity } from "./entities/catalog-item-creator.entity.js";
import { CatalogItemRelationEntity } from "./entities/catalog-item-relation.entity.js";
import { CatalogItemSystemEntity } from "./entities/catalog-item-system.entity.js";
import { CatalogItemSourceEntity } from "./entities/catalog-item-source.entity.js";
import { CatalogItemTagEntity } from "./entities/catalog-item-tag.entity.js";
import { CatalogItemEntity } from "./entities/catalog-item.entity.js";
import { CatalogTagEntity } from "./entities/catalog-tag.entity.js";
import { CreatorEntity } from "./entities/creator.entity.js";
import { PublisherEntity } from "./entities/publisher.entity.js";
import { RpgSystemEntity } from "./entities/rpg-system.entity.js";

type CatalogItemRelations = CatalogItemEntity & {
  systems: (CatalogItemSystemEntity & { rpgSystem: RpgSystemEntity })[];
  creators: (CatalogItemCreatorEntity & { creator: CreatorEntity })[];
};

@Injectable()
export class CatalogService {
  constructor(
    private dataSource: DataSource,
    private storage: StorageService,
    @InjectRepository(PublisherEntity)
    private publishers: Repository<PublisherEntity>,
    @InjectRepository(CreatorEntity)
    private creators: Repository<CreatorEntity>,
    @InjectRepository(CatalogCategoryEntity)
    private categories: Repository<CatalogCategoryEntity>,
    @InjectRepository(CatalogTagEntity)
    private tags: Repository<CatalogTagEntity>,
    @InjectRepository(RpgSystemEntity)
    private systems: Repository<RpgSystemEntity>,
    @InjectRepository(CatalogItemEntity)
    private items: Repository<CatalogItemEntity>,
    @InjectRepository(CatalogEditionEntity)
    private editions: Repository<CatalogEditionEntity>,
  ) {}

  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const code =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;
      if (code === "23505")
        throw new ConflictException({
          code: "CATALOG_SLUG_ALREADY_EXISTS",
          message: "Slug já está em uso.",
        });
      throw error;
    }
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

  private pagination<T>(data: T[], total: number, query: PaginationQueryDto) {
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private publisherView(publisher: PublisherEntity) {
    return {
      id: publisher.id,
      name: publisher.name,
      slug: publisher.slug,
      websiteUrl: publisher.websiteUrl,
      countryCode: publisher.countryCode,
      createdAt: publisher.createdAt,
      updatedAt: publisher.updatedAt,
    };
  }

  private creatorView(creator: CreatorEntity) {
    return {
      id: creator.id,
      name: creator.name,
      slug: creator.slug,
      websiteUrl: creator.websiteUrl,
      createdAt: creator.createdAt,
      updatedAt: creator.updatedAt,
    };
  }

  private categoryView(category: CatalogCategoryEntity) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private tagView(tag: CatalogTagEntity) {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  private systemView(system: RpgSystemEntity) {
    return {
      id: system.id,
      name: system.name,
      slug: system.slug,
      description: system.description,
      releaseYear: system.releaseYear,
      status: system.status,
      publisher: system.publisher ? this.publisherView(system.publisher) : null,
      createdAt: system.createdAt,
      updatedAt: system.updatedAt,
    };
  }

  private editionView(edition: CatalogEditionEntity) {
    return {
      id: edition.id,
      catalogItemId: edition.catalogItemId,
      name: edition.name,
      slug: edition.slug,
      languageCode: edition.languageCode,
      releaseYear: edition.releaseYear,
      isbn10: edition.isbn10,
      isbn13: edition.isbn13,
      publisher: edition.publisher
        ? this.publisherView(edition.publisher)
        : null,
      createdAt: edition.createdAt,
      updatedAt: edition.updatedAt,
    };
  }

  private async itemView(item: CatalogItemRelations) {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      description: item.description,
      originalReleaseYear: item.originalReleaseYear,
      experienceLevel: item.experienceLevel,
      status: item.status,
      systems: item.systems.map(({ rpgSystem }) => this.systemView(rpgSystem)),
      creators: item.creators.map(({ creator, role }) => ({
        role,
        ...this.creatorView(creator),
      })),
      categories: item.categories.map(({ category }) =>
        this.categoryView(category),
      ),
      tags: item.tags.map(({ tag }) => this.tagView(tag)),
      aliases: item.aliases.map((alias) => ({
        id: alias.id,
        alias: alias.alias,
      })),
      sources: item.sources.map((source) => ({
        id: source.id,
        label: source.label,
        url: source.url,
      })),
      relations: item.outgoingRelations.map((relation) => ({
        id: relation.id,
        type: relation.type,
        item: {
          id: relation.targetItem.id,
          title: relation.targetItem.title,
          slug: relation.targetItem.slug,
          status: relation.targetItem.status,
        },
      })),
      media: await Promise.all(
        item.media.map(async (media) => ({
          id: media.id,
          assetId: media.mediaAssetId,
          kind: media.kind,
          position: media.position,
          url: await this.storage.signedGet(media.mediaAsset.objectKey),
        })),
      ),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async publisherOrFail(manager: EntityManager, id: string) {
    const publisher = await manager.findOneBy(PublisherEntity, { id });
    if (!publisher)
      throw new NotFoundException({
        code: "CATALOG_PUBLISHER_NOT_FOUND",
        message: "Editora não encontrada.",
      });
    return publisher;
  }

  private async itemOrFail(manager: EntityManager, id: string) {
    const item = await manager.findOneBy(CatalogItemEntity, { id });
    if (!item)
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo não encontrado.",
      });
    return item;
  }

  private async systemsOrFail(manager: EntityManager, ids: string[]) {
    const systems = ids.length
      ? await manager.findBy(RpgSystemEntity, { id: In(ids) })
      : [];
    if (systems.length !== ids.length)
      throw new NotFoundException({
        code: "CATALOG_SYSTEM_NOT_FOUND",
        message: "Um ou mais sistemas não foram encontrados.",
      });
    return systems;
  }

  private async creatorsOrFail(manager: EntityManager, ids: string[]) {
    const creators = ids.length
      ? await manager.findBy(CreatorEntity, { id: In(ids) })
      : [];
    if (creators.length !== ids.length)
      throw new NotFoundException({
        code: "CATALOG_CREATOR_NOT_FOUND",
        message: "Um ou mais criadores não foram encontrados.",
      });
    return creators;
  }

  private async itemWithRelations(
    manager: EntityManager,
    id: string,
  ): Promise<CatalogItemRelations> {
    const item = await manager.findOne(CatalogItemEntity, {
      where: { id },
      relations: {
        systems: { rpgSystem: { publisher: true } },
        creators: { creator: true },
        categories: { category: true },
        tags: { tag: true },
        aliases: true,
        sources: true,
        media: { mediaAsset: true },
        outgoingRelations: { targetItem: true },
      },
    });
    if (!item)
      throw new NotFoundException({
        code: "CATALOG_ITEM_NOT_FOUND",
        message: "Item de catálogo não encontrado.",
      });
    return item;
  }

  private async replaceItemRelations(
    manager: EntityManager,
    itemId: string,
    dto: Pick<
      CreateCatalogItemDto,
      "systemIds" | "creators" | "categoryIds" | "tagIds"
    >,
  ) {
    if (dto.systemIds !== undefined) {
      await this.systemsOrFail(manager, dto.systemIds);
      await manager.delete(CatalogItemSystemEntity, { catalogItemId: itemId });
      if (dto.systemIds.length)
        await manager.save(
          dto.systemIds.map((rpgSystemId) =>
            manager.create(CatalogItemSystemEntity, {
              catalogItemId: itemId,
              rpgSystemId,
            }),
          ),
        );
    }

    if (dto.creators !== undefined) {
      const keys = dto.creators.map(
        (creator) => `${creator.creatorId}:${creator.role}`,
      );
      if (new Set(keys).size !== keys.length)
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Um criador não pode ter a mesma função repetida no item.",
        });
      await this.creatorsOrFail(manager, [
        ...new Set(dto.creators.map((creator) => creator.creatorId)),
      ]);
      await manager.delete(CatalogItemCreatorEntity, { catalogItemId: itemId });
      if (dto.creators.length)
        await manager.save(
          dto.creators.map((creator) =>
            manager.create(CatalogItemCreatorEntity, {
              catalogItemId: itemId,
              creatorId: creator.creatorId,
              role: creator.role,
            }),
          ),
        );
    }

    if (dto.categoryIds !== undefined) {
      const categories = dto.categoryIds.length
        ? await manager.findBy(CatalogCategoryEntity, {
            id: In(dto.categoryIds),
          })
        : [];
      if (categories.length !== dto.categoryIds.length)
        throw new NotFoundException({
          code: "CATALOG_CATEGORY_NOT_FOUND",
          message: "Uma ou mais categorias não foram encontradas.",
        });
      await manager.delete(CatalogItemCategoryEntity, {
        catalogItemId: itemId,
      });
      if (dto.categoryIds.length)
        await manager.save(
          dto.categoryIds.map((categoryId) =>
            manager.create(CatalogItemCategoryEntity, {
              catalogItemId: itemId,
              categoryId,
            }),
          ),
        );
    }

    if (dto.tagIds !== undefined) {
      const tags = dto.tagIds.length
        ? await manager.findBy(CatalogTagEntity, { id: In(dto.tagIds) })
        : [];
      if (tags.length !== dto.tagIds.length)
        throw new NotFoundException({
          code: "CATALOG_TAG_NOT_FOUND",
          message: "Uma ou mais tags não foram encontradas.",
        });
      await manager.delete(CatalogItemTagEntity, { catalogItemId: itemId });
      if (dto.tagIds.length)
        await manager.save(
          dto.tagIds.map((tagId) =>
            manager.create(CatalogItemTagEntity, {
              catalogItemId: itemId,
              tagId,
            }),
          ),
        );
    }
  }

  private normalizeAlias(alias: string) {
    return alias
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  async createCategory(user: AuthenticatedUser, dto: CreateCatalogCategoryDto) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const category = await manager.save(
          manager.create(CatalogCategoryEntity, {
            name: dto.name,
            slug: dto.slug,
            description: dto.description ?? null,
          }),
        );
        await this.audit(manager, user.id, "CATALOG_CATEGORY_CREATED", {
          categoryId: category.id,
        });
        return this.categoryView(category);
      }),
    );
  }

  async listCategories(query: PaginationQueryDto) {
    const [categories, total] = await this.categories.findAndCount({
      order: { name: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      categories.map((category) => this.categoryView(category)),
      total,
      query,
    );
  }

  async updateCategory(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCatalogCategoryDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const category = await manager.findOneBy(CatalogCategoryEntity, { id });
        if (!category)
          throw new NotFoundException({
            code: "CATALOG_CATEGORY_NOT_FOUND",
            message: "Categoria não encontrada.",
          });
        if (dto.name !== undefined) category.name = dto.name;
        if (dto.slug !== undefined) category.slug = dto.slug;
        if (dto.description !== undefined)
          category.description = dto.description;
        const saved = await manager.save(category);
        await this.audit(manager, user.id, "CATALOG_CATEGORY_UPDATED", {
          categoryId: saved.id,
        });
        return this.categoryView(saved);
      }),
    );
  }

  async createTag(user: AuthenticatedUser, dto: CreateCatalogTagDto) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const tag = await manager.save(
          manager.create(CatalogTagEntity, { name: dto.name, slug: dto.slug }),
        );
        await this.audit(manager, user.id, "CATALOG_TAG_CREATED", {
          tagId: tag.id,
        });
        return this.tagView(tag);
      }),
    );
  }

  async listTags(query: PaginationQueryDto) {
    const [tags, total] = await this.tags.findAndCount({
      order: { name: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      tags.map((tag) => this.tagView(tag)),
      total,
      query,
    );
  }

  async updateTag(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCatalogTagDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const tag = await manager.findOneBy(CatalogTagEntity, { id });
        if (!tag)
          throw new NotFoundException({
            code: "CATALOG_TAG_NOT_FOUND",
            message: "Tag não encontrada.",
          });
        if (dto.name !== undefined) tag.name = dto.name;
        if (dto.slug !== undefined) tag.slug = dto.slug;
        const saved = await manager.save(tag);
        await this.audit(manager, user.id, "CATALOG_TAG_UPDATED", {
          tagId: saved.id,
        });
        return this.tagView(saved);
      }),
    );
  }

  async createAlias(
    user: AuthenticatedUser,
    itemId: string,
    dto: CreateCatalogItemAliasDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        await this.itemOrFail(manager, itemId);
        const alias = await manager.save(
          manager.create(CatalogItemAliasEntity, {
            catalogItemId: itemId,
            alias: dto.alias,
            aliasNormalized: this.normalizeAlias(dto.alias),
          }),
        );
        await this.audit(manager, user.id, "CATALOG_ITEM_ALIAS_CREATED", {
          itemId,
          aliasId: alias.id,
        });
        return { id: alias.id, alias: alias.alias };
      }),
    );
  }

  async updateAlias(
    user: AuthenticatedUser,
    itemId: string,
    id: string,
    dto: UpdateCatalogItemAliasDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const alias = await manager.findOneBy(CatalogItemAliasEntity, {
          id,
          catalogItemId: itemId,
        });
        if (!alias)
          throw new NotFoundException({
            code: "CATALOG_ALIAS_NOT_FOUND",
            message: "Alias não encontrado.",
          });
        if (dto.alias !== undefined) {
          alias.alias = dto.alias;
          alias.aliasNormalized = this.normalizeAlias(dto.alias);
        }
        const saved = await manager.save(alias);
        await this.audit(manager, user.id, "CATALOG_ITEM_ALIAS_UPDATED", {
          itemId,
          aliasId: saved.id,
        });
        return { id: saved.id, alias: saved.alias };
      }),
    );
  }

  async createSource(
    user: AuthenticatedUser,
    itemId: string,
    dto: CreateCatalogItemSourceDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.itemOrFail(manager, itemId);
      const source = await manager.save(
        manager.create(CatalogItemSourceEntity, {
          catalogItemId: itemId,
          label: dto.label,
          url: dto.url,
        }),
      );
      await this.audit(manager, user.id, "CATALOG_ITEM_SOURCE_CREATED", {
        itemId,
        sourceId: source.id,
      });
      return { id: source.id, label: source.label, url: source.url };
    });
  }

  async updateSource(
    user: AuthenticatedUser,
    itemId: string,
    id: string,
    dto: UpdateCatalogItemSourceDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const source = await manager.findOneBy(CatalogItemSourceEntity, {
        id,
        catalogItemId: itemId,
      });
      if (!source)
        throw new NotFoundException({
          code: "CATALOG_SOURCE_NOT_FOUND",
          message: "Fonte não encontrada.",
        });
      if (dto.label !== undefined) source.label = dto.label;
      if (dto.url !== undefined) source.url = dto.url;
      const saved = await manager.save(source);
      await this.audit(manager, user.id, "CATALOG_ITEM_SOURCE_UPDATED", {
        itemId,
        sourceId: saved.id,
      });
      return { id: saved.id, label: saved.label, url: saved.url };
    });
  }

  async createPublisher(user: AuthenticatedUser, dto: CreatePublisherDto) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const publisher = await manager.save(
          manager.create(PublisherEntity, {
            name: dto.name,
            slug: dto.slug,
            websiteUrl: dto.websiteUrl ?? null,
            countryCode: dto.countryCode ?? null,
          }),
        );
        await this.audit(manager, user.id, "CATALOG_PUBLISHER_CREATED", {
          publisherId: publisher.id,
        });
        return this.publisherView(publisher);
      }),
    );
  }

  async listPublishers(query: PaginationQueryDto) {
    const [publishers, total] = await this.publishers.findAndCount({
      order: { name: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      publishers.map((publisher) => this.publisherView(publisher)),
      total,
      query,
    );
  }

  async getPublisher(id: string) {
    const publisher = await this.publishers.findOneBy({ id });
    if (!publisher)
      throw new NotFoundException({
        code: "CATALOG_PUBLISHER_NOT_FOUND",
        message: "Editora não encontrada.",
      });
    return this.publisherView(publisher);
  }

  async updatePublisher(
    user: AuthenticatedUser,
    id: string,
    dto: UpdatePublisherDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const publisher = await this.publisherOrFail(manager, id);
        if (dto.name !== undefined) publisher.name = dto.name;
        if (dto.slug !== undefined) publisher.slug = dto.slug;
        if (dto.websiteUrl !== undefined) publisher.websiteUrl = dto.websiteUrl;
        if (dto.countryCode !== undefined)
          publisher.countryCode = dto.countryCode;
        const saved = await manager.save(publisher);
        await this.audit(manager, user.id, "CATALOG_PUBLISHER_UPDATED", {
          publisherId: saved.id,
        });
        return this.publisherView(saved);
      }),
    );
  }

  async createCreator(user: AuthenticatedUser, dto: CreateCreatorDto) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const creator = await manager.save(
          manager.create(CreatorEntity, {
            name: dto.name,
            slug: dto.slug,
            websiteUrl: dto.websiteUrl ?? null,
          }),
        );
        await this.audit(manager, user.id, "CATALOG_CREATOR_CREATED", {
          creatorId: creator.id,
        });
        return this.creatorView(creator);
      }),
    );
  }

  async listCreators(query: PaginationQueryDto) {
    const [creators, total] = await this.creators.findAndCount({
      order: { name: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      creators.map((creator) => this.creatorView(creator)),
      total,
      query,
    );
  }

  async getCreator(id: string) {
    const creator = await this.creators.findOneBy({ id });
    if (!creator)
      throw new NotFoundException({
        code: "CATALOG_CREATOR_NOT_FOUND",
        message: "Criador não encontrado.",
      });
    return this.creatorView(creator);
  }

  async updateCreator(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCreatorDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const creator = await manager.findOneBy(CreatorEntity, { id });
        if (!creator)
          throw new NotFoundException({
            code: "CATALOG_CREATOR_NOT_FOUND",
            message: "Criador não encontrado.",
          });
        if (dto.name !== undefined) creator.name = dto.name;
        if (dto.slug !== undefined) creator.slug = dto.slug;
        if (dto.websiteUrl !== undefined) creator.websiteUrl = dto.websiteUrl;
        const saved = await manager.save(creator);
        await this.audit(manager, user.id, "CATALOG_CREATOR_UPDATED", {
          creatorId: saved.id,
        });
        return this.creatorView(saved);
      }),
    );
  }

  async createSystem(user: AuthenticatedUser, dto: CreateRpgSystemDto) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const publisher = dto.publisherId
          ? await this.publisherOrFail(manager, dto.publisherId)
          : null;
        const system = await manager.save(
          manager.create(RpgSystemEntity, {
            name: dto.name,
            slug: dto.slug,
            description: dto.description ?? null,
            publisherId: publisher?.id ?? null,
            releaseYear: dto.releaseYear ?? null,
            status: CatalogStatus.DRAFT,
          }),
        );
        system.publisher = publisher;
        await this.audit(manager, user.id, "CATALOG_SYSTEM_CREATED", {
          systemId: system.id,
        });
        return this.systemView(system);
      }),
    );
  }

  async listSystems(query: PaginationQueryDto) {
    const [systems, total] = await this.systems.findAndCount({
      relations: { publisher: true },
      order: { name: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      systems.map((system) => this.systemView(system)),
      total,
      query,
    );
  }

  async getSystem(id: string) {
    const system = await this.systems.findOne({
      where: { id },
      relations: { publisher: true },
    });
    if (!system)
      throw new NotFoundException({
        code: "CATALOG_SYSTEM_NOT_FOUND",
        message: "Sistema não encontrado.",
      });
    return this.systemView(system);
  }

  async updateSystem(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateRpgSystemDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const system = await manager.findOneBy(RpgSystemEntity, { id });
        if (!system)
          throw new NotFoundException({
            code: "CATALOG_SYSTEM_NOT_FOUND",
            message: "Sistema não encontrado.",
          });
        const publisher =
          dto.publisherId === undefined
            ? undefined
            : dto.publisherId
              ? await this.publisherOrFail(manager, dto.publisherId)
              : null;
        if (dto.name !== undefined) system.name = dto.name;
        if (dto.slug !== undefined) system.slug = dto.slug;
        if (dto.description !== undefined) system.description = dto.description;
        if (publisher !== undefined) system.publisherId = publisher?.id ?? null;
        if (dto.releaseYear !== undefined) system.releaseYear = dto.releaseYear;
        const saved = await manager.save(system);
        saved.publisher = publisher === undefined ? null : publisher;
        if (publisher === undefined && saved.publisherId)
          saved.publisher = await this.publisherOrFail(
            manager,
            saved.publisherId,
          );
        await this.audit(manager, user.id, "CATALOG_SYSTEM_UPDATED", {
          systemId: saved.id,
        });
        return this.systemView(saved);
      }),
    );
  }

  async publishSystem(user: AuthenticatedUser, id: string) {
    return this.transitionSystem(user, id, CatalogStatus.PUBLISHED);
  }

  async archiveSystem(user: AuthenticatedUser, id: string) {
    return this.transitionSystem(user, id, CatalogStatus.ARCHIVED);
  }

  private async transitionSystem(
    user: AuthenticatedUser,
    id: string,
    target: CatalogStatus,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const system = await manager.findOneBy(RpgSystemEntity, { id });
      if (!system)
        throw new NotFoundException({
          code: "CATALOG_SYSTEM_NOT_FOUND",
          message: "Sistema não encontrado.",
        });
      if (
        system.status === CatalogStatus.ARCHIVED ||
        (target === CatalogStatus.PUBLISHED &&
          system.status !== CatalogStatus.DRAFT)
      )
        throw new ConflictException({
          code: "INVALID_CATALOG_STATUS_TRANSITION",
          message: "Transição de status inválida.",
        });
      const oldStatus = system.status;
      system.status = target;
      const saved = await manager.save(system);
      await this.audit(
        manager,
        user.id,
        target === CatalogStatus.PUBLISHED
          ? "CATALOG_SYSTEM_PUBLISHED"
          : "CATALOG_SYSTEM_ARCHIVED",
        { systemId: saved.id, oldStatus, newStatus: saved.status },
      );
      return { id: saved.id, status: saved.status };
    });
  }

  async createItem(user: AuthenticatedUser, dto: CreateCatalogItemDto) {
    const id = await this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const item = await manager.save(
          manager.create(CatalogItemEntity, {
            type: dto.type,
            title: dto.title,
            slug: dto.slug,
            summary: dto.summary ?? null,
            description: dto.description ?? null,
            originalReleaseYear: dto.originalReleaseYear ?? null,
            experienceLevel: dto.experienceLevel ?? null,
            status: CatalogStatus.DRAFT,
          }),
        );
        await this.replaceItemRelations(manager, item.id, dto);
        await this.audit(manager, user.id, "CATALOG_ITEM_CREATED", {
          itemId: item.id,
        });
        return item.id;
      }),
    );
    return this.itemView(
      await this.itemWithRelations(this.dataSource.manager, id),
    );
  }

  async listItems(query: PaginationQueryDto) {
    const [items, total] = await this.items.findAndCount({
      relations: {
        systems: { rpgSystem: { publisher: true } },
        creators: { creator: true },
        categories: { category: true },
        tags: { tag: true },
        aliases: true,
        sources: true,
        media: { mediaAsset: true },
        outgoingRelations: { targetItem: true },
      },
      order: { title: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      await Promise.all(
        (items as CatalogItemRelations[]).map((item) => this.itemView(item)),
      ),
      total,
      query,
    );
  }

  async getItem(id: string) {
    return this.itemView(
      await this.itemWithRelations(this.dataSource.manager, id),
    );
  }

  async updateItem(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCatalogItemDto,
  ) {
    await this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const item = await this.itemOrFail(manager, id);
        if (dto.type !== undefined) item.type = dto.type;
        if (dto.title !== undefined) item.title = dto.title;
        if (dto.slug !== undefined) item.slug = dto.slug;
        if (dto.summary !== undefined) item.summary = dto.summary;
        if (dto.description !== undefined) item.description = dto.description;
        if (dto.originalReleaseYear !== undefined)
          item.originalReleaseYear = dto.originalReleaseYear;
        if (dto.experienceLevel !== undefined)
          item.experienceLevel = dto.experienceLevel;
        await manager.save(item);
        await this.replaceItemRelations(manager, item.id, dto);
        await this.audit(manager, user.id, "CATALOG_ITEM_UPDATED", {
          itemId: item.id,
        });
      }),
    );
    return this.getItem(id);
  }

  async publishItem(user: AuthenticatedUser, id: string) {
    return this.transitionItem(user, id, CatalogStatus.PUBLISHED);
  }

  async archiveItem(user: AuthenticatedUser, id: string) {
    return this.transitionItem(user, id, CatalogStatus.ARCHIVED);
  }

  private async transitionItem(
    user: AuthenticatedUser,
    id: string,
    target: CatalogStatus,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const item = await this.itemOrFail(manager, id);
      if (
        item.status === CatalogStatus.ARCHIVED ||
        (target === CatalogStatus.PUBLISHED &&
          item.status !== CatalogStatus.DRAFT)
      )
        throw new ConflictException({
          code: "INVALID_CATALOG_STATUS_TRANSITION",
          message: "Transição de status inválida.",
        });
      const oldStatus = item.status;
      item.status = target;
      const saved = await manager.save(item);
      await this.audit(
        manager,
        user.id,
        target === CatalogStatus.PUBLISHED
          ? "CATALOG_ITEM_PUBLISHED"
          : "CATALOG_ITEM_ARCHIVED",
        { itemId: saved.id, oldStatus, newStatus: saved.status },
      );
      return { id: saved.id, status: saved.status };
    });
  }

  async createEdition(user: AuthenticatedUser, dto: CreateCatalogEditionDto) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        await this.itemOrFail(manager, dto.catalogItemId);
        const publisher = dto.publisherId
          ? await this.publisherOrFail(manager, dto.publisherId)
          : null;
        const edition = await manager.save(
          manager.create(CatalogEditionEntity, {
            catalogItemId: dto.catalogItemId,
            name: dto.name,
            slug: dto.slug,
            languageCode: dto.languageCode,
            publisherId: publisher?.id ?? null,
            releaseYear: dto.releaseYear ?? null,
            isbn10: dto.isbn10 ?? null,
            isbn13: dto.isbn13 ?? null,
          }),
        );
        edition.publisher = publisher;
        await this.audit(manager, user.id, "CATALOG_EDITION_CREATED", {
          editionId: edition.id,
          itemId: edition.catalogItemId,
        });
        return this.editionView(edition);
      }),
    );
  }

  async listEditions(query: PaginationQueryDto) {
    const [editions, total] = await this.editions.findAndCount({
      relations: { publisher: true },
      order: { name: "ASC" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return this.pagination(
      editions.map((edition) => this.editionView(edition)),
      total,
      query,
    );
  }

  async getEdition(id: string) {
    const edition = await this.editions.findOne({
      where: { id },
      relations: { publisher: true },
    });
    if (!edition)
      throw new NotFoundException({
        code: "CATALOG_EDITION_NOT_FOUND",
        message: "Edição não encontrada.",
      });
    return this.editionView(edition);
  }

  async updateEdition(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCatalogEditionDto,
  ) {
    return this.persist(() =>
      this.dataSource.transaction(async (manager) => {
        const edition = await manager.findOneBy(CatalogEditionEntity, { id });
        if (!edition)
          throw new NotFoundException({
            code: "CATALOG_EDITION_NOT_FOUND",
            message: "Edição não encontrada.",
          });
        const publisher =
          dto.publisherId === undefined
            ? undefined
            : dto.publisherId
              ? await this.publisherOrFail(manager, dto.publisherId)
              : null;
        if (dto.catalogItemId !== undefined) {
          await this.itemOrFail(manager, dto.catalogItemId);
          edition.catalogItemId = dto.catalogItemId;
        }
        if (dto.name !== undefined) edition.name = dto.name;
        if (dto.slug !== undefined) edition.slug = dto.slug;
        if (dto.languageCode !== undefined)
          edition.languageCode = dto.languageCode;
        if (publisher !== undefined)
          edition.publisherId = publisher?.id ?? null;
        if (dto.releaseYear !== undefined)
          edition.releaseYear = dto.releaseYear;
        if (dto.isbn10 !== undefined) edition.isbn10 = dto.isbn10;
        if (dto.isbn13 !== undefined) edition.isbn13 = dto.isbn13;
        const saved = await manager.save(edition);
        saved.publisher = publisher === undefined ? null : publisher;
        if (publisher === undefined && saved.publisherId)
          saved.publisher = await this.publisherOrFail(
            manager,
            saved.publisherId,
          );
        await this.audit(manager, user.id, "CATALOG_EDITION_UPDATED", {
          editionId: saved.id,
          itemId: saved.catalogItemId,
        });
        return this.editionView(saved);
      }),
    );
  }

  async createRelation(
    user: AuthenticatedUser,
    itemId: string,
    dto: CreateCatalogItemRelationDto,
  ) {
    if (itemId === dto.targetItemId)
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Um item não pode se relacionar consigo mesmo.",
      });
    return this.dataSource.transaction(async (manager) => {
      await this.itemOrFail(manager, itemId);
      await this.itemOrFail(manager, dto.targetItemId);
      const existing = await manager.findOneBy(CatalogItemRelationEntity, {
        sourceItemId: itemId,
        targetItemId: dto.targetItemId,
        type: dto.type,
      });
      if (existing)
        throw new ConflictException({
          code: "CATALOG_RELATION_ALREADY_EXISTS",
          message: "Relação já existe.",
        });
      const relation = await manager.save(
        manager.create(CatalogItemRelationEntity, {
          sourceItemId: itemId,
          targetItemId: dto.targetItemId,
          type: dto.type,
        }),
      );
      await this.audit(manager, user.id, "CATALOG_ITEM_RELATION_CREATED", {
        itemId,
        relationId: relation.id,
        targetItemId: relation.targetItemId,
        type: relation.type,
      });
      return {
        id: relation.id,
        type: relation.type,
        targetItemId: relation.targetItemId,
      };
    });
  }

  async removeRelation(user: AuthenticatedUser, itemId: string, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const relation = await manager.findOneBy(CatalogItemRelationEntity, {
        id,
        sourceItemId: itemId,
      });
      if (!relation)
        throw new NotFoundException({
          code: "CATALOG_RELATION_NOT_FOUND",
          message: "Relação não encontrada.",
        });
      await manager.remove(relation);
      await this.audit(manager, user.id, "CATALOG_ITEM_RELATION_REMOVED", {
        itemId,
        relationId: id,
        targetItemId: relation.targetItemId,
        type: relation.type,
      });
    });
  }
}
