import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation.js";
import { AuthModule } from "./auth/auth.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { UsersModule } from "./users/users.module.js";
import { JwtAuthGuard } from "./auth/jwt-auth.guard.js";
import { GmProfilesModule } from "./gm-profiles/gm-profiles.module.js";
import { TablesModule } from "./tables/tables.module.js";
import { InvitationsModule } from "./invitations/invitations.module.js";
import { MembershipsModule } from "./memberships/memberships.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { MediaModule } from "./media/media.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";

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
