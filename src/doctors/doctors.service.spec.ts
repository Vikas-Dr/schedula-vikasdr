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
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let doctorRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let recurringRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let customRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser: User = {
    id: 'doc-uuid-1',
    email: 'doc@example.com',
    password: 'hashedpassword',
    name: 'Dr. John',
    phone: '1234567890',
    role: 'doctor',
  };

  const mockDoctorProfile: DoctorProfile = {
    id: 'profile-uuid-1',
    specialization: 'Neurology',
    yearsOfExperience: '10 years',
    qualification: 'MD',
    bio: 'Neuro specialist',
    isVerified: false,
    user: mockUser,
    recurringAvailabilities: [],
    customAvailabilities: [],
  };

  beforeEach(async () => {
    doctorRepo = {
      create: jest
        .fn()
        .mockImplementation(
          (dto: Record<string, unknown>): DoctorProfile =>
            ({ ...dto, id: 'profile-uuid-1' }) as DoctorProfile,
        ),
      save: jest
        .fn()
        .mockImplementation((entity: DoctorProfile): Promise<DoctorProfile> =>
          Promise.resolve({ ...entity, id: 'profile-uuid-1' }),
        ),
      findOne: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((u: User): Promise<User> => Promise.resolve(u)),
    };

    recurringRepo = {
      create: jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
        ...dto,
        id: 'recurring-uuid-1',
      })),
      save: jest.fn().mockImplementation((entity: Record<string, unknown>) =>
        Promise.resolve({
          ...entity,
          id: (entity.id as string) || 'recurring-uuid-1',
        }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(true),
    };

    customRepo = {
      create: jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
        ...dto,
        id: 'custom-uuid-1',
      })),
      save: jest.fn().mockImplementation((entity: Record<string, unknown>) =>
        Promise.resolve({
          ...entity,
          id: (entity.id as string) || 'custom-uuid-1',
        }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: getRepositoryToken(DoctorProfile), useValue: doctorRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(RecurringAvailability),
          useValue: recurringRepo,
        },
        {
          provide: getRepositoryToken(CustomAvailability),
          useValue: customRepo,
        },
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

  describe('Recurring Availability', () => {
    it('should create recurring availability with capacity and wave type successfully', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      recurringRepo.find.mockResolvedValue([]);

      const result = (await service.createRecurringAvailability('doc-uuid-1', {
        dayOfWeek: 'Monday',
        startTime: '10:00 AM',
        endTime: '1:00 PM',
        capacity: 5,
        type: 'wave',
      })) as RecurringAvailability;

      expect(result.dayOfWeek).toBe('Monday');
      expect(result.startTime).toBe('10:00');
      expect(result.endTime).toBe('13:00');
      expect(result.capacity).toBe(5);
      expect(result.type).toBe('wave');
    });

    it('should create recurring availability for multiple days (Monday, Wednesday, Friday)', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      recurringRepo.find.mockResolvedValue([]);

      const result = (await service.createRecurringAvailability('doc-uuid-1', {
        daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
        startTime: '10:00 AM',
        endTime: '1:00 PM',
        capacity: 4,
        type: 'stream',
      })) as RecurringAvailability[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].dayOfWeek).toBe('Monday');
      expect(result[1].dayOfWeek).toBe('Wednesday');
      expect(result[2].dayOfWeek).toBe('Friday');
    });

    it('should throw BadRequestException on invalid time range (e.g. 3 PM to 1 PM)', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });

      await expect(
        service.createRecurringAvailability('doc-uuid-1', {
          dayOfWeek: 'Monday',
          startTime: '3 PM',
          endTime: '1 PM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on overlapping time slot', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      recurringRepo.find.mockResolvedValue([
        {
          id: 'slot-1',
          dayOfWeek: 'Monday',
          startTime: '10:00',
          endTime: '12:00',
        },
      ]);

      await expect(
        service.createRecurringAvailability('doc-uuid-1', {
          dayOfWeek: 'Monday',
          startTime: '11:00',
          endTime: '13:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update recurring availability successfully', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      recurringRepo.findOne.mockResolvedValue({
        id: 'slot-1',
        dayOfWeek: 'Monday',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 1,
        type: 'recurring',
        doctor: mockDoctorProfile,
      });
      recurringRepo.find.mockResolvedValue([]);

      const result = await service.updateRecurringAvailability(
        'doc-uuid-1',
        'slot-1',
        { startTime: '09:00', capacity: 6 },
      );

      expect(result.startTime).toBe('09:00');
      expect(result.capacity).toBe(6);
    });

    it('should delete recurring availability slot successfully', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      recurringRepo.findOne.mockResolvedValue({
        id: 'slot-1',
        doctor: mockDoctorProfile,
      });

      const result = await service.deleteRecurringAvailability(
        'doc-uuid-1',
        'slot-1',
      );
      expect(result.message).toContain('deleted successfully');
    });
  });

  describe('Custom Availability (Override / Stream)', () => {
    it('should create custom availability override with capacity and stream type', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      customRepo.find.mockResolvedValue([]);

      const result = await service.createCustomOverride('doc-uuid-1', {
        date: '2026-06-15',
        startTime: '14:00',
        endTime: '15:00',
        capacity: 2,
        type: 'stream',
      });

      expect(result.date).toBe('2026-06-15');
      expect(result.startTime).toBe('14:00');
      expect(result.endTime).toBe('15:00');
      expect(result.capacity).toBe(2);
      expect(result.type).toBe('stream');
    });

    it('should throw BadRequestException on invalid date format', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });

      await expect(
        service.createCustomOverride('doc-uuid-1', {
          date: 'invalid-date',
          startTime: '14:00',
          endTime: '15:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return custom stream override slots when custom override exists for date', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      doctorRepo.findOne.mockResolvedValue(mockDoctorProfile);
      customRepo.find.mockResolvedValue([
        {
          id: 'custom-1',
          date: '2026-06-15',
          startTime: '14:00',
          endTime: '15:00',
          isAvailable: true,
          capacity: 2,
          type: 'stream',
        },
      ]);

      // Note: 2026-06-15 is a Monday
      const result = await service.getAvailabilityForDate(
        '2026-06-15',
        'doc-uuid-1',
      );

      expect(result.isOverride).toBe(true);
      expect(result.dayOfWeek).toBe('Monday');
      expect(result.slots.length).toBe(1);
      expect(result.slots[0].startTime).toBe('14:00');
      expect(result.slots[0].capacity).toBe(2);
      expect(result.slots[0].type).toBe('stream');
      expect(result.slots[0].isRecurring).toBe(false);
    });

    it('should fall back to recurring weekly slots showing type=recurring and isRecurring=true', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        doctorProfile: mockDoctorProfile,
      });
      customRepo.find.mockResolvedValue([]);
      recurringRepo.find.mockResolvedValue([
        {
          id: 'recurring-1',
          dayOfWeek: 'Monday',
          startTime: '10:00',
          endTime: '13:00',
          capacity: 5,
          type: 'recurring',
        },
      ]);

      // 2026-06-15 is a Monday
      const result = await service.getAvailabilityForDate(
        '2026-06-15',
        'doc-uuid-1',
      );

      expect(result.isOverride).toBe(false);
      expect(result.dayOfWeek).toBe('Monday');
      expect(result.slots.length).toBe(1);
      expect(result.slots[0].startTime).toBe('10:00');
      expect(result.slots[0].capacity).toBe(5);
      expect(result.slots[0].type).toBe('recurring');
      expect(result.slots[0].isRecurring).toBe(true);
    });
  });
});
