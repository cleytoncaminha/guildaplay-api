import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGmProfiles1720000002000 implements MigrationInterface {
  name = "CreateGmProfiles1720000002000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "gm_profile_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "gm_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "display_name" character varying(120) NOT NULL,
        "bio" text,
        "status" "gm_profile_status" NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gm_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_gm_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_gm_profiles_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "gm_profiles"`);
    await queryRunner.query(`DROP TYPE "gm_profile_status"`);
  }
}
