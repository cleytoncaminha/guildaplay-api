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

import { GmProfileEntity } from "../../gm-profiles/entities/gm-profile.entity.js";
import { BillingPlanEntity } from "./billing-plan.entity.js";

export enum GameTableStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ARCHIVED = "ARCHIVED",
}

export enum ScheduleFrequency {
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}

@Entity({ name: "game_tables" })
export class GameTableEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "gm_profile_id", type: "uuid" }) gmProfileId!: string;
  @Column({ name: "name", type: "varchar", length: 160 }) name!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ name: "system_name", type: "varchar", length: 120 })
  systemName!: string;
  @Column({ name: "cover_asset_id", type: "uuid", nullable: true })
  coverAssetId!: string | null;
  @Column({ name: "max_players", type: "smallint" }) maxPlayers!: number;
  @Column({
    name: "schedule_frequency",
    type: "enum",
    enum: ScheduleFrequency,
    enumName: "schedule_frequency",
    default: ScheduleFrequency.WEEKLY,
  })
  scheduleFrequency!: ScheduleFrequency;
  @Column({ type: "smallint", nullable: true }) weekday!: number | null;
  @Column({ name: "start_time", type: "time", nullable: true }) startTime!:
    string | null;
  @Column({ type: "varchar", length: 100 }) timezone!: string;
  @Column({
    type: "enum",
    enum: GameTableStatus,
    enumName: "game_table_status",
    default: GameTableStatus.DRAFT,
  })
  status!: GameTableStatus;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
  @ManyToOne(() => GmProfileEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "gm_profile_id" })
  gmProfile!: Relation<GmProfileEntity>;
  @OneToMany(() => BillingPlanEntity, (plan) => plan.gameTable)
  billingPlans!: Relation<BillingPlanEntity[]>;
}
