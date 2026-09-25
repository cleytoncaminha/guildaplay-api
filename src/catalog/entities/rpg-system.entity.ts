import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogStatus } from "../enums/catalog.enums.js";
import { CatalogItemSystemEntity } from "./catalog-item-system.entity.js";
import { PublisherEntity } from "./publisher.entity.js";

@Entity({ name: "rpg_systems" })
export class RpgSystemEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 160 }) name!: string;

  @Column({ type: "varchar", length: 180, unique: true }) slug!: string;

  @Column({ type: "text", nullable: true }) description!: string | null;

  @Column({ name: "publisher_id", type: "uuid", nullable: true })
  publisherId!: string | null;

  @Column({ name: "release_year", type: "smallint", nullable: true })
  releaseYear!: number | null;

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

  @ManyToOne(() => PublisherEntity, (publisher) => publisher.rpgSystems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "publisher_id" })
  publisher!: Relation<PublisherEntity> | null;

  @OneToMany(
    () => CatalogItemSystemEntity,
    (itemSystem) => itemSystem.rpgSystem,
  )
  catalogItems!: Relation<CatalogItemSystemEntity[]>;
}
