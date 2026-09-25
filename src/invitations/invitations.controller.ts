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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser, Public, Roles } from "../auth/auth.decorators.js";
import { AuthenticatedUser } from "../auth/auth.types.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { VerifiedEmailGuard } from "../auth/verified-email.guard.js";
import { UserRole } from "../users/entities/user-role.entity.js";
import { CreateInvitationDto } from "./dto/create-invitation.dto.js";
import { InvitationsService } from "./invitations.service.js";
@Controller()
@ApiTags("Invitations")
export class InvitationsController {
  constructor(private s: InvitationsService) {}
  @Post("tables/:tableId/invitations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cria um convite para uma mesa" })
  @ApiResponse({
    status: 201,
    description: "Convite criado; o token é exibido apenas nesta resposta.",
  })
  @Roles(UserRole.GM)
  @UseGuards(RolesGuard, VerifiedEmailGuard)
  async create(
    @CurrentUser() u: AuthenticatedUser,
    @Param("tableId", ParseUUIDPipe) id: string,
    @Body() d: CreateInvitationDto,
  ) {
    return { data: await this.s.create(u, id, d) };
  }
  @Get("invitations/:token/preview")
  @Public()
  @ApiOperation({ summary: "Exibe uma prévia pública e segura do convite" })
  @ApiResponse({ status: 200, description: "Prévia do convite." })
  async preview(@Param("token") t: string) {
    return { data: await this.s.preview(t) };
  }
  @Post("invitations/:token/accept")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Aceita um convite de mesa" })
  @ApiResponse({
    status: 201,
    description: "Participação criada ou reativada.",
  })
  @UseGuards(VerifiedEmailGuard)
  async accept(@CurrentUser() u: AuthenticatedUser, @Param("token") t: string) {
    return { data: await this.s.accept(u, t) };
  }
}
