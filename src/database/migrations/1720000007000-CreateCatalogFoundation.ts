import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCatalogFoundation1720000007000 implements MigrationInterface {
  name = "CreateCatalogFoundation1720000007000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "catalog_item_type" AS ENUM('CORE_BOOK','SETTING','ADVENTURE','SUPPLEMENT','TOOL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "catalog_status" AS ENUM('DRAFT','PUBLISHED','ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "creator_role" AS ENUM('AUTHOR','DESIGNER','ILLUSTRATOR','EDITOR','TRANSLATOR','OTHER')`,
    );

    await queryRunner.query(`
      CREATE TABLE "publishers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "slug" varchar(180) NOT NULL,
        "website_url" varchar(500),
        "country_code" varchar(2),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_publishers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_publishers_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_publishers_country_code" CHECK (
          "country_code" IS NULL OR char_length("country_code") = 2
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_publishers_name" ON "publishers" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "creators" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "slug" varchar(180) NOT NULL,
        "website_url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_creators" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_creators_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_creators_name" ON "creators" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "rpg_systems" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "slug" varchar(180) NOT NULL,
        "description" text,
        "publisher_id" uuid,
        "release_year" smallint,
        "status" "catalog_status" NOT NULL DEFAULT 'DRAFT',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rpg_systems" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rpg_systems_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_rpg_systems_release_year" CHECK (
          "release_year" IS NULL OR ("release_year" >= 1900 AND "release_year" <= 2200)
        ),
        CONSTRAINT "FK_rpg_systems_publisher" FOREIGN KEY ("publisher_id")
          REFERENCES "publishers"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_rpg_systems_name" ON "rpg_systems" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rpg_systems_status" ON "rpg_systems" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rpg_systems_publisher_id" ON "rpg_systems" ("publisher_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "catalog_item_type" NOT NULL,
        "title" varchar(255) NOT NULL,
        "slug" varchar(280) NOT NULL,
        "summary" text,
        "description" text,
        "original_release_year" smallint,
        "status" "catalog_status" NOT NULL DEFAULT 'DRAFT',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_items_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_catalog_items_original_release_year" CHECK (
          "original_release_year" IS NULL OR (
            "original_release_year" >= 1900 AND "original_release_year" <= 2200
          )
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_items_type" ON "catalog_items" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_items_status" ON "catalog_items" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_items_title" ON "catalog_items" ("title")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_items_original_release_year" ON "catalog_items" ("original_release_year")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_editions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "catalog_item_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "slug" varchar(280) NOT NULL,
        "language_code" varchar(10) NOT NULL,
        "publisher_id" uuid,
        "release_year" smallint,
        "isbn_10" varchar(20),
        "isbn_13" varchar(20),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_editions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_editions_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_catalog_editions_release_year" CHECK (
          "release_year" IS NULL OR ("release_year" >= 1900 AND "release_year" <= 2200)
        ),
        CONSTRAINT "FK_catalog_editions_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_editions_publisher" FOREIGN KEY ("publisher_id")
          REFERENCES "publishers"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_editions_catalog_item_id" ON "catalog_editions" ("catalog_item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_editions_publisher_id" ON "catalog_editions" ("publisher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_editions_language_code" ON "catalog_editions" ("language_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_editions_release_year" ON "catalog_editions" ("release_year")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_systems" (
        "catalog_item_id" uuid NOT NULL,
        "rpg_system_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_systems" PRIMARY KEY ("catalog_item_id", "rpg_system_id"),
        CONSTRAINT "FK_catalog_item_systems_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_systems_system" FOREIGN KEY ("rpg_system_id")
          REFERENCES "rpg_systems"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_systems_rpg_system_id" ON "catalog_item_systems" ("rpg_system_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "catalog_item_creators" (
        "catalog_item_id" uuid NOT NULL,
        "creator_id" uuid NOT NULL,
        "role" "creator_role" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_creators" PRIMARY KEY ("catalog_item_id", "creator_id", "role"),
        CONSTRAINT "FK_catalog_item_creators_item" FOREIGN KEY ("catalog_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_creators_creator" FOREIGN KEY ("creator_id")
          REFERENCES "creators"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_creators_creator_id" ON "catalog_item_creators" ("creator_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog_item_creators"`);
    await queryRunner.query(`DROP TABLE "catalog_item_systems"`);
    await queryRunner.query(`DROP TABLE "catalog_editions"`);
    await queryRunner.query(`DROP TABLE "catalog_items"`);
    await queryRunner.query(`DROP TABLE "rpg_systems"`);
    await queryRunner.query(`DROP TABLE "creators"`);
    await queryRunner.query(`DROP TABLE "publishers"`);
    await queryRunner.query(`DROP TYPE "creator_role"`);
    await queryRunner.query(`DROP TYPE "catalog_status"`);
    await queryRunner.query(`DROP TYPE "catalog_item_type"`);
  }
}
