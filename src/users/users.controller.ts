import { Body, Controller, Get, Patch } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "../auth/auth.decorators.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { UpdateMeDto } from "./dto/update-me.dto.js";
import { UsersService } from "./users.service.js";

@ApiTags("Users")
@ApiBearerAuth()
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Consulta o próprio perfil" })
  @ApiResponse({ status: 200, description: "Perfil do usuário autenticado." })
  @ApiResponse({ status: 401, description: "Token ausente ou inválido." })
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    return { data: await this.users.me(currentUser) };
  }

  @Patch("me")
  @ApiOperation({ summary: "Atualiza dados permitidos do próprio perfil" })
  @ApiResponse({ status: 200, description: "Perfil atualizado." })
  @ApiResponse({ status: 400, description: "Dados inválidos." })
  @ApiResponse({ status: 401, description: "Token ausente ou inválido." })
  async updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ) {
    return { data: await this.users.updateMe(currentUser, dto) };
  }
}
