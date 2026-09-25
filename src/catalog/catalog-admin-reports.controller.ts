import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../users/entities/user-role.entity";
import { CatalogReportsService } from "./catalog-reports.service";
import { ResolveCatalogReportDto } from "./dto/catalog-report.dto";

@ApiTags("Catalog Moderation")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller({ path: "admin/catalog/reports", version: "1" })
export class CatalogAdminReportsController {
  constructor(private reports: CatalogReportsService) {}

  @Get("pending")
  async pending() {
    return this.reports.pending();
  }

  @Post(":reportId/resolve")
  @HttpCode(200)
  async resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reportId", ParseUUIDPipe) id: string,
    @Body() dto: ResolveCatalogReportDto,
  ) {
    return { data: await this.reports.resolve(user, id, dto) };
  }
}
