import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PatientsService } from './patients.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Controller()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('patient/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  createPatientProfile(
    @CurrentUser() user: User,
    @Body() dto: CreatePatientProfileDto,
  ) {
    return this.patientsService.createProfile(user.id, dto);
  }

  @Get('patient/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  getCurrentPatient(@CurrentUser() user: User) {
    return this.patientsService.getProfile(user.id);
  }

  @Patch('patient/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  updatePatientProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.patientsService.updateProfile(user.id, dto);
  }
}
