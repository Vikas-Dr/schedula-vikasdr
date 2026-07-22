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
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorRepository: Repository<DoctorProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      fee: dto.fee ?? dto.consultationFee,
      availability: dto.availability ?? dto.consultationHours,
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
    if (dto.specialization !== undefined) profile.specialization = dto.specialization;
    if (dto.yearsOfExperience !== undefined || dto.experience !== undefined) {
      profile.yearsOfExperience = dto.yearsOfExperience ?? dto.experience;
    }
    if (dto.qualification !== undefined) profile.qualification = dto.qualification;
    if (dto.fee !== undefined || dto.consultationFee !== undefined) {
      profile.fee = dto.fee ?? dto.consultationFee;
    }
    if (dto.availability !== undefined || dto.consultationHours !== undefined) {
      profile.availability = dto.availability ?? dto.consultationHours;
    }
    if (dto.bio !== undefined || dto.profileDetails !== undefined) {
      profile.bio = dto.bio ?? dto.profileDetails;
    }

    const savedProfile = await this.doctorRepository.save(profile);
    return this.formatProfileResponse(savedProfile, user);
  }

  private formatProfileResponse(profile: DoctorProfile, user: User) {
    return {
      id: profile.id,
      specialization: profile.specialization,
      yearsOfExperience: profile.yearsOfExperience,
      qualification: profile.qualification,
      fee: profile.fee,
      availability: profile.availability,
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
