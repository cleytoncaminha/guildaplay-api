import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { CatalogItemEntity } from "./catalog-item.entity";
import { PublisherEntity } from "./publisher.entity";

@Entity({ name: "catalog_editions" })
export class CatalogEditionEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ name: "catalog_item_id", type: "uuid" }) catalogItemId!: string;

  @Column({ type: "varchar", length: 255 }) name!: string;

  @Column({ type: "varchar", length: 280, unique: true }) slug!: string;

  @Column({ name: "language_code", type: "varchar", length: 10 })
  languageCode!: string;

  @Column({ name: "publisher_id", type: "uuid", nullable: true })
  publisherId!: string | null;

  @Column({ name: "release_year", type: "smallint", nullable: true })
  releaseYear!: number | null;

  @Column({ name: "isbn_10", type: "varchar", length: 20, nullable: true })
  isbn10!: string | null;

  @Column({ name: "isbn_13", type: "varchar", length: 20, nullable: true })
  isbn13!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => CatalogItemEntity, (item) => item.editions, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "catalog_item_id" })
  catalogItem!: Relation<CatalogItemEntity>;

  @ManyToOne(() => PublisherEntity, (publisher) => publisher.catalogEditions, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "publisher_id" })
  publisher!: Relation<PublisherEntity> | null;
}
