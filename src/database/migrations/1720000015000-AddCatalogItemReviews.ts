import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogItemReviews1720000015000 implements MigrationInterface {
  name = "AddCatalogItemReviews1720000015000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "catalog_review_status" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED')`,
    );
    await q.query(`
      CREATE TABLE "catalog_item_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "catalog_item_id" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "content" text,
        "status" "catalog_review_status" NOT NULL DEFAULT 'PENDING',
        "moderated_by_user_id" uuid,
        "moderation_reason" varchar(1000),
        "moderated_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_item_reviews_user_item" UNIQUE ("user_id", "catalog_item_id"),
        CONSTRAINT "CHK_catalog_item_reviews_rating" CHECK ("rating" BETWEEN 1 AND 10),
        CONSTRAINT "FK_catalog_item_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_reviews_item" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_reviews_moderator" FOREIGN KEY ("moderated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_item_reviews_public" ON "catalog_item_reviews" ("catalog_item_id", "status", "created_at")`,
    );
    await q.query(
      `CREATE INDEX "IDX_catalog_item_reviews_pending" ON "catalog_item_reviews" ("status", "created_at")`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "public"."IDX_catalog_item_reviews_pending"`);
    await q.query(`DROP INDEX "public"."IDX_catalog_item_reviews_public"`);
    await q.query(`DROP TABLE "catalog_item_reviews"`);
    await q.query(`DROP TYPE "catalog_review_status"`);
  }
}
