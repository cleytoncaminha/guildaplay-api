import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { UserEntity } from "../../users/entities/user.entity";
import { CatalogItemEntity } from "./catalog-item.entity";

export enum CatalogReviewStatus {
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
}

@Entity({ name: "catalog_item_reviews" })
@Unique("UQ_catalog_item_reviews_user_item", ["userId", "catalogItemId"])
@Check("CHK_catalog_item_reviews_rating", `"rating" BETWEEN 1 AND 10`)
export class CatalogItemReviewEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "user_id", type: "uuid" }) userId!: string;

  @Column({ name: "catalog_item_id", type: "uuid" }) catalogItemId!: string;

  @Column({ type: "smallint" }) rating!: number;

  @Column({ type: "text", nullable: true }) content!: string | null;

  @Column({
    type: "enum",
    enum: CatalogReviewStatus,
    enumName: "catalog_review_status",
    default: CatalogReviewStatus.PENDING,
  })
  status!: CatalogReviewStatus;

  @Column({ name: "moderated_by_user_id", type: "uuid", nullable: true })
  moderatedByUserId!: string | null;

  @Column({
    name: "moderation_reason",
    type: "varchar",
    length: 1000,
    nullable: true,
  })
  moderationReason!: string | null;

  @Column({ name: "moderated_at", type: "timestamptz", nullable: true })
  moderatedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<UserEntity>;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "moderated_by_user_id" })
  moderatedBy!: Relation<UserEntity> | null;
}
