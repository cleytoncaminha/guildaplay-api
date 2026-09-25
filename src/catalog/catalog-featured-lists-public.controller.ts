import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { ListCatalogFeaturedListsQueryDto } from "./dto/catalog-featured-list.dto";
import { CatalogFeaturedListsService } from "./catalog-featured-lists.service";

@ApiTags("Catalog")
@Public()
@Controller({ path: "catalog/lists", version: "1" })
export class CatalogFeaturedListsPublicController {
  constructor(private lists: CatalogFeaturedListsService) {}

  @Get()
  @ApiOperation({ summary: "Lista curadorias temáticas publicadas" })
  @ApiResponse({ status: 200 })
  async list(@Query() query: ListCatalogFeaturedListsQueryDto) {
    return this.lists.listPublic(query);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Consulta curadoria temática publicada" })
  @ApiResponse({ status: 200 })
  async get(@Param("slug") slug: string) {
    return { data: await this.lists.getPublic(slug) };
  }
}
