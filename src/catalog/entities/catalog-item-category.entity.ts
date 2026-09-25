import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { CatalogCategoryEntity } from "./catalog-category.entity";
import { CatalogItemEntity } from "./catalog-item.entity";

@Entity({ name: "catalog_item_categories" })
export class CatalogItemCategoryEntity {
  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @PrimaryColumn({ name: "category_id", type: "uuid" }) categoryId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.categories, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: CatalogItemEntity;

  @ManyToOne(() => CatalogCategoryEntity, (category) => category.catalogItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "category_id" })
  category!: CatalogCategoryEntity;
}
