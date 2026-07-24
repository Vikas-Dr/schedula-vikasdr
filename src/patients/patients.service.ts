import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from './patient.entity';
import { User } from '../users/user.entity';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientProfile)
    private readonly patientRepository: Repository<PatientProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createProfile(userId: string, dto: CreatePatientProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['patientProfile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'patient') {
      throw new BadRequestException('User is not a patient');
    }

    if (user.patientProfile) {
      throw new ConflictException(
        'Patient profile already exists. Use PATCH /patient/profile to update.',
      );
    }

    if (dto.name) {
      user.name = dto.name;
      await this.userRepository.save(user);
    }

    const patientProfile = this.patientRepository.create({
      age: dto.age,
      gender: dto.gender,
      emergencyContact: dto.emergencyContact ?? dto.contactDetails ?? dto.phone,
      basicHealthInfo: dto.basicHealthInfo ?? dto.medicalHistory,
      birthday: dto.birthday,
      bloodType: dto.bloodType,
      user,
    });

    const savedProfile = await this.patientRepository.save(patientProfile);
    return this.formatProfileResponse(savedProfile, user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['patientProfile'],
    });

    if (!user || !user.patientProfile) {
      throw new NotFoundException('Patient profile not found');
    }

    return this.formatProfileResponse(user.patientProfile, user);
  }

  async updateProfile(userId: string, dto: UpdatePatientProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['patientProfile'],
    });

    if (!user || !user.patientProfile) {
      throw new NotFoundException('Patient profile not found');
    }

    if (dto.name) {
      user.name = dto.name;
      await this.userRepository.save(user);
    }

    const profile = user.patientProfile;
    if (dto.age !== undefined) profile.age = dto.age;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (
      dto.emergencyContact !== undefined ||
      dto.contactDetails !== undefined ||
      dto.phone !== undefined
    ) {
      profile.emergencyContact =
        dto.emergencyContact ?? dto.contactDetails ?? dto.phone;
    }
    if (dto.basicHealthInfo !== undefined || dto.medicalHistory !== undefined) {
      profile.basicHealthInfo = dto.basicHealthInfo ?? dto.medicalHistory;
    }
    if (dto.birthday !== undefined) profile.birthday = dto.birthday;
    if (dto.bloodType !== undefined) profile.bloodType = dto.bloodType;

    const savedProfile = await this.patientRepository.save(profile);
    return this.formatProfileResponse(savedProfile, user);
  }

  private formatProfileResponse(profile: PatientProfile, user: User) {
    return {
      id: profile.id,
      age: profile.age,
      gender: profile.gender,
      emergencyContact: profile.emergencyContact,
      basicHealthInfo: profile.basicHealthInfo,
      birthday: profile.birthday,
      bloodType: profile.bloodType,
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
