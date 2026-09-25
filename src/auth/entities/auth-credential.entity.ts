import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";

import { UserEntity } from "../../users/entities/user.entity.js";

@Entity({ name: "auth_credentials" })
export class AuthCredentialEntity {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "password_changed_at", type: "timestamptz" })
  passwordChangedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => UserEntity, (user) => user.credential, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: Relation<UserEntity>;
}
