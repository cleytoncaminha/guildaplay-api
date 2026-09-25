import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemCategoryEntity } from "./catalog-item-category.entity";

@Entity({ name: "catalog_categories" })
export class CatalogCategoryEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 120 }) name!: string;

  @Column({ type: "varchar", length: 140, unique: true }) slug!: string;

  @Column({ type: "text", nullable: true }) description!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => CatalogItemCategoryEntity, (item) => item.category)
  catalogItems!: Relation<CatalogItemCategoryEntity[]>;
}
