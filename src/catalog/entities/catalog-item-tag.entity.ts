import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemEntity } from "./catalog-item.entity";
import { CatalogTagEntity } from "./catalog-tag.entity";

@Entity({ name: "catalog_item_tags" })
export class CatalogItemTagEntity {
  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @PrimaryColumn({ name: "tag_id", type: "uuid" }) tagId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.tags, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => CatalogTagEntity, (tag) => tag.catalogItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "tag_id" })
  tag!: Relation<CatalogTagEntity>;
}
