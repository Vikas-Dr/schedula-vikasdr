import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { User } from './users/user.entity';
import { DoctorProfile } from './doctors/doctor.entity';
import { PatientProfile } from './patients/patient.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isTest = process.env.NODE_ENV === 'test';
        return {
          type: isTest ? 'sqlite' : 'postgres',
          database: isTest ? ':memory:' : (process.env.DB_NAME ?? 'schedula'),
          host: isTest ? undefined : (process.env.DB_HOST ?? 'localhost'),
          port: isTest
            ? undefined
            : parseInt(process.env.DB_PORT ?? '5432', 10),
          username: isTest ? undefined : (process.env.DB_USER ?? 'postgres'),
          password: isTest ? undefined : (process.env.DB_PASS ?? 'postgres'),
          entities: [User, DoctorProfile, PatientProfile],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: isTest ? true : false,
          dropSchema: isTest,
          autoLoadEntities: true,
          logging: false,
        } as any;
      },
    }),
    UsersModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
