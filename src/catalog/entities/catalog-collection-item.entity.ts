import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Column } from "typeorm";

import { CatalogItemEntity } from "./catalog-item.entity";
import { CatalogCollectionEntity } from "./catalog-collection.entity";

@Entity({ name: "catalog_collection_items" })
export class CatalogCollectionItemEntity {
  @PrimaryColumn({ name: "collection_id", type: "uuid" }) collectionId!: string;

  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @Column({ type: "integer", default: 0 }) position!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogCollectionEntity, (collection) => collection.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "collection_id" })
  collection!: Relation<CatalogCollectionEntity>;

  @ManyToOne(() => CatalogItemEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;
}
