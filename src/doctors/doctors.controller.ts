import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../users/users.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findDoctors();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'patient')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  async getCurrentDoctor(@Param() params, @Param('id') id: string) {
    // The doctor is already identified in the request, and user details are attached by JwtStrategy.
    return { message: 'Use /patients/me or /doctors to fetch public doctor data.' };
  }
}
