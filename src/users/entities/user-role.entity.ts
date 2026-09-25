import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { UserEntity } from "./user.entity";

export enum UserRole {
  USER = "USER",
  GM = "GM",
  ADMIN = "ADMIN",
}

@Entity({ name: "user_roles" })
export class UserRoleEntity {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @PrimaryColumn({
    name: "role",
    type: "enum",
    enum: UserRole,
    enumName: "user_role",
  })
  role!: UserRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.roles, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: Relation<UserEntity>;
}
