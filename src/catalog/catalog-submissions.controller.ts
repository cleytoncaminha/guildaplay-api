import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/auth.decorators.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { CatalogSubmissionsService } from "./catalog-submissions.service.js";
import {
  CreateCatalogSubmissionDto,
  ListMyCatalogSubmissionsQueryDto,
} from "./dto/catalog-submission.dto.js";
@ApiTags("Catalog Submissions")
@ApiBearerAuth()
@Controller({ path: "catalog/submissions", version: "1" })
export class CatalogSubmissionsController {
  constructor(private submissions: CatalogSubmissionsService) {}
  @Post() async create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() d: CreateCatalogSubmissionDto,
  ) {
    return { data: await this.submissions.create(u, d) };
  }
  @Get("mine") async listMine(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: ListMyCatalogSubmissionsQueryDto,
  ) {
    return this.submissions.listMine(u, q);
  }
  @Get("mine/:submissionId") async getMine(
    @CurrentUser() u: AuthenticatedUser,
    @Param("submissionId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.submissions.getMine(u, id) };
  }
}
