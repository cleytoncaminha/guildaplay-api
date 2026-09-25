import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuditLogEntity } from "../audit/audit-log.entity.js";
import { UserEntity } from "./entities/user.entity.js";
import { UserRoleEntity } from "./entities/user-role.entity.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserRoleEntity, AuditLogEntity]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
