import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { AuthenticatedUser } from "../auth/auth.types";
import { RolesGuard } from "../auth/roles.guard";
import { VerifiedEmailGuard } from "../auth/verified-email.guard";
import { UserRole } from "../users/entities/user-role.entity";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";
import { GameTableStatus } from "./entities/game-table.entity";
import { TablesService } from "./tables.service";
@ApiTags("Tables")
@ApiBearerAuth()
@Roles(UserRole.GM)
@UseGuards(RolesGuard)
@Controller({ path: "tables", version: "1" })
export class TablesController {
  constructor(private tables: TablesService) {}
  @Post()
  @UseGuards(VerifiedEmailGuard)
  @ApiOperation({ summary: "Cria mesa e plano mensal" })
  @ApiResponse({ status: 201 })
  async create(@CurrentUser() u: AuthenticatedUser, @Body() d: CreateTableDto) {
    return { data: await this.tables.create(u, d) };
  }
  @Get("mine")
  @ApiResponse({
    status: 200,
    description: "Lista mesas com cover nulo ou { id, url } de URL temporária.",
  })
  async mine(@CurrentUser() u: AuthenticatedUser) {
    return { data: await this.tables.listMine(u) };
  }
  @Get(":tableId")
  @ApiResponse({
    status: 200,
    description:
      "Retorna mesa com cover nulo ou { id, url } de URL temporária.",
  })
  async get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.tables.getMine(u, id) };
  }
  @Patch(":tableId") async update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
    @Body() d: UpdateTableDto,
  ) {
    return { data: await this.tables.update(u, id, d) };
  }
  @Post(":tableId/activate")
  @HttpCode(200)
  async activate(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.tables.transition(
        u,
        id,
        GameTableStatus.ACTIVE,
        "TABLE_ACTIVATED",
      ),
    };
  }
  @Post(":tableId/pause")
  @HttpCode(200)
  async pause(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.tables.transition(
        u,
        id,
        GameTableStatus.PAUSED,
        "TABLE_PAUSED",
      ),
    };
  }
  @Post(":tableId/archive")
  @HttpCode(200)
  async archive(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.tables.transition(
        u,
        id,
        GameTableStatus.ARCHIVED,
        "TABLE_ARCHIVED",
      ),
    };
  }
}
