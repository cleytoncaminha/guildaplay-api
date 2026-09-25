import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { MediaAssetEntity } from "../../uploads/entities/media-asset.entity";
import { CatalogItemMediaKind } from "../enums/catalog.enums";
import { CatalogItemEntity } from "./catalog-item.entity";

@Entity({ name: "catalog_item_media" })
export class CatalogItemMediaEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "catalog_item_id", type: "uuid" }) catalogItemId!: string;

  @Column({ name: "media_asset_id", type: "uuid", unique: true })
  mediaAssetId!: string;

  @Column({
    type: "enum",
    enum: CatalogItemMediaKind,
    enumName: "catalog_item_media_kind",
  })
  kind!: CatalogItemMediaKind;

  @Column({ type: "integer", default: 0 }) position!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.media, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => MediaAssetEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "media_asset_id" })
  mediaAsset!: Relation<MediaAssetEntity>;
}
