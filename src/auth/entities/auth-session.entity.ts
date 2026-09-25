import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { UserEntity } from "../../users/entities/user.entity.js";

@Entity({ name: "auth_sessions" })
@Index("IDX_auth_sessions_user_id", ["userId"])
@Index("IDX_auth_sessions_token_family_id", ["tokenFamilyId"])
@Index("IDX_auth_sessions_expires_at", ["expiresAt"])
export class AuthSessionEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "refresh_token_hash", type: "varchar", length: 255 })
  refreshTokenHash!: string;

  @Column({ name: "token_family_id", type: "uuid" })
  tokenFamilyId!: string;

  @Column({ name: "user_agent", type: "varchar", length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: "ip_address", type: "inet", nullable: true })
  ipAddress!: string | null;

  @Column({ name: "last_used_at", type: "timestamptz" })
  lastUsedAt!: Date;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.sessions, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: Relation<UserEntity>;
}
