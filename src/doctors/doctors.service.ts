import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfile } from './doctor.entity';
import { User } from '../users/user.entity';
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { UpdateRecurringAvailabilityDto } from './dto/update-recurring-availability.dto';
import { CreateCustomOverrideDto } from './dto/create-custom-override.dto';
import {
  getDayOfWeekFromDate,
  isOverlapping,
  normalizeDayOfWeek,
  normalizeTimeString,
  validateAndFormatDate,
  validateTimeRange,
} from './utils/time-parser.util';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorRepository: Repository<DoctorProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RecurringAvailability)
    private readonly recurringRepository: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private readonly customRepository: Repository<CustomAvailability>,
  ) {}

  async createProfile(userId: string, dto: CreateDoctorProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['doctorProfile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'doctor') {
      throw new BadRequestException('User is not a doctor');
    }

    if (user.doctorProfile) {
      throw new ConflictException(
        'Doctor profile already exists. Use PATCH /doctor/profile to update.',
      );
    }

    if (dto.name) {
      user.name = dto.name;
      await this.userRepository.save(user);
    }

    const doctorProfile = this.doctorRepository.create({
      specialization: dto.specialization,
      yearsOfExperience: dto.yearsOfExperience ?? dto.experience,
      qualification: dto.qualification,
      bio: dto.bio ?? dto.profileDetails,
      isVerified: false,
      user,
    });

    const savedProfile = await this.doctorRepository.save(doctorProfile);

    return this.formatProfileResponse(savedProfile, user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['doctorProfile'],
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.formatProfileResponse(user.doctorProfile, user);
  }

  async updateProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['doctorProfile'],
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (dto.name) {
      user.name = dto.name;
      await this.userRepository.save(user);
    }

    const profile = user.doctorProfile;
    if (dto.specialization !== undefined)
      profile.specialization = dto.specialization;
    if (dto.yearsOfExperience !== undefined || dto.experience !== undefined) {
      profile.yearsOfExperience = dto.yearsOfExperience ?? dto.experience;
    }
    if (dto.qualification !== undefined)
      profile.qualification = dto.qualification;
    if (dto.bio !== undefined || dto.profileDetails !== undefined) {
      profile.bio = dto.bio ?? dto.profileDetails;
    }

    const savedProfile = await this.doctorRepository.save(profile);
    return this.formatProfileResponse(savedProfile, user);
  }

  // --- RECURRING AVAILABILITY METHODS ---

  async createRecurringAvailability(
    userId: string,
    dto: CreateRecurringAvailabilityDto,
  ) {
    const doctorProfile = await this.getDoctorProfileByUserId(userId);
    const dayOfWeek = normalizeDayOfWeek(dto.dayOfWeek);
    validateTimeRange(dto.startTime, dto.endTime);

    const startTime = normalizeTimeString(dto.startTime);
    const endTime = normalizeTimeString(dto.endTime);

    // Check overlaps with existing slots for this doctor on the same day
    const existingSlots = await this.recurringRepository.find({
      where: { doctor: { id: doctorProfile.id }, dayOfWeek },
    });

    for (const slot of existingSlots) {
      if (isOverlapping(slot.startTime, slot.endTime, startTime, endTime)) {
        throw new BadRequestException(
          `Overlapping time slot: Time window ${startTime} - ${endTime} conflicts with existing slot (${slot.startTime} - ${slot.endTime}) for ${dayOfWeek}.`,
        );
      }
    }

    const slot = this.recurringRepository.create({
      dayOfWeek,
      startTime,
      endTime,
      capacity: dto.capacity ?? 1,
      type: dto.type ?? 'recurring',
      doctor: doctorProfile,
    });

    return this.recurringRepository.save(slot);
  }

  async getRecurringAvailability(userId: string, doctorId?: string) {
    let profile: DoctorProfile;
    if (doctorId) {
      profile = await this.getDoctorProfileById(doctorId);
    } else {
      profile = await this.getDoctorProfileByUserId(userId);
    }

    const slots = await this.recurringRepository.find({
      where: { doctor: { id: profile.id } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    return slots;
  }

  async updateRecurringAvailability(
    userId: string,
    id: string,
    dto: UpdateRecurringAvailabilityDto,
  ) {
    const doctorProfile = await this.getDoctorProfileByUserId(userId);

    const slot = await this.recurringRepository.findOne({
      where: { id, doctor: { id: doctorProfile.id } },
    });

    if (!slot) {
      throw new NotFoundException('Recurring availability slot not found');
    }

    const targetDay = dto.dayOfWeek
      ? normalizeDayOfWeek(dto.dayOfWeek)
      : slot.dayOfWeek;
    const targetStart = dto.startTime
      ? normalizeTimeString(dto.startTime)
      : slot.startTime;
    const targetEnd = dto.endTime
      ? normalizeTimeString(dto.endTime)
      : slot.endTime;

    validateTimeRange(targetStart, targetEnd);

    // Check overlap with other slots (excluding current slot)
    const otherSlots = await this.recurringRepository.find({
      where: { doctor: { id: doctorProfile.id }, dayOfWeek: targetDay },
    });

    for (const existing of otherSlots) {
      if (existing.id === id) continue;
      if (
        isOverlapping(
          existing.startTime,
          existing.endTime,
          targetStart,
          targetEnd,
        )
      ) {
        throw new BadRequestException(
          `Overlapping time slot: Updated window ${targetStart} - ${targetEnd} conflicts with existing slot (${existing.startTime} - ${existing.endTime}) for ${targetDay}.`,
        );
      }
    }

    slot.dayOfWeek = targetDay;
    slot.startTime = targetStart;
    slot.endTime = targetEnd;
    if (dto.capacity !== undefined) slot.capacity = dto.capacity;
    if (dto.type !== undefined) slot.type = dto.type;

    return this.recurringRepository.save(slot);
  }

  async deleteRecurringAvailability(userId: string, id: string) {
    const doctorProfile = await this.getDoctorProfileByUserId(userId);

    const slot = await this.recurringRepository.findOne({
      where: { id, doctor: { id: doctorProfile.id } },
    });

    if (!slot) {
      throw new NotFoundException('Recurring availability slot not found');
    }

    await this.recurringRepository.remove(slot);
    return { message: 'Recurring availability slot deleted successfully', id };
  }

  // --- CUSTOM OVERRIDE AVAILABILITY METHODS ---

  async createCustomOverride(userId: string, dto: CreateCustomOverrideDto) {
    const doctorProfile = await this.getDoctorProfileByUserId(userId);
    const date = validateAndFormatDate(dto.date);
    const isAvailable = dto.isAvailable ?? true;

    validateTimeRange(dto.startTime, dto.endTime);
    const startTime = normalizeTimeString(dto.startTime);
    const endTime = normalizeTimeString(dto.endTime);

    // Check overlap with existing custom overrides on the same date
    const existingOverrides = await this.customRepository.find({
      where: { doctor: { id: doctorProfile.id }, date },
    });

    for (const override of existingOverrides) {
      if (
        isOverlapping(override.startTime, override.endTime, startTime, endTime)
      ) {
        throw new BadRequestException(
          `Overlapping time slot: Time window ${startTime} - ${endTime} conflicts with existing custom override (${override.startTime} - ${override.endTime}) for date ${date}.`,
        );
      }
    }

    const customOverride = this.customRepository.create({
      date,
      startTime,
      endTime,
      isAvailable,
      capacity: dto.capacity ?? 1,
      type: dto.type ?? 'stream',
      doctor: doctorProfile,
    });

    return this.customRepository.save(customOverride);
  }

  async getCustomOverrides(userId: string) {
    const doctorProfile = await this.getDoctorProfileByUserId(userId);
    return this.customRepository.find({
      where: { doctor: { id: doctorProfile.id } },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async deleteCustomOverride(userId: string, id: string) {
    const doctorProfile = await this.getDoctorProfileByUserId(userId);

    const override = await this.customRepository.findOne({
      where: { id, doctor: { id: doctorProfile.id } },
    });

    if (!override) {
      throw new NotFoundException('Custom availability override not found');
    }

    await this.customRepository.remove(override);
    return { message: 'Custom availability override deleted successfully', id };
  }

  // --- EFFECTIVE AVAILABILITY FOR A SPECIFIC DATE ---

  async getAvailabilityForDate(
    dateStr: string,
    userId?: string,
    doctorId?: string,
  ) {
    if (!dateStr) {
      throw new BadRequestException('Date query parameter is required');
    }

    const date = validateAndFormatDate(dateStr);
    const dayOfWeek = getDayOfWeekFromDate(date);

    let doctorProfile: DoctorProfile;
    if (doctorId) {
      doctorProfile = await this.getDoctorProfileById(doctorId);
    } else if (userId) {
      doctorProfile = await this.getDoctorProfileByUserId(userId);
    } else {
      throw new BadRequestException(
        'Doctor ID or authenticated doctor session is required',
      );
    }

    // 1. Check custom overrides for the specific date
    const customOverrides = await this.customRepository.find({
      where: { doctor: { id: doctorProfile.id }, date },
      order: { startTime: 'ASC' },
    });

    if (customOverrides.length > 0) {
      return {
        date,
        dayOfWeek,
        isOverride: true,
        doctorId: doctorProfile.id,
        slots: customOverrides.map((c) => ({
          id: c.id,
          startTime: c.startTime,
          endTime: c.endTime,
          isAvailable: c.isAvailable,
          capacity: c.capacity ?? 1,
          type: c.type ?? 'stream',
          isRecurring: false,
        })),
      };
    }

    // 2. Fall back to recurring weekly availability for that day of week
    const recurringSlots = await this.recurringRepository.find({
      where: { doctor: { id: doctorProfile.id }, dayOfWeek },
      order: { startTime: 'ASC' },
    });

    return {
      date,
      dayOfWeek,
      isOverride: false,
      doctorId: doctorProfile.id,
      slots: recurringSlots.map((r) => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        isAvailable: true,
        capacity: r.capacity ?? 1,
        type: r.type ?? 'recurring',
        isRecurring: true,
      })),
    };
  }

  // --- HELPER METHODS ---

  private async getDoctorProfileByUserId(
    userId: string,
  ): Promise<DoctorProfile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['doctorProfile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'doctor') {
      throw new BadRequestException('User is not a doctor');
    }

    if (!user.doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return user.doctorProfile;
  }

  private async getDoctorProfileById(doctorId: string): Promise<DoctorProfile> {
    // Try finding by DoctorProfile id
    let profile = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    // If not found by profile id, try finding by User id
    if (!profile) {
      const user = await this.userRepository.findOne({
        where: { id: doctorId },
        relations: ['doctorProfile'],
      });
      if (user && user.doctorProfile) {
        profile = user.doctorProfile;
      }
    }

    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }

    return profile;
  }

  private formatProfileResponse(profile: DoctorProfile, user: User) {
    return {
      id: profile.id,
      specialization: profile.specialization,
      yearsOfExperience: profile.yearsOfExperience,
      qualification: profile.qualification,
      bio: profile.bio,
      isVerified: profile.isVerified,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
