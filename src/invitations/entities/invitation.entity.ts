import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
export enum InvitationStatus {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}
@Entity({ name: "invitations" })
export class InvitationEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "game_table_id", type: "uuid" }) gameTableId!: string;
  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;
  @Column({ name: "token_hash", type: "varchar", length: 255, unique: true })
  tokenHash!: string;
  @Column({
    type: "enum",
    enum: InvitationStatus,
    enumName: "invitation_status",
    default: InvitationStatus.ACTIVE,
  })
  status!: InvitationStatus;
  @Column({ name: "max_uses", type: "integer", nullable: true }) maxUses!:
    number | null;
  @Column({ name: "uses_count", type: "integer", default: 0 })
  usesCount!: number;
  @Column({ name: "expires_at", type: "timestamptz", nullable: true })
  expiresAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;
}
