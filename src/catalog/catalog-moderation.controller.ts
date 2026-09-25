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
import { CurrentUser, Roles } from "../auth/auth.decorators.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { UserRole } from "../users/entities/user-role.entity.js";
import { CatalogModerationService } from "./catalog-moderation.service.js";
import { ReviewCatalogSubmissionDto } from "./dto/catalog-moderation.dto.js";
import { CatalogSubmissionStatus } from "./entities/catalog-submission.entity.js";
@ApiTags("Catalog Moderation")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller({ path: "admin/catalog/submissions", version: "1" })
export class CatalogModerationController {
  constructor(private moderation: CatalogModerationService) {}
  @Get("pending") async pending() {
    return this.moderation.pending();
  }
  @Post(":submissionId/approve") @HttpCode(200) async approve(
    @CurrentUser() u: AuthenticatedUser,
    @Param("submissionId", ParseUUIDPipe) id: string,
    @Body() d: ReviewCatalogSubmissionDto,
  ) {
    return {
      data: await this.moderation.review(
        u,
        id,
        CatalogSubmissionStatus.APPROVED,
        d,
      ),
    };
  }
  @Post(":submissionId/reject") @HttpCode(200) async reject(
    @CurrentUser() u: AuthenticatedUser,
    @Param("submissionId", ParseUUIDPipe) id: string,
    @Body() d: ReviewCatalogSubmissionDto,
  ) {
    return {
      data: await this.moderation.review(
        u,
        id,
        CatalogSubmissionStatus.REJECTED,
        d,
      ),
    };
  }
}
