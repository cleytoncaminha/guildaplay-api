import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RolesGuard } from "../auth/roles.guard";
import { VerifiedEmailGuard } from "../auth/verified-email.guard";
import { InvitationEntity } from "./entities/invitation.entity";
import { InvitationsController } from "./invitations.controller";
import { InvitationsService } from "./invitations.service";
@Module({
  imports: [TypeOrmModule.forFeature([InvitationEntity])],
  controllers: [InvitationsController],
  providers: [InvitationsService, RolesGuard, VerifiedEmailGuard],
})
export class InvitationsModule {}
