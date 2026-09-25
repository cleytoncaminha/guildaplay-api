import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogSubmissions1720000011000 implements MigrationInterface {
  name = "AddCatalogSubmissions1720000011000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "catalog_submission_type" AS ENUM('CREATE_ITEM','UPDATE_ITEM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "catalog_submission_status" AS ENUM('PENDING','APPROVED','REJECTED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "catalog_submissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "submitted_by_user_id" uuid NOT NULL,
        "catalog_item_id" uuid,
        "type" "catalog_submission_type" NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "catalog_submission_status" NOT NULL DEFAULT 'PENDING',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_submissions" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_catalog_submissions_target" CHECK (
          ("type" = 'CREATE_ITEM' AND "catalog_item_id" IS NULL) OR
          ("type" = 'UPDATE_ITEM' AND "catalog_item_id" IS NOT NULL)
        ),
        CONSTRAINT "FK_catalog_submissions_user" FOREIGN KEY ("submitted_by_user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_submissions_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_submissions_user_status" ON "catalog_submissions" ("submitted_by_user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_submissions_status_created" ON "catalog_submissions" ("status", "created_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog_submissions"`);
    await queryRunner.query(`DROP TYPE "catalog_submission_status"`);
    await queryRunner.query(`DROP TYPE "catalog_submission_type"`);
  }
}
