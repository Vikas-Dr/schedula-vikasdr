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
        const dbType = (process.env.DB_TYPE as 'postgres' | 'sqlite') ?? 'sqlite';

        if (dbType === 'postgres' && !isTest) {
          return {
            type: 'postgres',
            database: process.env.DB_NAME ?? 'schedula',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            username: process.env.DB_USER ?? 'postgres',
            password: process.env.DB_PASS ?? 'postgres',
            entities: [User, DoctorProfile, PatientProfile, Appointment],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: false,
            autoLoadEntities: true,
            logging: false,
          };
        }

        return {
          type: 'sqlite',
          database: isTest ? ':memory:' : (process.env.DB_NAME ?? 'schedula.sqlite'),
          entities: [User, DoctorProfile, PatientProfile, Appointment],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: true,
          dropSchema: isTest,
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
