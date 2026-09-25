import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { TableMemberEntity } from "./entities/table-member.entity";
import { MembershipsController } from "./memberships.controller";
import { MembershipsService } from "./memberships.service";
@Module({
  imports: [TypeOrmModule.forFeature([TableMemberEntity])],
  controllers: [MembershipsController],
  providers: [MembershipsService, RolesGuard],
})
export class MembershipsModule {}
