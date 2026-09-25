import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { RolesGuard } from "../auth/roles.guard.js";
import { VerifiedEmailGuard } from "../auth/verified-email.guard.js";
import { GmProfilesController } from "./gm-profiles.controller.js";
import { GmProfilesService } from "./gm-profiles.service.js";
import { GmProfileEntity } from "./entities/gm-profile.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([GmProfileEntity, AuditLogEntity])],
  controllers: [GmProfilesController],
  providers: [GmProfilesService, RolesGuard, VerifiedEmailGuard],
})
export class GmProfilesModule {}
