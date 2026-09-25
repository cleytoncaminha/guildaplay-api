import { MigrationInterface, QueryRunner } from "typeorm";
export class CreateMediaAssets1720000005000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "media_purpose" AS ENUM ('USER_AVATAR','TABLE_COVER')`,
    );
    await q.query(
      `CREATE TYPE "media_status" AS ENUM ('PENDING_UPLOAD','ACTIVE','DELETED')`,
    );
    await q.query(
      `CREATE TABLE "media_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_user_id" uuid NOT NULL, "purpose" "media_purpose" NOT NULL, "object_key" varchar(500) NOT NULL, "mime_type" varchar(120) NOT NULL, "size_bytes" bigint NOT NULL, "status" "media_status" NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "deleted_at" timestamptz, CONSTRAINT "UQ_media_assets_object_key" UNIQUE ("object_key"), CONSTRAINT "PK_media_assets" PRIMARY KEY ("id"), CONSTRAINT "FK_media_assets_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await q.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_avatar_asset" FOREIGN KEY ("avatar_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT`,
    );
    await q.query(
      `ALTER TABLE "game_tables" ADD CONSTRAINT "FK_tables_cover_asset" FOREIGN KEY ("cover_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "game_tables" DROP CONSTRAINT "FK_tables_cover_asset"`,
    );
    await q.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_avatar_asset"`,
    );
    await q.query(`DROP TABLE "media_assets"`);
    await q.query(`DROP TYPE "media_status"`);
    await q.query(`DROP TYPE "media_purpose"`);
  }
}
