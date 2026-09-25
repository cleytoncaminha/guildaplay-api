import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/auth.decorators.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { CatalogReportsService } from "./catalog-reports.service.js";
import { CreateCatalogReportDto } from "./dto/catalog-report.dto.js";

@ApiTags("Catalog Reports")
@ApiBearerAuth()
@Controller({ path: "catalog/reports", version: "1" })
export class CatalogReportsController {
  constructor(private reports: CatalogReportsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogReportDto,
  ) {
    return { data: await this.reports.create(user, dto) };
  }
}
