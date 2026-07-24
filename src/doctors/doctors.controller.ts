import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DoctorsService } from './doctors.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { UpdateRecurringAvailabilityDto } from './dto/update-recurring-availability.dto';
import { CreateCustomOverrideDto } from './dto/create-custom-override.dto';

@Controller()
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('doctors')
  findAll() {
    return this.usersService.findDoctors();
  }

  @Post('doctor/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createDoctorProfile(
    @CurrentUser() user: User,
    @Body() dto: CreateDoctorProfileDto,
  ) {
    return this.doctorsService.createProfile(user.id, dto);
  }

  @Get('doctor/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getCurrentDoctor(@CurrentUser() user: User) {
    return this.doctorsService.getProfile(user.id);
  }

  @Patch('doctor/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  updateDoctorProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.doctorsService.updateProfile(user.id, dto);
  }

  // --- CUSTOM OVERRIDE AVAILABILITY ENDPOINTS ---

  @Post('doctor/availability/override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createCustomOverride(
    @CurrentUser() user: User,
    @Body() dto: CreateCustomOverrideDto,
  ) {
    return this.doctorsService.createCustomOverride(user.id, dto);
  }

  @Get('doctor/availability/override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getCustomOverrides(@CurrentUser() user: User) {
    return this.doctorsService.getCustomOverrides(user.id);
  }

  @Delete('doctor/availability/override/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  deleteCustomOverride(@CurrentUser() user: User, @Param('id') id: string) {
    return this.doctorsService.deleteCustomOverride(user.id, id);
  }

  // --- EFFECTIVE AVAILABILITY FOR A SPECIFIC DATE ---

  @Get('doctor/availability/date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'patient')
  getAvailabilityForDate(
    @CurrentUser() user: User,
    @Query('date') date: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.doctorsService.getAvailabilityForDate(date, user?.id, doctorId);
  }

  // --- RECURRING AVAILABILITY ENDPOINTS ---

  @Post('doctor/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  createRecurringAvailability(
    @CurrentUser() user: User,
    @Body() dto: CreateRecurringAvailabilityDto,
  ) {
    return this.doctorsService.createRecurringAvailability(user.id, dto);
  }

  @Get('doctor/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'patient')
  getRecurringAvailability(
    @CurrentUser() user: User,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.doctorsService.getRecurringAvailability(user.id, doctorId);
  }

  @Patch('doctor/availability/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  updateRecurringAvailability(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringAvailabilityDto,
  ) {
    return this.doctorsService.updateRecurringAvailability(user.id, id, dto);
  }

  @Delete('doctor/availability/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  deleteRecurringAvailability(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.doctorsService.deleteRecurringAvailability(user.id, id);
  }

  // --- DOCTOR PROFILE BY ID ---

  @Get('doctor/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'patient')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user || user.role !== 'doctor') {
      throw new NotFoundException('Doctor not found');
    }
    return user;
  }
}
