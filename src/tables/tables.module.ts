import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { VerifiedEmailGuard } from "../auth/verified-email.guard.js";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity.js";
import { BillingPlanEntity } from "./entities/billing-plan.entity.js";
import { GameTableEntity } from "./entities/game-table.entity.js";
import { TablesController } from "./tables.controller.js";
import { TablesService } from "./tables.service.js";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameTableEntity,
      BillingPlanEntity,
      GmProfileEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [TablesController],
  providers: [TablesService, RolesGuard, VerifiedEmailGuard],
})
export class TablesModule {}
