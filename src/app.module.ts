import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { User } from './users/user.entity';
import { DoctorProfile } from './doctors/doctor.entity';
import { PatientProfile } from './patients/patient.entity';
import { Appointment } from './appointments/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => {
        const isTest = process.env.NODE_ENV === 'test';

        // Test: use in-memory SQLite
        if (isTest) {
          return {
            type: 'sqlite',
            database: ':memory:',
            entities: [User, DoctorProfile, PatientProfile, Appointment],
            synchronize: true,
            dropSchema: true,
            autoLoadEntities: true,
            logging: false,
          };
        }

        // Production / staging: prefer DATABASE_URL (Neon / Render) then individual env vars
        if (process.env.DATABASE_URL) {
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }, // Required for Neon & most hosted PG
            entities: [User, DoctorProfile, PatientProfile, Appointment],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: false,
            autoLoadEntities: true,
            logging: false,
          };
        }

        // Explicit postgres env vars (DB_HOST etc.)
        if (process.env.DB_TYPE === 'postgres') {
          return {
            type: 'postgres',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            username: process.env.DB_USER ?? 'postgres',
            password: process.env.DB_PASS ?? 'postgres',
            database: process.env.DB_NAME ?? 'schedula',
            entities: [User, DoctorProfile, PatientProfile, Appointment],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: false,
            autoLoadEntities: true,
            logging: false,
          };
        }

        // Local development fallback: SQLite
        return {
          type: 'sqlite',
          database: process.env.DB_NAME ?? 'schedula.sqlite',
          entities: [User, DoctorProfile, PatientProfile, Appointment],
          synchronize: true,
          autoLoadEntities: true,
          logging: false,
        };
      },
    }),
    UsersModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
