import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemEntity } from "./catalog-item.entity";
import { CatalogFeaturedListEntity } from "./catalog-featured-list.entity";

@Entity({ name: "catalog_featured_list_items" })
@Check("CHK_catalog_featured_list_items_position", `"position" >= 0`)
export class CatalogFeaturedListItemEntity {
  @PrimaryColumn({ name: "featured_list_id", type: "uuid" })
  featuredListId!: string;

  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @Column({ type: "integer", default: 0 }) position!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogFeaturedListEntity, (list) => list.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "featured_list_id" })
  list!: Relation<CatalogFeaturedListEntity>;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;
}
