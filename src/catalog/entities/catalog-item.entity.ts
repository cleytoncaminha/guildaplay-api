import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import {
  CatalogExperienceLevel,
  CatalogItemType,
  CatalogStatus,
} from "../enums/catalog.enums.js";
import { CatalogEditionEntity } from "./catalog-edition.entity.js";
import { CatalogItemAliasEntity } from "./catalog-item-alias.entity.js";
import { CatalogItemCategoryEntity } from "./catalog-item-category.entity.js";
import { CatalogItemCreatorEntity } from "./catalog-item-creator.entity.js";
import { CatalogItemMediaEntity } from "./catalog-item-media.entity.js";
import { CatalogItemRelationEntity } from "./catalog-item-relation.entity.js";
import { CatalogItemSourceEntity } from "./catalog-item-source.entity.js";
import { CatalogItemSystemEntity } from "./catalog-item-system.entity.js";
import { CatalogItemTagEntity } from "./catalog-item-tag.entity.js";

@Entity({ name: "catalog_items" })
export class CatalogItemEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({
    type: "enum",
    enum: CatalogItemType,
    enumName: "catalog_item_type",
  })
  type!: CatalogItemType;

  @Column({ type: "varchar", length: 255 }) title!: string;

  @Column({ type: "varchar", length: 280, unique: true }) slug!: string;

  @Column({ type: "text", nullable: true }) summary!: string | null;

  @Column({ type: "text", nullable: true }) description!: string | null;

  @Column({ name: "original_release_year", type: "smallint", nullable: true })
  originalReleaseYear!: number | null;

  @Column({
    name: "experience_level",
    type: "enum",
    enum: CatalogExperienceLevel,
    enumName: "catalog_experience_level",
    nullable: true,
  })
  experienceLevel!: CatalogExperienceLevel | null;

  @Column({
    type: "enum",
    enum: CatalogStatus,
    enumName: "catalog_status",
    default: CatalogStatus.DRAFT,
  })
  status!: CatalogStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => CatalogEditionEntity, (edition) => edition.catalogItem)
  editions!: Relation<CatalogEditionEntity[]>;

  @OneToMany(
    () => CatalogItemSystemEntity,
    (itemSystem) => itemSystem.catalogItem,
  )
  systems!: Relation<CatalogItemSystemEntity[]>;

  @OneToMany(
    () => CatalogItemCreatorEntity,
    (itemCreator) => itemCreator.catalogItem,
  )
  creators!: Relation<CatalogItemCreatorEntity[]>;

  @OneToMany(
    () => CatalogItemCategoryEntity,
    (category) => category.catalogItem,
  )
  categories!: Relation<CatalogItemCategoryEntity[]>;

  @OneToMany(() => CatalogItemTagEntity, (tag) => tag.catalogItem)
  tags!: Relation<CatalogItemTagEntity[]>;

  @OneToMany(() => CatalogItemAliasEntity, (alias) => alias.catalogItem)
  aliases!: Relation<CatalogItemAliasEntity[]>;

  @OneToMany(() => CatalogItemSourceEntity, (source) => source.catalogItem)
  sources!: Relation<CatalogItemSourceEntity[]>;

  @OneToMany(() => CatalogItemMediaEntity, (media) => media.catalogItem)
  media!: Relation<CatalogItemMediaEntity[]>;

  @OneToMany(() => CatalogItemRelationEntity, (relation) => relation.sourceItem)
  outgoingRelations!: Relation<CatalogItemRelationEntity[]>;

  @OneToMany(() => CatalogItemRelationEntity, (relation) => relation.targetItem)
  incomingRelations!: Relation<CatalogItemRelationEntity[]>;
}
