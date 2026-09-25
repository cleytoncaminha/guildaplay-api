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
import { CatalogModerationService } from "./catalog-moderation.service";
import { ReviewCatalogSubmissionDto } from "./dto/catalog-moderation.dto";
import { CatalogSubmissionStatus } from "./entities/catalog-submission.entity";
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
