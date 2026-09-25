import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { CatalogItemEntity } from "./catalog-item.entity";

@Entity({ name: "catalog_item_sources" })
export class CatalogItemSourceEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "catalog_item_id", type: "uuid" }) catalogItemId!: string;

  @Column({ type: "varchar", length: 255 }) label!: string;

  @Column({ type: "varchar", length: 500 }) url!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.sources, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: CatalogItemEntity;
}
