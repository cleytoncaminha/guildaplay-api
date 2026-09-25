import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaAssetEntity } from "../uploads/entities/media-asset.entity.js";
import { CatalogItemMediaEntity } from "../catalog/entities/catalog-item-media.entity.js";
import { CatalogItemEntity } from "../catalog/entities/catalog-item.entity.js";
import { MediaController } from "./media.controller.js";
import { MediaService } from "./media.service.js";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaAssetEntity,
      CatalogItemEntity,
      CatalogItemMediaEntity,
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
