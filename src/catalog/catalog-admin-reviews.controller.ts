import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser, Roles } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../users/entities/user-role.entity";
import {
  ListCatalogReviewsQueryDto,
  ModerateCatalogReviewDto,
} from "./dto/catalog-review.dto";
import { CatalogReviewsService } from "./catalog-reviews.service";

@ApiTags("Catalog Moderation")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller({ path: "admin/catalog/reviews", version: "1" })
export class CatalogAdminReviewsController {
  constructor(private reviews: CatalogReviewsService) {}

  @Get("pending")
  async pending(@Query() query: ListCatalogReviewsQueryDto) {
    return this.reviews.pending(query);
  }

  @Post(":reviewId/moderate")
  @HttpCode(200)
  async moderate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reviewId", ParseUUIDPipe) reviewId: string,
    @Body() dto: ModerateCatalogReviewDto,
  ) {
    return { data: await this.reviews.moderate(user, reviewId, dto) };
  }
}
