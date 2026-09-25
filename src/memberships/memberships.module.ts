import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard.js";
import { TableMemberEntity } from "./entities/table-member.entity.js";
import { MembershipsController } from "./memberships.controller.js";
import { MembershipsService } from "./memberships.service.js";
@Module({
  imports: [TypeOrmModule.forFeature([TableMemberEntity])],
  controllers: [MembershipsController],
  providers: [MembershipsService, RolesGuard],
})
export class MembershipsModule {}
