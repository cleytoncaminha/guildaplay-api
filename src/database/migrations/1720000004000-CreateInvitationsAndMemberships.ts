import type { MigrationInterface, QueryRunner } from "typeorm";
export class CreateInvitationsAndMemberships1720000004000 implements MigrationInterface {
  name = "CreateInvitationsAndMemberships1720000004000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TYPE "invitation_status" AS ENUM('ACTIVE','REVOKED','EXPIRED')`,
    );
    await q.query(
      `CREATE TYPE "table_member_status" AS ENUM('ACTIVE','PAST_DUE','SUSPENDED','LEFT','REMOVED')`,
    );
    await q.query(
      `CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(),"game_table_id" uuid NOT NULL,"created_by_user_id" uuid NOT NULL,"token_hash" varchar(255) NOT NULL,"status" "invitation_status" NOT NULL DEFAULT 'ACTIVE',"max_uses" integer,"uses_count" integer NOT NULL DEFAULT 0,"expires_at" timestamptz,"created_at" timestamptz NOT NULL DEFAULT now(),"revoked_at" timestamptz,CONSTRAINT "PK_invitations" PRIMARY KEY("id"),CONSTRAINT "UQ_invitations_token_hash" UNIQUE("token_hash"),CONSTRAINT "CHK_invitations_max_uses" CHECK("max_uses" IS NULL OR "max_uses">0),CONSTRAINT "FK_invitations_table" FOREIGN KEY("game_table_id") REFERENCES "game_tables"("id") ON DELETE RESTRICT,CONSTRAINT "FK_invitations_creator" FOREIGN KEY("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX "IDX_invitations_table_status" ON "invitations"("game_table_id","status")`,
    );
    await q.query(
      `CREATE TABLE "table_members" ("id" uuid NOT NULL DEFAULT gen_random_uuid(),"game_table_id" uuid NOT NULL,"user_id" uuid NOT NULL,"joined_via_invitation_id" uuid,"status" "table_member_status" NOT NULL DEFAULT 'ACTIVE',"joined_at" timestamptz NOT NULL,"left_at" timestamptz,"created_at" timestamptz NOT NULL DEFAULT now(),"updated_at" timestamptz NOT NULL DEFAULT now(),CONSTRAINT "PK_table_members" PRIMARY KEY("id"),CONSTRAINT "UQ_table_members_table_user" UNIQUE("game_table_id","user_id"),CONSTRAINT "FK_members_table" FOREIGN KEY("game_table_id") REFERENCES "game_tables"("id") ON DELETE RESTRICT,CONSTRAINT "FK_members_user" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,CONSTRAINT "FK_members_invitation" FOREIGN KEY("joined_via_invitation_id") REFERENCES "invitations"("id") ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX "IDX_table_members_table_status" ON "table_members"("game_table_id","status")`,
    );
    await q.query(
      `CREATE INDEX "IDX_table_members_user_status" ON "table_members"("user_id","status")`,
    );
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE "table_members"`);
    await q.query(`DROP TABLE "invitations"`);
    await q.query(`DROP TYPE "table_member_status"`);
    await q.query(`DROP TYPE "invitation_status"`);
  }
}
