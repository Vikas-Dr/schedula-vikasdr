import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';
import { RecurringAvailability } from '../doctors/entities/recurring-availability.entity';
import { CustomAvailability } from '../doctors/entities/custom-availability.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import {
  getDayOfWeekFromDate,
  isOverlapping,
  normalizeTimeString,
  validateAndFormatDate,
} from '../doctors/utils/time-parser.util';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepository: Repository<DoctorProfile>,
    @InjectRepository(PatientProfile)
    private readonly patientRepository: Repository<PatientProfile>,
    @InjectRepository(RecurringAvailability)
    private readonly recurringRepository: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private readonly customRepository: Repository<CustomAvailability>,
  ) {}

  async bookAppointment(userId: string, dto: BookAppointmentDto) {
    const patientProfile = await this.getPatientProfileByUserId(userId);
    const date = validateAndFormatDate(dto.date);

    // Prevent booking in past dates (compared to YYYY-MM-DD UTC)
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      throw new BadRequestException(
        `Cannot book appointment for a past date: ${date}`,
      );
    }

    const doctorProfile = await this.getDoctorProfileById(dto.doctorId);

    // Get doctor availability for date
    const dayOfWeek = getDayOfWeekFromDate(date);
    const customOverrides = await this.customRepository.find({
      where: { doctor: { id: doctorProfile.id }, date, isAvailable: true },
    });

    let activeAvailabilities: {
      id: string;
      startTime: string;
      endTime: string;
      schedulingType: 'STREAM' | 'WAVE';
      maxCapacity: number;
      slotDuration?: number;
      bufferTime?: number;
    }[] = [];

    if (customOverrides.length > 0) {
      activeAvailabilities = customOverrides.map((c) => ({
        id: c.id,
        startTime: c.startTime,
        endTime: c.endTime,
        schedulingType: c.schedulingType ?? doctorProfile.schedulingType ?? 'STREAM',
        maxCapacity: c.maxCapacity ?? c.capacity ?? 1,
        slotDuration: c.slotDuration,
        bufferTime: c.bufferTime,
      }));
    } else {
      const recurring = await this.recurringRepository.find({
        where: { doctor: { id: doctorProfile.id }, dayOfWeek },
      });
      activeAvailabilities = recurring.map((r) => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        schedulingType: r.schedulingType ?? doctorProfile.schedulingType ?? 'STREAM',
        maxCapacity: r.maxCapacity ?? r.capacity ?? 1,
        slotDuration: r.slotDuration,
        bufferTime: r.bufferTime,
      }));
    }

    if (activeAvailabilities.length === 0) {
      throw new BadRequestException(
        `Doctor is not available on ${date} (${dayOfWeek}).`,
      );
    }

    // Determine target availability window
    let matchingWindow = activeAvailabilities[0];
    if (dto.availabilityId) {
      const found = activeAvailabilities.find((a) => a.id === dto.availabilityId);
      if (found) matchingWindow = found;
    } else if (dto.startTime && dto.endTime) {
      const normStart = normalizeTimeString(dto.startTime);
      const normEnd = normalizeTimeString(dto.endTime);
      const found = activeAvailabilities.find((a) =>
        isOverlapping(a.startTime, a.endTime, normStart, normEnd),
      );
      if (found) matchingWindow = found;
    }

    const effectiveSchedulingType =
      dto.schedulingType ??
      matchingWindow.schedulingType ??
      doctorProfile.schedulingType ??
      'STREAM';

    if (effectiveSchedulingType === 'STREAM') {
      return this.bookStreamAppointment(
        doctorProfile,
        patientProfile,
        date,
        dto,
        matchingWindow,
      );
    } else if (effectiveSchedulingType === 'WAVE') {
      return this.bookWaveAppointment(
        doctorProfile,
        patientProfile,
        date,
        dto,
        matchingWindow,
      );
    } else {
      throw new BadRequestException(
        `Invalid scheduling type: "${effectiveSchedulingType}". Expected STREAM or WAVE.`,
      );
    }
  }

  private async bookStreamAppointment(
    doctor: DoctorProfile,
    patient: PatientProfile,
    date: string,
    dto: BookAppointmentDto,
    window: { startTime: string; endTime: string; id: string },
  ) {
    if (!dto.startTime || !dto.endTime) {
      throw new BadRequestException(
        'startTime and endTime are required for Stream appointment booking.',
      );
    }

    const startTime = normalizeTimeString(dto.startTime);
    const endTime = normalizeTimeString(dto.endTime);

    // Validate that slot is within window
    if (!isOverlapping(window.startTime, window.endTime, startTime, endTime)) {
      throw new BadRequestException(
        `Slot ${startTime} - ${endTime} is outside doctor's available window (${window.startTime} - ${window.endTime}).`,
      );
    }

    // Check if slot is already booked by anyone
    const existingBooking = await this.appointmentRepository.findOne({
      where: {
        doctor: { id: doctor.id },
        date,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        `Slot ${startTime} - ${endTime} on ${date} is already booked.`,
      );
    }

    // Check if THIS patient has already booked this same slot / doctor on this date
    const patientDuplicate = await this.appointmentRepository.findOne({
      where: {
        patient: { id: patient.id },
        date,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
    });

    if (patientDuplicate) {
      throw new ConflictException(
        `Duplicate booking: Patient already has an appointment at ${startTime} on ${date}.`,
      );
    }

    const appointment = this.appointmentRepository.create({
      date,
      startTime,
      endTime,
      schedulingType: 'STREAM',
      status: 'CONFIRMED',
      reason: dto.reason,
      availabilityId: window.id,
      doctor,
      patient,
    });

    const saved = await this.appointmentRepository.save(appointment);

    return {
      id: saved.id,
      date: saved.date,
      startTime: saved.startTime,
      endTime: saved.endTime,
      appointmentTime: `${saved.startTime} - ${saved.endTime}`,
      schedulingType: 'STREAM',
      status: saved.status,
      reason: saved.reason,
      doctor: {
        id: doctor.id,
        name: doctor.user?.name,
        specialization: doctor.specialization,
      },
      patient: {
        id: patient.id,
        name: patient.user?.name,
      },
    };
  }

  private async bookWaveAppointment(
    doctor: DoctorProfile,
    patient: PatientProfile,
    date: string,
    dto: BookAppointmentDto,
    window: { startTime: string; endTime: string; maxCapacity: number; id: string },
  ) {
    const startTime = dto.startTime ? normalizeTimeString(dto.startTime) : window.startTime;
    const endTime = dto.endTime ? normalizeTimeString(dto.endTime) : window.endTime;
    const maxCapacity = window.maxCapacity;

    if (maxCapacity <= 0) {
      throw new BadRequestException('Invalid maximum patient capacity.');
    }

    // Check duplicate booking by same patient in this wave window
    const existingPatientBooking = await this.appointmentRepository.findOne({
      where: {
        doctor: { id: doctor.id },
        patient: { id: patient.id },
        date,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
    });

    if (existingPatientBooking) {
      throw new ConflictException(
        `Duplicate booking: Patient is already booked in this wave (${startTime} - ${endTime}) on ${date}.`,
      );
    }

    // Count existing bookings in this wave window for doctor on date
    const currentBookings = await this.appointmentRepository.find({
      where: {
        doctor: { id: doctor.id },
        date,
        startTime,
        endTime,
        status: 'CONFIRMED',
      },
    });

    if (currentBookings.length >= maxCapacity) {
      throw new ConflictException(
        `Wave is full: Maximum patient capacity of ${maxCapacity} reached for window ${startTime} - ${endTime}.`,
      );
    }

    // Assign sequential token number (1st patient -> Token 1, 2nd patient -> Token 2)
    const tokenNumber = currentBookings.length + 1;

    const appointment = this.appointmentRepository.create({
      date,
      startTime,
      endTime,
      schedulingType: 'WAVE',
      tokenNumber,
      status: 'CONFIRMED',
      reason: dto.reason,
      availabilityId: window.id,
      doctor,
      patient,
    });

    const saved = await this.appointmentRepository.save(appointment);

    return {
      id: saved.id,
      date: saved.date,
      startTime: saved.startTime,
      endTime: saved.endTime,
      timeWindow: `${saved.startTime} - ${saved.endTime}`,
      schedulingType: 'WAVE',
      tokenNumber: saved.tokenNumber,
      displayToken: `Token No: ${saved.tokenNumber}`,
      status: saved.status,
      reason: saved.reason,
      doctor: {
        id: doctor.id,
        name: doctor.user?.name,
        specialization: doctor.specialization,
      },
      patient: {
        id: patient.id,
        name: patient.user?.name,
      },
    };
  }

  async getPatientAppointments(userId: string) {
    const patientProfile = await this.getPatientProfileByUserId(userId);
    return this.appointmentRepository.find({
      where: { patient: { id: patientProfile.id } },
      relations: ['doctor', 'doctor.user'],
      order: { date: 'DESC', startTime: 'ASC' },
    });
  }

  async getDoctorAppointments(userId: string) {
    const user = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!user) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.appointmentRepository.find({
      where: { doctor: { id: user.id } },
      relations: ['patient', 'patient.user'],
      order: { date: 'DESC', startTime: 'ASC' },
    });
  }

  private async getPatientProfileByUserId(userId: string): Promise<PatientProfile> {
    const user = await this.patientRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!user) {
      throw new NotFoundException('Patient profile not found. Complete onboarding first.');
    }

    return user;
  }

  private async getDoctorProfileById(doctorId: string): Promise<DoctorProfile> {
    let profile = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    if (!profile) {
      profile = await this.doctorRepository.findOne({
        where: { user: { id: doctorId } },
        relations: ['user'],
      });
    }

    if (!profile) {
      throw new NotFoundException(`Doctor with ID "${doctorId}" not found.`);
    }

    return profile;
  }
}
