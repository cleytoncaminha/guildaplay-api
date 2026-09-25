import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemEntity } from "./catalog-item.entity";
import { RpgSystemEntity } from "./rpg-system.entity";

@Entity({ name: "catalog_item_systems" })
export class CatalogItemSystemEntity {
  @PrimaryColumn({ name: "catalog_item_id", type: "uuid" })
  catalogItemId!: string;

  @PrimaryColumn({ name: "rpg_system_id", type: "uuid" }) rpgSystemId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.systems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => RpgSystemEntity, (system) => system.catalogItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "rpg_system_id" })
  rpgSystem!: Relation<RpgSystemEntity>;
}
