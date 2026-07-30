import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../users/user.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

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

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient', 'doctor')
  cancelAppointment(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.appointmentsService.cancelAppointment(user.id, user.role, id);
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  rescheduleAppointment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(user.id, id, dto);
  }
}
