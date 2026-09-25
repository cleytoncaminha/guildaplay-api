import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { GmProfilesModule } from "./gm-profiles/gm-profiles.module";
import { TablesModule } from "./tables/tables.module";
import { InvitationsModule } from "./invitations/invitations.module";
import { MembershipsModule } from "./memberships/memberships.module";
import { StorageModule } from "./storage/storage.module";
import { MediaModule } from "./media/media.module";
import { AdminModule } from "./admin/admin.module";
import { CatalogModule } from "./catalog/catalog.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    GmProfilesModule,
    TablesModule,
    InvitationsModule,
    MembershipsModule,
    StorageModule,
    MediaModule,
    AdminModule,
    CatalogModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
