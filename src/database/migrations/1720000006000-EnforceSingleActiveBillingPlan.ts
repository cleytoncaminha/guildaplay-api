import type { MigrationInterface, QueryRunner } from "typeorm";

export class EnforceSingleActiveBillingPlan1720000006000 implements MigrationInterface {
  name = "EnforceSingleActiveBillingPlan1720000006000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_billing_plans_single_active_per_table" ON "billing_plans" ("game_table_id") WHERE "status" = 'ACTIVE'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_billing_plans_single_active_per_table"`,
    );
  }
}
