import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { RolesGuard } from "../auth/roles.guard";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
