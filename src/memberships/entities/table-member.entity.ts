import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
export enum TableMemberStatus {
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  SUSPENDED = "SUSPENDED",
  LEFT = "LEFT",
  REMOVED = "REMOVED",
}
@Entity({ name: "table_members" })
@Unique("UQ_table_members_table_user", ["gameTableId", "userId"])
export class TableMemberEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "game_table_id", type: "uuid" }) gameTableId!: string;
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "joined_via_invitation_id", type: "uuid", nullable: true })
  joinedViaInvitationId!: string | null;
  @Column({
    type: "enum",
    enum: TableMemberStatus,
    enumName: "table_member_status",
    default: TableMemberStatus.ACTIVE,
  })
  status!: TableMemberStatus;
  @Column({ name: "joined_at", type: "timestamptz" }) joinedAt!: Date;
  @Column({ name: "left_at", type: "timestamptz", nullable: true })
  leftAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
