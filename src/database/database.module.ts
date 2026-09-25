import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import type { EnvironmentVariables } from "../config/env.validation";
import { createTypeOrmOptions } from "./typeorm.config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) =>
        createTypeOrmOptions(configService.getOrThrow<string>("DATABASE_URL")),
    }),
  ],
})
export class DatabaseModule {}
