import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
export enum MediaPurpose {
  USER_AVATAR = "USER_AVATAR",
  TABLE_COVER = "TABLE_COVER",
  CATALOG_COVER = "CATALOG_COVER",
  CATALOG_IMAGE = "CATALOG_IMAGE",
}
export enum MediaStatus {
  PENDING_UPLOAD = "PENDING_UPLOAD",
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}
@Entity({ name: "media_assets" })
export class MediaAssetEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "owner_user_id", type: "uuid" }) ownerUserId!: string;
  @Column({ type: "enum", enum: MediaPurpose, enumName: "media_purpose" })
  purpose!: MediaPurpose;
  @Column({ name: "object_key", type: "varchar", length: 500, unique: true })
  objectKey!: string;
  @Column({ name: "mime_type", type: "varchar", length: 120 })
  mimeType!: string;
  @Column({ name: "size_bytes", type: "bigint" }) sizeBytes!: string;
  @Column({ type: "enum", enum: MediaStatus, enumName: "media_status" })
  status!: MediaStatus;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
