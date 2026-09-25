import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediaAssetEntity } from "../uploads/entities/media-asset.entity";
import { CatalogItemMediaEntity } from "../catalog/entities/catalog-item-media.entity";
import { CatalogItemEntity } from "../catalog/entities/catalog-item.entity";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
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
