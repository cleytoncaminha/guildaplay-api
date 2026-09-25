import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemRelationType } from "../enums/catalog.enums.js";
import { CatalogItemEntity } from "./catalog-item.entity.js";

@Entity({ name: "catalog_item_relations" })
@Unique("UQ_catalog_item_relations_source_target_type", [
  "sourceItemId",
  "targetItemId",
  "type",
])
export class CatalogItemRelationEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "source_item_id", type: "uuid" }) sourceItemId!: string;

  @Column({ name: "target_item_id", type: "uuid" }) targetItemId!: string;

  @Column({
    type: "enum",
    enum: CatalogItemRelationType,
    enumName: "catalog_item_relation_type",
  })
  type!: CatalogItemRelationType;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.outgoingRelations, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "source_item_id" })
  sourceItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => CatalogItemEntity, (item) => item.incomingRelations, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "target_item_id" })
  targetItem!: Relation<CatalogItemEntity>;
}
