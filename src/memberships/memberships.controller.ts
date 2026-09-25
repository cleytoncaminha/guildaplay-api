import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
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
import { UserRole } from "../users/entities/user-role.entity";
import { MembershipsService } from "./memberships.service";
@Controller()
@ApiTags("Memberships")
export class MembershipsController {
  constructor(private s: MembershipsService) {}
  @Get("memberships/mine")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lista as próprias participações em mesas" })
  @ApiResponse({
    status: 200,
    description: "Participações do usuário autenticado.",
  })
  async mine(@CurrentUser() u: AuthenticatedUser) {
    return { data: await this.s.mine(u) };
  }
  @Get("tables/:tableId/members")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lista membros de uma mesa do GM" })
  @ApiResponse({ status: 200, description: "Membros da mesa." })
  @Roles(UserRole.GM)
  @UseGuards(RolesGuard)
  async list(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.s.list(u, id) };
  }
  @Post("tables/:tableId/members/:memberId/remove")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove um membro de uma mesa do GM" })
  @ApiResponse({ status: 200, description: "Membro removido." })
  @Roles(UserRole.GM)
  @UseGuards(RolesGuard)
  async remove(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) t: string,
    @Param("memberId", ParseUUIDPipe) m: string,
  ) {
    return { data: await this.s.remove(u, t, m) };
  }
}
