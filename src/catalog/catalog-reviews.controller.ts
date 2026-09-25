import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import {
  ListCatalogReviewsQueryDto,
  UpsertCatalogReviewDto,
} from "./dto/catalog-review.dto";
import { CatalogReviewsService } from "./catalog-reviews.service";

@ApiTags("Catalog Reviews")
@ApiBearerAuth()
@Controller({ path: "catalog/reviews", version: "1" })
export class CatalogReviewsController {
  constructor(private reviews: CatalogReviewsService) {}

  @Get("mine")
  async mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCatalogReviewsQueryDto,
  ) {
    return this.reviews.listMine(user, query);
  }

  @Put(":catalogItemId")
  async upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
    @Body() dto: UpsertCatalogReviewDto,
  ) {
    return { data: await this.reviews.upsert(user, itemId, dto) };
  }

  @Delete(":catalogItemId")
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("catalogItemId", ParseUUIDPipe) itemId: string,
  ) {
    await this.reviews.remove(user, itemId);
  }
}
