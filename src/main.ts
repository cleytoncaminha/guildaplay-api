import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module.js";
import type { EnvironmentVariables } from "./config/env.validation.js";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter.js";
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor.js";
import {
  ensureRequestId,
  type RequestIdResponse,
  type RequestWithId,
} from "./common/utils/request-id.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables>);
  const allowedOrigins = configService.getOrThrow<string[]>(
    "CORS_ALLOWED_ORIGINS",
  );

  app.enableShutdownHooks();
  app.use(helmet());
  app.use(cookieParser());
  app.use(
    (
      request: RequestWithId,
      response: RequestIdResponse,
      next: NextFunction,
    ) => {
      ensureRequestId(request, response);
      next();
    },
  );
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("GuildaPlay API")
    .setDescription("API REST da GuildaPlay.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = configService.getOrThrow<number>("PORT");
  await app.listen(port);
}

void bootstrap();
