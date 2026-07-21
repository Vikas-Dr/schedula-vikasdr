import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';

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

  async createUser(data: Partial<User> & { role: UserRole }) {
    const user = this.usersRepository.create({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      role: data.role,
    });

    if (data.role === 'doctor') {
      const doctorProfile = this.doctorRepository.create({
        specialization: data.doctorProfile?.specialization,
        experienceYears: data.doctorProfile?.experienceYears,
        fees: data.doctorProfile?.fees,
        verified: false,
      });
      user.doctorProfile = doctorProfile;
    }

    if (data.role === 'patient') {
      const patientProfile = this.patientRepository.create({
        birthday: data.patientProfile?.birthday,
        gender: data.patientProfile?.gender,
        bloodType: data.patientProfile?.bloodType,
        emergencyContact: data.patientProfile?.emergencyContact,
      });
      user.patientProfile = patientProfile;
    }

    return this.usersRepository.save(user);
  }

  findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
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
