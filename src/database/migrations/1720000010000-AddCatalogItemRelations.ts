import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogItemRelations1720000010000 implements MigrationInterface {
  name = "AddCatalogItemRelations1720000010000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "catalog_item_relation_type" AS ENUM('REQUIRES','SUPPLEMENT_OF','ADVENTURE_FOR','SETTING_FOR','EDITION_OF','EXPANSION_OF','COMPATIBLE_WITH')`,
    );
    await queryRunner.query(`
      CREATE TABLE "catalog_item_relations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "source_item_id" uuid NOT NULL,
        "target_item_id" uuid NOT NULL,
        "type" "catalog_item_relation_type" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_relations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_catalog_item_relations_source_target_type"
          UNIQUE ("source_item_id", "target_item_id", "type"),
        CONSTRAINT "CHK_catalog_item_relations_not_self"
          CHECK ("source_item_id" <> "target_item_id"),
        CONSTRAINT "FK_catalog_item_relations_source" FOREIGN KEY ("source_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_catalog_item_relations_target" FOREIGN KEY ("target_item_id")
          REFERENCES "catalog_items"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_relations_source" ON "catalog_item_relations" ("source_item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_item_relations_target" ON "catalog_item_relations" ("target_item_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog_item_relations"`);
    await queryRunner.query(`DROP TYPE "catalog_item_relation_type"`);
  }
}
