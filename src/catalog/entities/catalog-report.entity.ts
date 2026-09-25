import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MediaAssetEntity } from "../../uploads/entities/media-asset.entity";
import { UserEntity } from "../../users/entities/user.entity";
import { CatalogItemEntity } from "./catalog-item.entity";

export enum CatalogReportTargetType {
  ITEM = "ITEM",
  MEDIA = "MEDIA",
}

export enum CatalogReportReason {
  DUPLICATE = "DUPLICATE",
  INACCURATE = "INACCURATE",
  COPYRIGHT = "COPYRIGHT",
  INAPPROPRIATE = "INAPPROPRIATE",
  OTHER = "OTHER",
}

export enum CatalogReportStatus {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

@Entity({ name: "catalog_reports" })
@Check(
  "CHK_catalog_reports_target",
  `("target_type" = 'ITEM' AND "catalog_item_id" IS NOT NULL AND "media_asset_id" IS NULL) OR ("target_type" = 'MEDIA' AND "media_asset_id" IS NOT NULL AND "catalog_item_id" IS NULL)`,
)
export class CatalogReportEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "reported_by_user_id", type: "uuid" })
  reportedByUserId!: string;

  @Column({
    name: "target_type",
    type: "enum",
    enum: CatalogReportTargetType,
    enumName: "catalog_report_target_type",
  })
  targetType!: CatalogReportTargetType;

  @Column({ name: "catalog_item_id", type: "uuid", nullable: true })
  catalogItemId!: string | null;

  @Column({ name: "media_asset_id", type: "uuid", nullable: true })
  mediaAssetId!: string | null;

  @Column({
    type: "enum",
    enum: CatalogReportReason,
    enumName: "catalog_report_reason",
  })
  reason!: CatalogReportReason;

  @Column({
    name: "duplicate_of_catalog_item_id",
    type: "uuid",
    nullable: true,
  })
  duplicateOfCatalogItemId!: string | null;

  @Column({ type: "varchar", length: 1000 }) description!: string;

  @Column({
    type: "enum",
    enum: CatalogReportStatus,
    enumName: "catalog_report_status",
    default: CatalogReportStatus.PENDING,
  })
  status!: CatalogReportStatus;

  @Column({ name: "resolved_by_user_id", type: "uuid", nullable: true })
  resolvedByUserId!: string | null;

  @Column({
    name: "resolution_note",
    type: "varchar",
    length: 1000,
    nullable: true,
  })
  resolutionNote!: string | null;

  @Column({ name: "resolved_at", type: "timestamptz", nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "reported_by_user_id" })
  reportedBy!: UserEntity;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: CatalogItemEntity | null;

  @ManyToOne(() => MediaAssetEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "media_asset_id" })
  mediaAsset!: MediaAssetEntity | null;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "duplicate_of_catalog_item_id" })
  duplicateOfCatalogItem!: CatalogItemEntity | null;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "resolved_by_user_id" })
  resolvedBy!: UserEntity | null;
}
