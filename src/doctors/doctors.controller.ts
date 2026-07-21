import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../users/user.entity';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findDoctors();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getCurrentDoctor(@CurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'patient')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    return user?.role === 'doctor' ? user : null;
  }
}
