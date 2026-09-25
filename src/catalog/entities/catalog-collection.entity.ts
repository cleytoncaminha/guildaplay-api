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
import type { Relation } from "typeorm";

import { UserEntity } from "../../users/entities/user.entity";
import { CatalogCollectionItemEntity } from "./catalog-collection-item.entity";

@Entity({ name: "catalog_collections" })
export class CatalogCollectionEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "owner_user_id", type: "uuid" }) ownerUserId!: string;

  @Column({ type: "varchar", length: 120 }) name!: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  description!: string | null;

  @Column({ name: "is_public", type: "boolean", default: false })
  isPublic!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "owner_user_id" })
  owner!: Relation<UserEntity>;

  @OneToMany(() => CatalogCollectionItemEntity, (item) => item.collection)
  items!: Relation<CatalogCollectionItemEntity[]>;
}
