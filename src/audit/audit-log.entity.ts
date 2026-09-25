import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { UserEntity } from "../users/entities/user.entity.js";
@Entity({ name: "audit_logs" })
export class AuditLogEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "actor_user_id", type: "uuid", nullable: true })
  actorUserId!: string | null;
  @Column({ name: "event_type", type: "varchar", length: 100 })
  eventType!: string;
  @Column({ type: "jsonb", nullable: true }) metadata!: Record<
    string,
    unknown
  > | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "actor_user_id" })
  user!: Relation<UserEntity> | null;
}
