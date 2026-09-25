import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogReports1720000013000 implements MigrationInterface {
  name = "AddCatalogReports1720000013000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "catalog_report_target_type" AS ENUM ('ITEM', 'MEDIA')`,
    );
    await q.query(
      `CREATE TYPE "catalog_report_reason" AS ENUM ('DUPLICATE', 'INACCURATE', 'COPYRIGHT', 'INAPPROPRIATE', 'OTHER')`,
    );
    await q.query(
      `CREATE TYPE "catalog_report_status" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED')`,
    );
    await q.query(`
      CREATE TABLE "catalog_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reported_by_user_id" uuid NOT NULL,
        "target_type" "catalog_report_target_type" NOT NULL,
        "catalog_item_id" uuid,
        "media_asset_id" uuid,
        "reason" "catalog_report_reason" NOT NULL,
        "duplicate_of_catalog_item_id" uuid,
        "description" varchar(1000) NOT NULL,
        "status" "catalog_report_status" NOT NULL DEFAULT 'PENDING',
        "resolved_by_user_id" uuid,
        "resolution_note" varchar(1000),
        "resolved_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_reports" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_catalog_reports_target" CHECK (("target_type" = 'ITEM' AND "catalog_item_id" IS NOT NULL AND "media_asset_id" IS NULL) OR ("target_type" = 'MEDIA' AND "media_asset_id" IS NOT NULL AND "catalog_item_id" IS NULL)),
        CONSTRAINT "FK_catalog_reports_reporter" FOREIGN KEY ("reported_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_reports_item" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_reports_media" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_reports_duplicate_item" FOREIGN KEY ("duplicate_of_catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_reports_resolver" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_reports_pending" ON "catalog_reports" ("status", "created_at")`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "public"."IDX_catalog_reports_pending"`);
    await q.query(`DROP TABLE "catalog_reports"`);
    await q.query(`DROP TYPE "catalog_report_status"`);
    await q.query(`DROP TYPE "catalog_report_reason"`);
    await q.query(`DROP TYPE "catalog_report_target_type"`);
  }
}
