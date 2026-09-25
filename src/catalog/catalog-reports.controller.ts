import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import { CatalogReportsService } from "./catalog-reports.service";
import { CreateCatalogReportDto } from "./dto/catalog-report.dto";

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
