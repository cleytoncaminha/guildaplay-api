import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { CatalogEditionEntity } from "./catalog-edition.entity";
import { RpgSystemEntity } from "./rpg-system.entity";

@Entity({ name: "publishers" })
export class PublisherEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;

  @Column({ type: "varchar", length: 160 }) name!: string;

  @Column({ type: "varchar", length: 180, unique: true }) slug!: string;

  @Column({ name: "website_url", type: "varchar", length: 500, nullable: true })
  websiteUrl!: string | null;

  @Column({ name: "country_code", type: "varchar", length: 2, nullable: true })
  countryCode!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => RpgSystemEntity, (system) => system.publisher)
  rpgSystems!: RpgSystemEntity[];

  @OneToMany(() => CatalogEditionEntity, (edition) => edition.publisher)
  catalogEditions!: CatalogEditionEntity[];
}
