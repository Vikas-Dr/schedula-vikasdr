import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdvancedSchedulingAndAppointments1784900000000
  implements MigrationInterface
{
  name = 'AdvancedSchedulingAndAppointments1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD COLUMN IF NOT EXISTS "scheduling_type" character varying NOT NULL DEFAULT 'STREAM'`,
    );

    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" ADD COLUMN IF NOT EXISTS "scheduling_type" character varying NOT NULL DEFAULT 'STREAM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" ADD COLUMN IF NOT EXISTS "slot_duration" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" ADD COLUMN IF NOT EXISTS "buffer_time" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" ADD COLUMN IF NOT EXISTS "max_capacity" integer DEFAULT 1`,
    );

    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" ADD COLUMN IF NOT EXISTS "scheduling_type" character varying NOT NULL DEFAULT 'STREAM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" ADD COLUMN IF NOT EXISTS "slot_duration" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" ADD COLUMN IF NOT EXISTS "buffer_time" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" ADD COLUMN IF NOT EXISTS "max_capacity" integer DEFAULT 1`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" character varying NOT NULL,
        "start_time" character varying NOT NULL,
        "end_time" character varying NOT NULL,
        "scheduling_type" character varying NOT NULL DEFAULT 'STREAM',
        "token_number" integer,
        "status" character varying NOT NULL DEFAULT 'CONFIRMED',
        "reason" character varying,
        "availability_id" character varying,
        "doctorId" uuid,
        "patientId" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" DROP COLUMN "max_capacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" DROP COLUMN "buffer_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" DROP COLUMN "slot_duration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" DROP COLUMN "scheduling_type"`,
    );

    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" DROP COLUMN "max_capacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" DROP COLUMN "buffer_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" DROP COLUMN "slot_duration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" DROP COLUMN "scheduling_type"`,
    );

    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP COLUMN "scheduling_type"`,
    );
  }
}
