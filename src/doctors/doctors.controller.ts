import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
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
