import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, DoctorProfile, PatientProfile])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
