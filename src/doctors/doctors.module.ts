import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfile } from './doctor.entity';
import { User } from '../users/user.entity';
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { UsersModule } from '../users/users.module';

import { Appointment } from '../appointments/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorProfile,
      User,
      RecurringAvailability,
      CustomAvailability,
      Appointment,
    ]),
    UsersModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
