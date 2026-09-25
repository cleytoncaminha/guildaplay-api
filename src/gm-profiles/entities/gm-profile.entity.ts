import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { UserEntity } from "../../users/entities/user.entity";

export enum GmProfileStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

@Entity({ name: "gm_profiles" })
@Unique("UQ_gm_profiles_user_id", ["userId"])
export class GmProfileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "display_name", type: "varchar", length: 120 })
  displayName!: string;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({
    type: "enum",
    enum: GmProfileStatus,
    enumName: "gm_profile_status",
    default: GmProfileStatus.PENDING,
  })
  status!: GmProfileStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: UserEntity;
}
