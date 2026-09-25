import type { MigrationInterface, QueryRunner } from "typeorm";
export class CreateTablesAndBillingPlans1720000003000 implements MigrationInterface {
  name = "CreateTablesAndBillingPlans1720000003000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TYPE "schedule_frequency" AS ENUM('WEEKLY','BIWEEKLY','MONTHLY','CUSTOM')`,
    );
    await q.query(
      `CREATE TYPE "game_table_status" AS ENUM('DRAFT','ACTIVE','PAUSED','ARCHIVED')`,
    );
    await q.query(`CREATE TYPE "billing_interval" AS ENUM('MONTHLY')`);
    await q.query(
      `CREATE TYPE "billing_plan_status" AS ENUM('ACTIVE','ARCHIVED')`,
    );
    await q.query(
      `CREATE TABLE "game_tables" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "gm_profile_id" uuid NOT NULL, "name" varchar(160) NOT NULL, "description" text, "system_name" varchar(120) NOT NULL, "cover_asset_id" uuid, "max_players" smallint NOT NULL CHECK ("max_players" > 0), "schedule_frequency" "schedule_frequency" NOT NULL DEFAULT 'WEEKLY', "weekday" smallint CHECK ("weekday" >= 0 AND "weekday" <= 6), "start_time" time, "timezone" varchar(100) NOT NULL, "status" "game_table_status" NOT NULL DEFAULT 'DRAFT', "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_game_tables" PRIMARY KEY ("id"), CONSTRAINT "FK_game_tables_gm_profile_id" FOREIGN KEY ("gm_profile_id") REFERENCES "gm_profiles"("id") ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX "IDX_game_tables_gm_profile_id" ON "game_tables" ("gm_profile_id")`,
    );
    await q.query(
      `CREATE INDEX "IDX_game_tables_status" ON "game_tables" ("status")`,
    );
    await q.query(
      `CREATE TABLE "billing_plans" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "game_table_id" uuid NOT NULL, "amount_cents" integer NOT NULL CHECK ("amount_cents" > 0), "currency" char(3) NOT NULL DEFAULT 'BRL', "interval" "billing_interval" NOT NULL DEFAULT 'MONTHLY', "platform_fee_bps" integer NOT NULL DEFAULT 800 CHECK ("platform_fee_bps" >= 0 AND "platform_fee_bps" <= 10000), "status" "billing_plan_status" NOT NULL DEFAULT 'ACTIVE', "effective_from" timestamptz NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "archived_at" timestamptz, CONSTRAINT "PK_billing_plans" PRIMARY KEY ("id"), CONSTRAINT "FK_billing_plans_game_table_id" FOREIGN KEY ("game_table_id") REFERENCES "game_tables"("id") ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX "IDX_billing_plans_game_table_id" ON "billing_plans" ("game_table_id")`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "billing_plans"`);
    await q.query(`DROP TABLE "game_tables"`);
    await q.query(`DROP TYPE "billing_plan_status"`);
    await q.query(`DROP TYPE "billing_interval"`);
    await q.query(`DROP TYPE "game_table_status"`);
    await q.query(`DROP TYPE "schedule_frequency"`);
  }
}
