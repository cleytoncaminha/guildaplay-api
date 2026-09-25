import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogPersonalLists1720000014000 implements MigrationInterface {
  name = "AddCatalogPersonalLists1720000014000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "catalog_user_items" (
        "user_id" uuid NOT NULL,
        "catalog_item_id" uuid NOT NULL,
        "has_item" boolean NOT NULL DEFAULT false,
        "wants_item" boolean NOT NULL DEFAULT false,
        "played_item" boolean NOT NULL DEFAULT false,
        "is_favorite" boolean NOT NULL DEFAULT false,
        "private_comment" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_user_items" PRIMARY KEY ("user_id", "catalog_item_id"),
        CONSTRAINT "FK_catalog_user_items_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_user_items_item" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_user_items_lists" ON "catalog_user_items" ("user_id", "has_item", "wants_item", "played_item", "is_favorite")`,
    );
    await q.query(`
      CREATE TABLE "catalog_collections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "owner_user_id" uuid NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" varchar(1000),
        "is_public" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_collections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_catalog_collections_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_collections_owner" ON "catalog_collections" ("owner_user_id", "updated_at")`,
    );
    await q.query(
      `CREATE INDEX "IDX_catalog_collections_public" ON "catalog_collections" ("is_public", "updated_at")`,
    );
    await q.query(`
      CREATE TABLE "catalog_collection_items" (
        "collection_id" uuid NOT NULL,
        "catalog_item_id" uuid NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_collection_items" PRIMARY KEY ("collection_id", "catalog_item_id"),
        CONSTRAINT "FK_catalog_collection_items_collection" FOREIGN KEY ("collection_id") REFERENCES "catalog_collections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_catalog_collection_items_item" FOREIGN KEY ("catalog_item_id") REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await q.query(
      `CREATE INDEX "IDX_catalog_collection_items_position" ON "catalog_collection_items" ("collection_id", "position")`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `DROP INDEX "public"."IDX_catalog_collection_items_position"`,
    );
    await q.query(`DROP TABLE "catalog_collection_items"`);
    await q.query(`DROP INDEX "public"."IDX_catalog_collections_public"`);
    await q.query(`DROP INDEX "public"."IDX_catalog_collections_owner"`);
    await q.query(`DROP TABLE "catalog_collections"`);
    await q.query(`DROP INDEX "public"."IDX_catalog_user_items_lists"`);
    await q.query(`DROP TABLE "catalog_user_items"`);
  }
}
