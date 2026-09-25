import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
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
import { CreateGmProfileDto } from "./dto/create-gm-profile.dto";
import { UpdateGmProfileDto } from "./dto/update-gm-profile.dto";
import { GmProfilesService } from "./gm-profiles.service";

@ApiTags("GM Profiles")
@ApiBearerAuth()
@Controller({ path: "gm-profiles", version: "1" })
export class GmProfilesController {
  constructor(private profiles: GmProfilesService) {}

  @Post()
  @UseGuards(VerifiedEmailGuard)
  @ApiOperation({ summary: "Cria o próprio perfil de mestre" })
  @ApiResponse({
    status: 201,
    description: "Perfil GM criado e role GM atribuída.",
  })
  @ApiResponse({ status: 403, description: "E-mail não verificado." })
  @ApiResponse({ status: 409, description: "Perfil GM já existente." })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateGmProfileDto,
  ) {
    return { data: await this.profiles.create(currentUser, dto) };
  }

  @Get("me")
  @ApiOperation({ summary: "Consulta o próprio perfil de mestre" })
  @ApiResponse({
    status: 200,
    description: "Perfil GM do usuário autenticado.",
  })
  @ApiResponse({ status: 404, description: "Perfil GM não encontrado." })
  async mine(@CurrentUser() currentUser: AuthenticatedUser) {
    return { data: await this.profiles.mine(currentUser) };
  }

  @Patch("me")
  @Roles(UserRole.GM)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Atualiza o próprio perfil de mestre" })
  @ApiResponse({ status: 200, description: "Perfil GM atualizado." })
  @ApiResponse({ status: 403, description: "Role GM obrigatória." })
  @ApiResponse({ status: 404, description: "Perfil GM não encontrado." })
  async updateMine(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateGmProfileDto,
  ) {
    return { data: await this.profiles.updateMine(currentUser, dto) };
  }
}
