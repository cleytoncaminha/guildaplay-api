import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser, Roles } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../users/entities/user-role.entity";
import { CatalogService } from "./catalog.service";
import { CreateCatalogItemRelationDto } from "./dto/catalog-item-relation.dto";
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
} from "./dto/catalog-admin.dto";

@ApiTags("Catalog Admin")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller({ path: "admin/catalog", version: "1" })
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Post("publishers")
  @ApiOperation({ summary: "Cria editora de catálogo (ADMIN)" })
  @ApiResponse({ status: 201 })
  async createPublisher(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePublisherDto,
  ) {
    return { data: await this.catalog.createPublisher(user, dto) };
  }

  @Get("publishers")
  async listPublishers(@Query() query: PaginationQueryDto) {
    return this.catalog.listPublishers(query);
  }

  @Get("publishers/:publisherId")
  async getPublisher(@Param("publisherId", ParseUUIDPipe) id: string) {
    return { data: await this.catalog.getPublisher(id) };
  }

  @Patch("publishers/:publisherId")
  async updatePublisher(
    @CurrentUser() user: AuthenticatedUser,
    @Param("publisherId", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublisherDto,
  ) {
    return { data: await this.catalog.updatePublisher(user, id, dto) };
  }

  @Post("creators")
  @ApiOperation({ summary: "Cria criador de catálogo (ADMIN)" })
  @ApiResponse({ status: 201 })
  async createCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCreatorDto,
  ) {
    return { data: await this.catalog.createCreator(user, dto) };
  }

  @Get("creators")
  async listCreators(@Query() query: PaginationQueryDto) {
    return this.catalog.listCreators(query);
  }

  @Get("creators/:creatorId")
  async getCreator(@Param("creatorId", ParseUUIDPipe) id: string) {
    return { data: await this.catalog.getCreator(id) };
  }

  @Patch("creators/:creatorId")
  async updateCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Param("creatorId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCreatorDto,
  ) {
    return { data: await this.catalog.updateCreator(user, id, dto) };
  }

  @Post("categories")
  async createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogCategoryDto,
  ) {
    return { data: await this.catalog.createCategory(user, dto) };
  }

  @Get("categories")
  async listCategories(@Query() query: PaginationQueryDto) {
    return this.catalog.listCategories(query);
  }

  @Patch("categories/:categoryId")
  async updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("categoryId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogCategoryDto,
  ) {
    return { data: await this.catalog.updateCategory(user, id, dto) };
  }

  @Post("tags")
  async createTag(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogTagDto,
  ) {
    return { data: await this.catalog.createTag(user, dto) };
  }

  @Get("tags")
  async listTags(@Query() query: PaginationQueryDto) {
    return this.catalog.listTags(query);
  }

  @Patch("tags/:tagId")
  async updateTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param("tagId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogTagDto,
  ) {
    return { data: await this.catalog.updateTag(user, id, dto) };
  }

  @Post("systems")
  @ApiOperation({ summary: "Cria sistema de RPG em rascunho (ADMIN)" })
  @ApiResponse({ status: 201 })
  async createSystem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRpgSystemDto,
  ) {
    return { data: await this.catalog.createSystem(user, dto) };
  }

  @Get("systems")
  async listSystems(@Query() query: PaginationQueryDto) {
    return this.catalog.listSystems(query);
  }

  @Get("systems/:systemId")
  async getSystem(@Param("systemId", ParseUUIDPipe) id: string) {
    return { data: await this.catalog.getSystem(id) };
  }

  @Patch("systems/:systemId")
  async updateSystem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("systemId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateRpgSystemDto,
  ) {
    return { data: await this.catalog.updateSystem(user, id, dto) };
  }

  @Post("systems/:systemId/publish")
  @HttpCode(200)
  async publishSystem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("systemId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.catalog.publishSystem(user, id) };
  }

  @Post("systems/:systemId/archive")
  @HttpCode(200)
  async archiveSystem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("systemId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.catalog.archiveSystem(user, id) };
  }

  @Post("items")
  @ApiOperation({ summary: "Cria item de catálogo em rascunho (ADMIN)" })
  @ApiResponse({ status: 201 })
  async createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogItemDto,
  ) {
    return { data: await this.catalog.createItem(user, dto) };
  }

  @Get("items")
  async listItems(@Query() query: PaginationQueryDto) {
    return this.catalog.listItems(query);
  }

  @Get("items/:itemId")
  async getItem(@Param("itemId", ParseUUIDPipe) id: string) {
    return { data: await this.catalog.getItem(id) };
  }

  @Patch("items/:itemId")
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return { data: await this.catalog.updateItem(user, id, dto) };
  }

  @Post("items/:itemId/publish")
  @HttpCode(200)
  async publishItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.catalog.publishItem(user, id) };
  }

  @Post("items/:itemId/archive")
  @HttpCode(200)
  async archiveItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.catalog.archiveItem(user, id) };
  }

  @Post("items/:itemId/relations")
  async createRelation(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: CreateCatalogItemRelationDto,
  ) {
    return { data: await this.catalog.createRelation(user, itemId, dto) };
  }

  @Delete("items/:itemId/relations/:relationId")
  @HttpCode(200)
  async removeRelation(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Param("relationId", ParseUUIDPipe) relationId: string,
  ) {
    await this.catalog.removeRelation(user, itemId, relationId);
    return { data: null };
  }

  @Post("items/:itemId/aliases")
  async createAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: CreateCatalogItemAliasDto,
  ) {
    return { data: await this.catalog.createAlias(user, itemId, dto) };
  }

  @Patch("items/:itemId/aliases/:aliasId")
  async updateAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Param("aliasId", ParseUUIDPipe) aliasId: string,
    @Body() dto: UpdateCatalogItemAliasDto,
  ) {
    return { data: await this.catalog.updateAlias(user, itemId, aliasId, dto) };
  }

  @Post("items/:itemId/sources")
  async createSource(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Body() dto: CreateCatalogItemSourceDto,
  ) {
    return { data: await this.catalog.createSource(user, itemId, dto) };
  }

  @Patch("items/:itemId/sources/:sourceId")
  async updateSource(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseUUIDPipe) itemId: string,
    @Param("sourceId", ParseUUIDPipe) sourceId: string,
    @Body() dto: UpdateCatalogItemSourceDto,
  ) {
    return {
      data: await this.catalog.updateSource(user, itemId, sourceId, dto),
    };
  }

  @Post("editions")
  @ApiOperation({ summary: "Cria edição concreta de um item (ADMIN)" })
  @ApiResponse({ status: 201 })
  async createEdition(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogEditionDto,
  ) {
    return { data: await this.catalog.createEdition(user, dto) };
  }

  @Get("editions")
  async listEditions(@Query() query: PaginationQueryDto) {
    return this.catalog.listEditions(query);
  }

  @Get("editions/:editionId")
  async getEdition(@Param("editionId", ParseUUIDPipe) id: string) {
    return { data: await this.catalog.getEdition(id) };
  }

  @Patch("editions/:editionId")
  async updateEdition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("editionId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogEditionDto,
  ) {
    return { data: await this.catalog.updateEdition(user, id, dto) };
  }
}
