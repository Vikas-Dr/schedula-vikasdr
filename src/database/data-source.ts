import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';
import { RecurringAvailability } from '../doctors/entities/recurring-availability.entity';
import { CustomAvailability } from '../doctors/entities/custom-availability.entity';
import { Appointment } from '../appointments/appointment.entity';
import 'dotenv/config';

const entities = [
  User,
  DoctorProfile,
  PatientProfile,
  RecurringAvailability,
  CustomAvailability,
  Appointment,
];

const migrations = [__dirname + '/../migrations/*{.ts,.js}'];

// Support DATABASE_URL (Neon / Render) or individual env vars
export const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      entities,
      migrations,
      synchronize: false,
      logging: false,
    })
  : process.env.DB_TYPE === 'postgres'
    ? new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASS ?? 'postgres',
        database: process.env.DB_NAME ?? 'schedula',
        entities,
        migrations,
        synchronize: false,
        logging: false,
      })
    : new DataSource({
        type: 'sqlite',
        database: process.env.DB_NAME ?? 'schedula.sqlite',
        entities,
        migrations,
        synchronize: true,
        logging: false,
      });
