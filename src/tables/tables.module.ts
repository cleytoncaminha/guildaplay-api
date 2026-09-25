import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "../audit/audit-log.entity";
import { RolesGuard } from "../auth/roles.guard";
import { VerifiedEmailGuard } from "../auth/verified-email.guard";
import { GmProfileEntity } from "../gm-profiles/entities/gm-profile.entity";
import { BillingPlanEntity } from "./entities/billing-plan.entity";
import { GameTableEntity } from "./entities/game-table.entity";
import { TablesController } from "./tables.controller";
import { TablesService } from "./tables.service";
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
