import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorAndPatientProfiles1721689200000 implements MigrationInterface {
  name = 'CreateDoctorAndPatientProfiles1721689200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "name" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'patient',
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doctor_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "specialization" character varying,
        "bio" character varying,
        "qualification" character varying,
        "years_of_experience" character varying,
        "is_verified" boolean NOT NULL DEFAULT false,
        "userId" uuid,
        CONSTRAINT "UQ_doctor_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_doctor_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctor_profiles_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "birthday" character varying,
        "age" integer,
        "gender" character varying,
        "blood_type" character varying,
        "emergency_contact" character varying,
        "basic_health_info" character varying,
        "userId" uuid,
        CONSTRAINT "UQ_patient_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_patient_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patient_profiles_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patient_profiles"`);
    await queryRunner.query(`DROP TABLE "doctor_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
