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

@Entity({ name: "catalog_item_aliases" })
export class CatalogItemAliasEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "catalog_item_id", type: "uuid" }) catalogItemId!: string;

  @Column({ type: "varchar", length: 255 }) alias!: string;

  @Column({
    name: "alias_normalized",
    type: "varchar",
    length: 255,
    unique: true,
  })
  aliasNormalized!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.aliases, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: CatalogItemEntity;
}
