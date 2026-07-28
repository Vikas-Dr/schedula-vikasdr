import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';
import { RecurringAvailability } from '../doctors/entities/recurring-availability.entity';
import { CustomAvailability } from '../doctors/entities/custom-availability.entity';
import { Appointment } from '../appointments/appointment.entity';
import 'dotenv/config';

const dbType = (process.env.DB_TYPE as 'postgres' | 'sqlite') ?? 'sqlite';

export const AppDataSource = new DataSource(
  dbType === 'postgres'
    ? {
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
          Appointment,
        ],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        synchronize: false,
        logging: false,
      }
    : {
        type: 'sqlite',
        database: process.env.DB_NAME ?? 'schedula.sqlite',
        entities: [
          User,
          DoctorProfile,
          PatientProfile,
          RecurringAvailability,
          CustomAvailability,
          Appointment,
        ],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        synchronize: true,
        logging: false,
      },
);
