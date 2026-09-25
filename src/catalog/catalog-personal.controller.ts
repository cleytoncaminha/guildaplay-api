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
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import {
  AddCatalogCollectionItemDto,
  CreateCatalogCollectionDto,
  ListCatalogUserItemsQueryDto,
  UpdateCatalogCollectionDto,
  UpdateCatalogUserItemDto,
} from "./dto/catalog-personal.dto";
import { CatalogPersonalService } from "./catalog-personal.service";

@ApiTags("My Catalog")
@ApiBearerAuth()
@Controller({ path: "catalog/me", version: "1" })
export class CatalogPersonalController {
  constructor(private catalog: CatalogPersonalService) {}

  @Get("items")
  async items(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCatalogUserItemsQueryDto,
  ) {
    return this.catalog.listItems(user, query);
  }

  @Put("items/:catalogItemId")
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCatalogUserItemDto,
  ) {
    return { data: await this.catalog.updateItem(user, itemId, dto) };
  }

  @Delete("items/:catalogItemId")
  @HttpCode(204)
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
  ) {
    await this.catalog.removeItem(user, itemId);
  }

  @Post("collections")
  async createCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogCollectionDto,
  ) {
    return { data: await this.catalog.createCollection(user, dto) };
  }

  @Get("collections")
  async collections(@CurrentUser() user: AuthenticatedUser) {
    return this.catalog.listMyCollections(user);
  }

  @Get("collections/:collectionId")
  async getCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.catalog.getMyCollection(user, id) };
  }

  @Patch("collections/:collectionId")
  async updateCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogCollectionDto,
  ) {
    return { data: await this.catalog.updateCollection(user, id, dto) };
  }

  @Delete("collections/:collectionId")
  @HttpCode(204)
  async removeCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
  ) {
    await this.catalog.removeCollection(user, id);
  }

  @Post("collections/:collectionId/items/:catalogItemId")
  async addCollectionItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) collectionId: string,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
    @Body() dto: AddCatalogCollectionItemDto,
  ) {
    return {
      data: await this.catalog.addCollectionItem(
        user,
        collectionId,
        itemId,
        dto,
      ),
    };
  }

  @Delete("collections/:collectionId/items/:catalogItemId")
  @HttpCode(204)
  async removeCollectionItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) collectionId: string,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
  ) {
    await this.catalog.removeCollectionItem(user, collectionId, itemId);
  }
}
