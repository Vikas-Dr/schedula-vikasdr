import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller()
export class PatientsController {
  @Get('patient/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  getCurrentPatient(@Request() req: any) {
    return req.user;
  }
}
