import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCapacityAndTypeToAvailability1721689400000 implements MigrationInterface {
  name = 'AddCapacityAndTypeToAvailability1721689400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recurring_availabilities"
      ADD COLUMN IF NOT EXISTS "capacity" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "type" character varying NOT NULL DEFAULT 'recurring';
    `);

    await queryRunner.query(`
      ALTER TABLE "custom_availabilities"
      ADD COLUMN IF NOT EXISTS "capacity" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "type" character varying NOT NULL DEFAULT 'stream';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "custom_availabilities"
      DROP COLUMN IF EXISTS "type",
      DROP COLUMN IF EXISTS "capacity";
    `);

    await queryRunner.query(`
      ALTER TABLE "recurring_availabilities"
      DROP COLUMN IF EXISTS "type",
      DROP COLUMN IF EXISTS "capacity";
    `);
  }
}
