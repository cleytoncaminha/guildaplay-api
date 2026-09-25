import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CreatorRole } from "../enums/catalog.enums";
import { CatalogItemEntity } from "./catalog-item.entity";
import { CreatorEntity } from "./creator.entity";

@Entity({ name: "catalog_item_creators" })
export class CatalogItemCreatorEntity {
  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @PrimaryColumn({ name: "creator_id", type: "uuid" }) creatorId!: string;

  @PrimaryColumn({ type: "enum", enum: CreatorRole, enumName: "creator_role" })
  role!: CreatorRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.creators, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => CreatorEntity, (creator) => creator.catalogItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "creator_id" })
  creator!: Relation<CreatorEntity>;
}
