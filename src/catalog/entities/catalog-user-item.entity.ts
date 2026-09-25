import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { UserEntity } from "../../users/entities/user.entity";
import { CatalogItemEntity } from "./catalog-item.entity";

@Entity({ name: "catalog_user_items" })
export class CatalogUserItemEntity {
  @PrimaryColumn({ name: "user_id", type: "uuid" }) userId!: string;

  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @Column({ name: "has_item", type: "boolean", default: false })
  hasItem!: boolean;

  @Column({ name: "wants_item", type: "boolean", default: false })
  wantsItem!: boolean;

  @Column({ name: "played_item", type: "boolean", default: false })
  playedItem!: boolean;

  @Column({ name: "is_favorite", type: "boolean", default: false })
  isFavorite!: boolean;

  @Column({ name: "private_comment", type: "text", nullable: true })
  privateComment!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: CatalogItemEntity;
}
