import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientProfile } from './patient.entity';
import { User } from '../users/user.entity';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepo: { create: jest.Mock; save: jest.Mock };
  let userRepo: { findOne: jest.Mock; save: jest.Mock };

  const mockUser: User = {
    id: 'pat-uuid-1',
    email: 'pat@example.com',
    password: 'hashedpassword',
    name: 'Alice',
    phone: '9876543210',
    role: 'patient',
  };

  const mockPatientProfile: PatientProfile = {
    id: 'pat-profile-1',
    age: 28,
    gender: 'Female',
    emergencyContact: '1122334455',
    basicHealthInfo: 'None',
    birthday: '1995-05-05',
    bloodType: 'A+',
    user: mockUser,
  };

  beforeEach(async () => {
    patientRepo = {
      create: jest
        .fn()
        .mockImplementation(
          (dto: Record<string, unknown>): PatientProfile =>
            ({ ...dto, id: 'pat-profile-1' }) as PatientProfile,
        ),
      save: jest
        .fn()
        .mockImplementation((entity: PatientProfile): Promise<PatientProfile> =>
          Promise.resolve({ ...entity, id: 'pat-profile-1' }),
        ),
    };

    userRepo = {
      findOne: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((u: User): Promise<User> => Promise.resolve(u)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(PatientProfile), useValue: patientRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  describe('createProfile', () => {
    it('should create patient profile successfully', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, patientProfile: null });

      const dto = {
        name: 'Alice Wonder',
        age: 28,
        gender: 'Female',
        contactDetails: '1122334455',
        basicHealthInfo: 'No prior allergies',
      };

      const result = await service.createProfile('pat-uuid-1', dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pat-uuid-1' },
        relations: ['patientProfile'],
      });
      expect(patientRepo.create).toHaveBeenCalled();
      expect(patientRepo.save).toHaveBeenCalled();
      expect(result.age).toBe(28);
      expect(result.gender).toBe('Female');
      expect(result.basicHealthInfo).toBe('No prior allergies');
    });

    it('should throw ConflictException if patient profile already exists', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        patientProfile: mockPatientProfile,
      });

      await expect(
        service.createProfile('pat-uuid-1', { age: 29 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createProfile('invalid-id', { age: 29 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user role is not patient', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, role: 'doctor' });

      await expect(
        service.createProfile('pat-uuid-1', { age: 29 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return patient profile if it exists', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        patientProfile: mockPatientProfile,
      });

      const result = await service.getProfile('pat-uuid-1');
      expect(result.id).toBe('pat-profile-1');
      expect(result.age).toBe(28);
    });

    it('should throw NotFoundException if patient profile does not exist', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, patientProfile: null });

      await expect(service.getProfile('pat-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update patient profile fields successfully', async () => {
      const existingUser = {
        ...mockUser,
        patientProfile: { ...mockPatientProfile },
      };
      userRepo.findOne.mockResolvedValue(existingUser);

      const dto = {
        age: 29,
        basicHealthInfo: 'Mild pollen allergy',
      };

      const result = await service.updateProfile('pat-uuid-1', dto);

      expect(patientRepo.save).toHaveBeenCalled();
      expect(result.age).toBe(29);
      expect(result.basicHealthInfo).toBe('Mild pollen allergy');
    });

    it('should throw NotFoundException when updating non-existent profile', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, patientProfile: null });

      await expect(
        service.updateProfile('pat-uuid-1', { age: 30 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
