import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { UserEntity } from "../../users/entities/user.entity";
import { CatalogStatus } from "../enums/catalog.enums";
import { CatalogFeaturedListItemEntity } from "./catalog-featured-list-item.entity";

@Entity({ name: "catalog_featured_lists" })
export class CatalogFeaturedListEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 160 }) title!: string;

  @Column({ type: "varchar", length: 180, unique: true }) slug!: string;

  @Column({ type: "text", nullable: true }) description!: string | null;

  @Column({ name: "curated_by_user_id", type: "uuid" })
  curatedByUserId!: string;

  @Column({
    type: "enum",
    enum: CatalogStatus,
    enumName: "catalog_status",
    default: CatalogStatus.DRAFT,
  })
  status!: CatalogStatus;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "curated_by_user_id" })
  curatedBy!: UserEntity;

  @OneToMany(() => CatalogFeaturedListItemEntity, (item) => item.list)
  items!: CatalogFeaturedListItemEntity[];
}
