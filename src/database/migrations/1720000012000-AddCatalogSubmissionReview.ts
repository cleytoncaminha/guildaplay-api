import type { MigrationInterface, QueryRunner } from "typeorm";
export class AddCatalogSubmissionReview1720000012000 implements MigrationInterface {
  name = "AddCatalogSubmissionReview1720000012000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "catalog_submissions" ADD "reviewed_by_user_id" uuid`,
    );
    await q.query(
      `ALTER TABLE "catalog_submissions" ADD "review_reason" varchar(1000)`,
    );
    await q.query(
      `ALTER TABLE "catalog_submissions" ADD "reviewed_at" timestamptz`,
    );
    await q.query(
      `ALTER TABLE "catalog_submissions" ADD CONSTRAINT "FK_catalog_submissions_reviewer" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE "catalog_submissions" DROP CONSTRAINT "FK_catalog_submissions_reviewer"`,
    );
    await q.query(
      `ALTER TABLE "catalog_submissions" DROP COLUMN "reviewed_at"`,
    );
    await q.query(
      `ALTER TABLE "catalog_submissions" DROP COLUMN "review_reason"`,
    );
    await q.query(
      `ALTER TABLE "catalog_submissions" DROP COLUMN "reviewed_by_user_id"`,
    );
  }
}
