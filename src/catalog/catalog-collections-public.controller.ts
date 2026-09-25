import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators.js";
import { CatalogPersonalService } from "./catalog-personal.service.js";

@ApiTags("Catalog")
@Public()
@Controller({ path: "catalog/collections", version: "1" })
export class CatalogCollectionsPublicController {
  constructor(private catalog: CatalogPersonalService) {}

  @Get(":collectionId")
  @ApiOperation({ summary: "Consulta uma coleção pública" })
  @ApiResponse({ status: 200 })
  async get(@Param("collectionId", ParseUUIDPipe) id: string) {
    return { data: await this.catalog.getPublicCollection(id) };
  }
}
