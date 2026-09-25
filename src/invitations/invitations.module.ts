import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard.js";
import { VerifiedEmailGuard } from "../auth/verified-email.guard.js";
import { InvitationEntity } from "./entities/invitation.entity.js";
import { InvitationsController } from "./invitations.controller.js";
import { InvitationsService } from "./invitations.service.js";
@Module({
  imports: [TypeOrmModule.forFeature([InvitationEntity])],
  controllers: [InvitationsController],
  providers: [InvitationsService, RolesGuard, VerifiedEmailGuard],
})
export class InvitationsModule {}
