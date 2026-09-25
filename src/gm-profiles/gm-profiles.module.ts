import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity";
import { RolesGuard } from "../auth/roles.guard";
import { VerifiedEmailGuard } from "../auth/verified-email.guard";
import { GmProfilesController } from "./gm-profiles.controller";
import { GmProfilesService } from "./gm-profiles.service";
import { GmProfileEntity } from "./entities/gm-profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GmProfileEntity, AuditLogEntity])],
  controllers: [GmProfilesController],
  providers: [GmProfilesService, RolesGuard, VerifiedEmailGuard],
})
export class GmProfilesModule {}
