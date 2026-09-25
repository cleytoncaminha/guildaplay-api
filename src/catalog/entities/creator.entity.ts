import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemCreatorEntity } from "./catalog-item-creator.entity.js";

@Entity({ name: "creators" })
export class CreatorEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 160 }) name!: string;

  @Column({ type: "varchar", length: 180, unique: true }) slug!: string;

  @Column({ name: "website_url", type: "varchar", length: 500, nullable: true })
  websiteUrl!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(
    () => CatalogItemCreatorEntity,
    (itemCreator) => itemCreator.creator,
  )
  catalogItems!: Relation<CatalogItemCreatorEntity[]>;
}
