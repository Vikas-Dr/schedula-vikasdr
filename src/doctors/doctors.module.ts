import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DoctorsController } from './doctors.controller';

@Module({
  imports: [UsersModule],
  controllers: [DoctorsController],
})
export class DoctorsModule {}
