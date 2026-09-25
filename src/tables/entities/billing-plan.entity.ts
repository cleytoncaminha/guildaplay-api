import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { GameTableEntity } from "./game-table.entity.js";

export enum BillingInterval {
  MONTHLY = "MONTHLY",
}
export enum BillingPlanStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

@Entity({ name: "billing_plans" })
export class BillingPlanEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "game_table_id", type: "uuid" }) gameTableId!: string;
  @Column({ name: "amount_cents", type: "integer" }) amountCents!: number;
  @Column({ type: "char", length: 3, default: "BRL" }) currency!: string;
  @Column({
    type: "enum",
    enum: BillingInterval,
    enumName: "billing_interval",
    default: BillingInterval.MONTHLY,
  })
  interval!: BillingInterval;
  @Column({ name: "platform_fee_bps", type: "integer", default: 800 })
  platformFeeBps!: number;
  @Column({
    type: "enum",
    enum: BillingPlanStatus,
    enumName: "billing_plan_status",
    default: BillingPlanStatus.ACTIVE,
  })
  status!: BillingPlanStatus;
  @Column({ name: "effective_from", type: "timestamptz" }) effectiveFrom!: Date;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @Column({ name: "archived_at", type: "timestamptz", nullable: true })
  archivedAt!: Date | null;
  @ManyToOne(() => GameTableEntity, (table) => table.billingPlans, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "game_table_id" })
  gameTable!: Relation<GameTableEntity>;
}
