import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';
import { RecurringAvailability } from '../doctors/entities/recurring-availability.entity';
import { CustomAvailability } from '../doctors/entities/custom-availability.entity';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'schedula',
  entities: [
    User,
    DoctorProfile,
    PatientProfile,
    RecurringAvailability,
    CustomAvailability,
  ],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
