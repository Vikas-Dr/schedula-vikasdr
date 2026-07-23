import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorAvailability1721689300000 implements MigrationInterface {
  name = 'CreateDoctorAvailability1721689300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recurring_availabilities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "day_of_week" character varying NOT NULL,
        "start_time" character varying NOT NULL,
        "end_time" character varying NOT NULL,
        "doctorId" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recurring_availabilities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recurring_availabilities_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "custom_availabilities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" character varying NOT NULL,
        "start_time" character varying NOT NULL,
        "end_time" character varying NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "doctorId" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_availabilities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_custom_availabilities_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_availabilities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recurring_availabilities"`);
  }
}
