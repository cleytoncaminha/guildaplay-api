import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
