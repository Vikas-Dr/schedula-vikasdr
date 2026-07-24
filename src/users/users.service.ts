import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';

export type CreateUserData = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  doctorProfile?: Partial<DoctorProfile>;
  patientProfile?: Partial<PatientProfile>;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepository: Repository<DoctorProfile>,
    @InjectRepository(PatientProfile)
    private readonly patientRepository: Repository<PatientProfile>,
  ) {}

  async createUser(data: CreateUserData) {
    const user = this.usersRepository.create({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      role: data.role,
    });

    const savedUser = await this.usersRepository.save(user);

    if (
      data.role === 'doctor' &&
      data.doctorProfile &&
      Object.keys(data.doctorProfile).length > 0
    ) {
      const doctorProfile = this.doctorRepository.create({
        specialization: data.doctorProfile?.specialization,
        bio: data.doctorProfile?.bio,
        yearsOfExperience: data.doctorProfile?.yearsOfExperience,
        qualification: data.doctorProfile?.qualification,
        isVerified: false,
        user: savedUser,
      });
      await this.doctorRepository.save(doctorProfile);
      savedUser.doctorProfile = doctorProfile;
    }

    if (
      data.role === 'patient' &&
      data.patientProfile &&
      Object.keys(data.patientProfile).length > 0
    ) {
      const patientProfile = this.patientRepository.create({
        birthday: data.patientProfile?.birthday,
        age: data.patientProfile?.age,
        gender: data.patientProfile?.gender,
        bloodType: data.patientProfile?.bloodType,
        emergencyContact: data.patientProfile?.emergencyContact,
        basicHealthInfo: data.patientProfile?.basicHealthInfo,
        user: savedUser,
      });
      await this.patientRepository.save(patientProfile);
      savedUser.patientProfile = patientProfile;
    }

    return savedUser;
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'phone', 'role'],
      relations: ['doctorProfile', 'patientProfile'],
    });
  }

  findOneById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['doctorProfile', 'patientProfile'],
    });
  }

  findDoctors() {
    return this.usersRepository.find({
      where: { role: 'doctor' },
      relations: ['doctorProfile'],
    });
  }

  findPatients() {
    return this.usersRepository.find({
      where: { role: 'patient' },
      relations: ['patientProfile'],
    });
  }
}
