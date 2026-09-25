import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthAuditLogs1720000001000 implements MigrationInterface {
  name = "AddAuthAuditLogs1720000001000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "actor_user_id" uuid, "event_type" character varying(100) NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"), CONSTRAINT "FK_audit_logs_actor_user_id" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE INDEX "IDX_audit_logs_actor_user_id" ON "audit_logs" ("actor_user_id")`,
    );
    await q.query(
      `CREATE INDEX "IDX_audit_logs_event_type" ON "audit_logs" ("event_type")`,
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "audit_logs"`);
  }
}
