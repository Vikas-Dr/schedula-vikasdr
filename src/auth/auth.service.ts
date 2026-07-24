import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return null;
    }
    const matches = await bcrypt.compare(password, user.password);
    return matches ? user : null;
  }

  login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findOneByEmail(registerDto.email);
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const hasDoctorProfileData =
      registerDto.role === 'doctor' &&
      Boolean(
        registerDto.specialization ||
        registerDto.bio ||
        registerDto.yearsOfExperience,
      );

    const hasPatientProfileData =
      registerDto.role === 'patient' &&
      Boolean(
        registerDto.birthday ||
        registerDto.gender ||
        registerDto.bloodType ||
        registerDto.emergencyContact,
      );

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.createUser({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone,
      role: registerDto.role,
      doctorProfile: hasDoctorProfileData
        ? {
            specialization: registerDto.specialization,
            bio: registerDto.bio,
            yearsOfExperience: registerDto.yearsOfExperience,
          }
        : undefined,
      patientProfile: hasPatientProfileData
        ? {
            birthday: registerDto.birthday,
            gender: registerDto.gender,
            bloodType: registerDto.bloodType,
            emergencyContact: registerDto.emergencyContact,
          }
        : undefined,
    });

    return this.login(user);
  }
}
