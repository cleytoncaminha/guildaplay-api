import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { CatalogPublicService } from "./catalog-public.service";
import { CatalogPublicQueryDto } from "./dto/catalog-public-query.dto";
import { ListCatalogReviewsQueryDto } from "./dto/catalog-review.dto";
import { CatalogReviewsService } from "./catalog-reviews.service";

@ApiTags("Catalog")
@Public()
@Controller({ path: "catalog", version: "1" })
export class CatalogPublicController {
  constructor(
    private catalog: CatalogPublicService,
    private reviews: CatalogReviewsService,
  ) {}

  @Get("items")
  @ApiOperation({ summary: "Busca itens publicados do catálogo" })
  @ApiResponse({ status: 200 })
  async list(@Query() query: CatalogPublicQueryDto) {
    return this.catalog.list(query);
  }

  @Get("items/:slug")
  @ApiOperation({ summary: "Consulta item publicado por slug" })
  @ApiResponse({ status: 200 })
  async get(@Param("slug") slug: string) {
    return { data: await this.catalog.getBySlug(slug) };
  }

  @Get("items/:slug/reviews")
  @ApiOperation({ summary: "Lista avaliações publicadas de um item" })
  @ApiResponse({ status: 200 })
  async listReviews(
    @Param("slug") slug: string,
    @Query() query: ListCatalogReviewsQueryDto,
  ) {
    return this.reviews.listPublishedBySlug(slug, query);
  }
}
