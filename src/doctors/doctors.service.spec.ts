import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorProfile } from './doctor.entity';
import { User } from '../users/user.entity';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let doctorRepo: any;
  let userRepo: any;

  const mockUser: User = {
    id: 'doc-uuid-1',
    email: 'doc@example.com',
    password: 'hashedpassword',
    name: 'Dr. John',
    phone: '1234567890',
    role: 'doctor',
  } as User;

  const mockDoctorProfile: DoctorProfile = {
    id: 'profile-uuid-1',
    specialization: 'Neurology',
    yearsOfExperience: '10 years',
    qualification: 'MD',
    fee: '150',
    availability: 'Mon-Fri',
    bio: 'Neuro specialist',
    isVerified: false,
    user: mockUser,
  } as DoctorProfile;

  beforeEach(async () => {
    doctorRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'profile-uuid-1' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'profile-uuid-1' })),
    };

    userRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: getRepositoryToken(DoctorProfile), useValue: doctorRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  describe('createProfile', () => {
    it('should create doctor profile successfully', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, doctorProfile: null });

      const dto = {
        name: 'Dr. John Smith',
        specialization: 'Neurology',
        experience: '10 years',
        qualification: 'MD',
        consultationFee: '150',
        consultationHours: 'Mon-Fri',
        profileDetails: 'Neuro specialist',
      };

      const result = await service.createProfile('doc-uuid-1', dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-uuid-1' },
        relations: ['doctorProfile'],
      });
      expect(doctorRepo.create).toHaveBeenCalled();
      expect(doctorRepo.save).toHaveBeenCalled();
      expect(result.specialization).toBe('Neurology');
      expect(result.qualification).toBe('MD');
    });

    it('should throw ConflictException if profile already exists', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });

      await expect(
        service.createProfile('doc-uuid-1', { specialization: 'Cardiology' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createProfile('invalid-id', { specialization: 'Cardiology' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user role is not doctor', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, role: 'patient' });

      await expect(
        service.createProfile('doc-uuid-1', { specialization: 'Cardiology' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return doctor profile if it exists', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });

      const result = await service.getProfile('doc-uuid-1');
      expect(result.id).toBe('profile-uuid-1');
      expect(result.specialization).toBe('Neurology');
    });

    it('should throw NotFoundException if doctor profile does not exist', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, doctorProfile: null });

      await expect(service.getProfile('doc-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update doctor profile fields successfully', async () => {
      const existingUser = {
        ...mockUser,
        doctorProfile: { ...mockDoctorProfile },
      };
      userRepo.findOne.mockResolvedValue(existingUser);

      const dto = {
        consultationFee: '200',
        availability: 'Mon-Thu',
      };

      const result = await service.updateProfile('doc-uuid-1', dto);

      expect(doctorRepo.save).toHaveBeenCalled();
      expect(result.fee).toBe('200');
      expect(result.availability).toBe('Mon-Thu');
    });

    it('should throw NotFoundException when updating non-existent profile', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, doctorProfile: null });

      await expect(
        service.updateProfile('doc-uuid-1', { fee: '200' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
