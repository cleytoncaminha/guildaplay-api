import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemTagEntity } from "./catalog-item-tag.entity.js";

@Entity({ name: "catalog_tags" })
export class CatalogTagEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 80 }) name!: string;

  @Column({ type: "varchar", length: 100, unique: true }) slug!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => CatalogItemTagEntity, (item) => item.tag)
  catalogItems!: Relation<CatalogItemTagEntity[]>;
}
