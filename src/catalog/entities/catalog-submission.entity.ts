import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { UserEntity } from "../../users/entities/user.entity";
import { CatalogItemEntity } from "./catalog-item.entity";

export enum CatalogSubmissionType {
  CREATE_ITEM = "CREATE_ITEM",
  UPDATE_ITEM = "UPDATE_ITEM",
}

export enum CatalogSubmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity({ name: "catalog_submissions" })
export class CatalogSubmissionEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "submitted_by_user_id", type: "uuid" })
  submittedByUserId!: string;

  @Column({ name: "catalog_item_id", type: "uuid", nullable: true })
  catalogItemId!: string | null;

  @Column({
    type: "enum",
    enum: CatalogSubmissionType,
    enumName: "catalog_submission_type",
  })
  type!: CatalogSubmissionType;

  @Column({ type: "jsonb" }) payload!: Record<string, unknown>;

  @Column({
    type: "enum",
    enum: CatalogSubmissionStatus,
    enumName: "catalog_submission_status",
    default: CatalogSubmissionStatus.PENDING,
  })
  status!: CatalogSubmissionStatus;

  @Column({ name: "reviewed_by_user_id", type: "uuid", nullable: true })
  reviewedByUserId!: string | null;

  @Column({
    name: "review_reason",
    type: "varchar",
    length: 1000,
    nullable: true,
  })
  reviewReason!: string | null;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "submitted_by_user_id" })
  submittedBy!: Relation<UserEntity>;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity> | null;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "reviewed_by_user_id" })
  reviewedBy!: Relation<UserEntity> | null;
}
