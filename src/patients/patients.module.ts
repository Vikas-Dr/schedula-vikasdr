import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientProfile } from './patient.entity';
import { User } from '../users/user.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfile, User]), UsersModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
