import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../auth/auth.decorators";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../users/entities/user-role.entity";
import { AdminService } from "./admin.service";
import { ListAuditLogsQueryDto } from "./dto/list-audit-logs-query.dto";

@ApiTags("Admin")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller({ path: "admin", version: "1" })
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("audit-logs")
  @ApiOperation({ summary: "Lista logs de auditoria (ADMIN)" })
  @ApiResponse({
    status: 200,
    description: "Lista paginada e sanitizada de logs de auditoria.",
  })
  @ApiResponse({ status: 400, description: "Filtros ou paginação inválidos." })
  @ApiResponse({ status: 401, description: "Não autenticado." })
  @ApiResponse({ status: 403, description: "Requer role ADMIN." })
  async list(@Query() query: ListAuditLogsQueryDto) {
    return this.admin.list(query);
  }
}
