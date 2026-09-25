import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { AuthCredentialEntity } from "../../auth/entities/auth-credential.entity";
import { AuthSessionEntity } from "../../auth/entities/auth-session.entity";
import { EmailVerificationTokenEntity } from "../../auth/entities/email-verification-token.entity";
import { PasswordResetTokenEntity } from "../../auth/entities/password-reset-token.entity";
import { UserRoleEntity } from "./user-role.entity";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

@Entity({ name: "users" })
@Unique("UQ_users_email_normalized", ["emailNormalized"])
export class UserEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id!: string;

  @Column({ name: "name", type: "varchar", length: 120 })
  name!: string;

  @Column({ name: "email", type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "email_normalized", type: "varchar", length: 255 })
  emailNormalized!: string;

  @Column({ name: "email_verified_at", type: "timestamptz", nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: "avatar_asset_id", type: "uuid", nullable: true })
  avatarAssetId!: string | null;

  @Column({ name: "timezone", type: "varchar", length: 100 })
  timezone!: string;

  @Column({ name: "country_code", type: "char", length: 2, nullable: true })
  countryCode!: string | null;

  @Column({
    name: "status",
    type: "enum",
    enum: UserStatus,
    enumName: "user_status",
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  roles!: UserRoleEntity[];

  @OneToOne(() => AuthCredentialEntity, (credential) => credential.user)
  credential!: AuthCredentialEntity | null;

  @OneToMany(() => AuthSessionEntity, (session) => session.user)
  sessions!: AuthSessionEntity[];

  @OneToMany(
    () => EmailVerificationTokenEntity,
    (verificationToken) => verificationToken.user,
  )
  emailVerificationTokens!: EmailVerificationTokenEntity[];

  @OneToMany(
    () => PasswordResetTokenEntity,
    (passwordResetToken) => passwordResetToken.user,
  )
  passwordResetTokens!: PasswordResetTokenEntity[];
}
