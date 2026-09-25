import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogMetadataAndMedia1720000008000 implements MigrationInterface {
  name = "AddCatalogMetadataAndMedia1720000008000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "media_purpose" ADD VALUE IF NOT EXISTS 'CATALOG_COVER'`,
    );
    await queryRunner.query(
      `ALTER TYPE "media_purpose" ADD VALUE IF NOT EXISTS 'CATALOG_IMAGE'`,
    );
    await queryRunner.query(
      `CREATE TYPE "catalog_item_media_kind" AS ENUM('COVER','IMAGE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "slug" varchar(140) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_categories_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_categories_name" ON "catalog_categories" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(80) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_tags_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_tags_name" ON "catalog_tags" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_categories" (
        "catalog_item_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_categories" PRIMARY KEY ("catalog_item_id", "category_id"),
        CONSTRAINT "FK_catalog_item_categories_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_categories_category" FOREIGN KEY ("category_id")
          REFERENCES "catalog_categories"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_categories_category_id" ON "catalog_item_categories" ("category_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_tags" (
        "catalog_item_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_tags" PRIMARY KEY ("catalog_item_id", "tag_id"),
        CONSTRAINT "FK_catalog_item_tags_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_tags_tag" FOREIGN KEY ("tag_id")
          REFERENCES "catalog_tags"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_tags_tag_id" ON "catalog_item_tags" ("tag_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_aliases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "catalog_item_id" uuid NOT NULL,
        "alias" varchar(255) NOT NULL,
        "alias_normalized" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_aliases" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_item_aliases_normalized" UNIQUE ("alias_normalized"),
        CONSTRAINT "FK_catalog_item_aliases_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_aliases_item_id" ON "catalog_item_aliases" ("catalog_item_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_sources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "catalog_item_id" uuid NOT NULL,
        "label" varchar(255) NOT NULL,
        "url" varchar(500) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_sources" PRIMARY KEY ("id"),
        CONSTRAINT "FK_catalog_item_sources_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_sources_item_id" ON "catalog_item_sources" ("catalog_item_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_media" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "catalog_item_id" uuid NOT NULL,
        "media_asset_id" uuid NOT NULL,
        "kind" "catalog_item_media_kind" NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_media" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_item_media_asset" UNIQUE ("media_asset_id"),
        CONSTRAINT "CHK_catalog_item_media_position" CHECK ("position" >= 0),
        CONSTRAINT "FK_catalog_item_media_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_media_asset" FOREIGN KEY ("media_asset_id")
          REFERENCES "media_assets"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_catalog_item_media_cover" ON "catalog_item_media" ("catalog_item_id") WHERE "kind" = 'COVER'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_media_item_position" ON "catalog_item_media" ("catalog_item_id", "position")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog_item_media"`);
    await queryRunner.query(`DROP TABLE "catalog_item_sources"`);
    await queryRunner.query(`DROP TABLE "catalog_item_aliases"`);
    await queryRunner.query(`DROP TABLE "catalog_item_tags"`);
    await queryRunner.query(`DROP TABLE "catalog_item_categories"`);
    await queryRunner.query(`DROP TABLE "catalog_tags"`);
    await queryRunner.query(`DROP TABLE "catalog_categories"`);
    await queryRunner.query(`DROP TYPE "catalog_item_media_kind"`);
    await queryRunner.query(
      `DELETE FROM "media_assets" WHERE "purpose" IN ('CATALOG_COVER', 'CATALOG_IMAGE')`,
    );
    await queryRunner.query(
      `ALTER TYPE "media_purpose" RENAME TO "media_purpose_with_catalog"`,
    );
    await queryRunner.query(
      `CREATE TYPE "media_purpose" AS ENUM('USER_AVATAR','TABLE_COVER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ALTER COLUMN "purpose" TYPE "media_purpose" USING "purpose"::text::"media_purpose"`,
    );
    await queryRunner.query(`DROP TYPE "media_purpose_with_catalog"`);
  }
}
