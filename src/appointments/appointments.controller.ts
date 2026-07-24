import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  bookAppointment(
    @CurrentUser() user: User,
    @Body() dto: BookAppointmentDto,
  ) {
    return this.appointmentsService.bookAppointment(user.id, dto);
  }

  @Get('patient')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  getPatientAppointments(@CurrentUser() user: User) {
    return this.appointmentsService.getPatientAppointments(user.id);
  }

  @Get('doctor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  getDoctorAppointments(@CurrentUser() user: User) {
    return this.appointmentsService.getDoctorAppointments(user.id);
  }
}
