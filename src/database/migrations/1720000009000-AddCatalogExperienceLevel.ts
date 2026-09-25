import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogExperienceLevel1720000009000 implements MigrationInterface {
  name = "AddCatalogExperienceLevel1720000009000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "catalog_experience_level" AS ENUM('BEGINNER','INTERMEDIATE','ADVANCED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalog_items" ADD "experience_level" "catalog_experience_level"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_catalog_items_experience_level" ON "catalog_items" ("experience_level")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_catalog_items_experience_level"`);
    await queryRunner.query(
      `ALTER TABLE "catalog_items" DROP COLUMN "experience_level"`,
    );
    await queryRunner.query(`DROP TYPE "catalog_experience_level"`);
  }
}
