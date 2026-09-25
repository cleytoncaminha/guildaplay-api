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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../auth/auth.decorators.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { UserRole } from "../users/entities/user-role.entity.js";
import {
  AddCatalogFeaturedListItemDto,
  CreateCatalogFeaturedListDto,
  ListCatalogFeaturedListsQueryDto,
  UpdateCatalogFeaturedListDto,
} from "./dto/catalog-featured-list.dto.js";
import { CatalogStatus } from "./enums/catalog.enums.js";
import { CatalogFeaturedListsService } from "./catalog-featured-lists.service.js";

@ApiTags("Catalog Curation")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller({ path: "admin/catalog/lists", version: "1" })
export class CatalogFeaturedListsController {
  constructor(private lists: CatalogFeaturedListsService) {}

  @Post()
  @ApiOperation({ summary: "Cria lista temática em rascunho (ADMIN)" })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogFeaturedListDto,
  ) {
    return { data: await this.lists.create(user, dto) };
  }

  @Get()
  async list(@Query() query: ListCatalogFeaturedListsQueryDto) {
    return this.lists.listAdmin(query);
  }

  @Get(":listId")
  async get(@Param("listId", ParseUUIDPipe) id: string) {
    return { data: await this.lists.getAdmin(id) };
  }

  @Patch(":listId")
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogFeaturedListDto,
  ) {
    return { data: await this.lists.update(user, id, dto) };
  }

  @Post(":listId/publish")
  @HttpCode(200)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listId", ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.lists.transition(user, id, CatalogStatus.PUBLISHED),
    };
  }

  @Post(":listId/archive")
  @HttpCode(200)
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listId", ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.lists.transition(user, id, CatalogStatus.ARCHIVED),
    };
  }

  @Post(":listId/items/:catalogItemId")
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listId", ParseUUIDPipe) listId: string,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
    @Body() dto: AddCatalogFeaturedListItemDto,
  ) {
    return { data: await this.lists.addItem(user, listId, itemId, dto) };
  }

  @Delete(":listId/items/:catalogItemId")
  @HttpCode(204)
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("listId", ParseUUIDPipe) listId: string,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
  ) {
    await this.lists.removeItem(user, listId, itemId);
  }
}
