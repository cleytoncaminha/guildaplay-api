import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogFeaturedListsAndHardening1720000016000 implements MigrationInterface {
  name = "AddCatalogFeaturedListsAndHardening1720000016000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "catalog_featured_lists" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(160) NOT NULL,
        "slug" varchar(180) NOT NULL,
        "description" text,
        "curated_by_user_id" uuid NOT NULL,
        "status" "catalog_status" NOT NULL DEFAULT 'DRAFT',
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_featured_lists" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_featured_lists_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_catalog_featured_lists_curator" FOREIGN KEY ("curated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_featured_lists_public" ON "catalog_featured_lists" ("status", "published_at")`,
    );
    await q.query(`
      CREATE TABLE "catalog_featured_list_items" (
        "featured_list_id" uuid NOT NULL,
        "catalog_item_id" uuid NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_featured_list_items" PRIMARY KEY ("featured_list_id", "catalog_item_id"),
        CONSTRAINT "CHK_catalog_featured_list_items_position" CHECK ("position" >= 0),
        CONSTRAINT "FK_catalog_featured_list_items_list" FOREIGN KEY ("featured_list_id") REFERENCES "catalog_featured_lists"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_catalog_featured_list_items_item" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_featured_list_items_position" ON "catalog_featured_list_items" ("featured_list_id", "position")`,
    );

    await q.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_items_public_title" ON "catalog_items" ("status", "title", "id")`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_items_public_filters" ON "catalog_items" ("status", "type", "experience_level", "original_release_year")`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_items_title_trgm" ON "catalog_items" USING gin ("title" gin_trgm_ops)`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_item_aliases_normalized_trgm" ON "catalog_item_aliases" USING gin ("alias_normalized" gin_trgm_ops)`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_item_systems_system_item" ON "catalog_item_systems" ("rpg_system_id", "catalog_item_id")`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_editions_filters" ON "catalog_editions" ("language_code", "publisher_id", "catalog_item_id")`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_submissions_pending" ON "catalog_submissions" ("status", "created_at")`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_submissions_pending"`,
    );
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_editions_filters"`,
    );
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_item_systems_system_item"`,
    );
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_item_aliases_normalized_trgm"`,
    );
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_items_title_trgm"`,
    );
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_items_public_filters"`,
    );
    await q.query(
      `DROP INDEX IF EXISTS "public"."IDX_catalog_items_public_title"`,
    );
    await q.query(
      `DROP INDEX "public"."IDX_catalog_featured_list_items_position"`,
    );
    await q.query(`DROP TABLE "catalog_featured_list_items"`);
    await q.query(`DROP INDEX "public"."IDX_catalog_featured_lists_public"`);
    await q.query(`DROP TABLE "catalog_featured_lists"`);
  }
}
