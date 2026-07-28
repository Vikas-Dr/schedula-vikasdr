import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { DoctorProfile } from '../doctors/doctor.entity';
import { PatientProfile } from '../patients/patient.entity';
import { RecurringAvailability } from '../doctors/entities/recurring-availability.entity';
import { CustomAvailability } from '../doctors/entities/custom-availability.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let doctorRepo: { findOne: jest.Mock };
  let patientRepo: { findOne: jest.Mock };
  let recurringRepo: { find: jest.Mock };
  let customRepo: { find: jest.Mock };

  const mockDoctor: DoctorProfile = {
    id: 'doc-uuid-1',
    specialization: 'Neurology',
    isVerified: true,
    schedulingType: 'STREAM',
    user: { id: 'doc-user-1', name: 'Dr. Smith', email: 'doc@test.com', phone: '123', role: 'doctor' } as any,
    recurringAvailabilities: [],
    customAvailabilities: [],
  };

  const mockPatient: PatientProfile = {
    id: 'patient-uuid-1',
    age: 30,
    gender: 'Male',
    user: { id: 'patient-user-1', name: 'John Doe', email: 'patient@test.com', phone: '456', role: 'patient' } as any,
  };

  beforeEach(async () => {
    appointmentRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'app-uuid-1' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'app-uuid-1' })),
    };

    doctorRepo = {
      findOne: jest.fn().mockResolvedValue(mockDoctor),
    };

    patientRepo = {
      findOne: jest.fn().mockResolvedValue(mockPatient),
    };

    recurringRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    customRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: getRepositoryToken(DoctorProfile), useValue: doctorRepo },
        { provide: getRepositoryToken(PatientProfile), useValue: patientRepo },
        { provide: getRepositoryToken(RecurringAvailability), useValue: recurringRepo },
        { provide: getRepositoryToken(CustomAvailability), useValue: customRepo },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('Stream Scheduling Booking', () => {
    it('should successfully book a Stream appointment with exact time', async () => {
      // Setup future date
      const futureDate = '2030-01-15';
      customRepo.find.mockResolvedValue([
        {
          id: 'custom-1',
          startTime: '10:00',
          endTime: '11:00',
          isAvailable: true,
          schedulingType: 'STREAM',
          maxCapacity: 1,
        },
      ]);

      const result = await service.bookAppointment('patient-user-1', {
        doctorId: 'doc-uuid-1',
        date: futureDate,
        startTime: '10:00',
        endTime: '10:15',
        schedulingType: 'STREAM',
      });

      expect(result.schedulingType).toBe('STREAM');
      expect(result.startTime).toBe('10:00');
      expect(result.endTime).toBe('10:15');
      expect(appointmentRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if Stream slot is already booked', async () => {
      const futureDate = '2030-01-15';
      customRepo.find.mockResolvedValue([
        { id: 'custom-1', startTime: '10:00', endTime: '11:00', isAvailable: true, schedulingType: 'STREAM' },
      ]);
      appointmentRepo.findOne.mockResolvedValue({ id: 'existing-app' });

      await expect(
        service.bookAppointment('patient-user-1', {
          doctorId: 'doc-uuid-1',
          date: futureDate,
          startTime: '10:00',
          endTime: '10:15',
          schedulingType: 'STREAM',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Wave Scheduling Booking', () => {
    it('should assign Token 1 to first patient booking in Wave', async () => {
      const futureDate = '2030-01-15';
      const waveDoctor = { ...mockDoctor, schedulingType: 'WAVE' as const };
      doctorRepo.findOne.mockResolvedValue(waveDoctor);
      customRepo.find.mockResolvedValue([
        { id: 'custom-wave', startTime: '10:00', endTime: '11:00', isAvailable: true, schedulingType: 'WAVE', maxCapacity: 5 },
      ]);
      appointmentRepo.find.mockResolvedValue([]); // 0 current bookings

      const result = await service.bookAppointment('patient-user-1', {
        doctorId: 'doc-uuid-1',
        date: futureDate,
        schedulingType: 'WAVE',
      });

      expect(result.schedulingType).toBe('WAVE');
      expect(result.tokenNumber).toBe(1);
      expect(result.displayToken).toBe('Token No: 1');
    });

    it('should assign Token 2 to second patient booking in Wave', async () => {
      const futureDate = '2030-01-15';
      const waveDoctor = { ...mockDoctor, schedulingType: 'WAVE' as const };
      doctorRepo.findOne.mockResolvedValue(waveDoctor);
      customRepo.find.mockResolvedValue([
        { id: 'custom-wave', startTime: '10:00', endTime: '11:00', isAvailable: true, schedulingType: 'WAVE', maxCapacity: 5 },
      ]);
      appointmentRepo.find.mockResolvedValue([{ id: 'first-booking' }]); // 1 existing booking

      const result = await service.bookAppointment('patient-user-1', {
        doctorId: 'doc-uuid-1',
        date: futureDate,
        schedulingType: 'WAVE',
      });

      expect(result.tokenNumber).toBe(2);
      expect(result.displayToken).toBe('Token No: 2');
    });

    it('should throw ConflictException when Wave maxCapacity is reached', async () => {
      const futureDate = '2030-01-15';
      const waveDoctor = { ...mockDoctor, schedulingType: 'WAVE' as const };
      doctorRepo.findOne.mockResolvedValue(waveDoctor);
      customRepo.find.mockResolvedValue([
        { id: 'custom-wave', startTime: '10:00', endTime: '11:00', isAvailable: true, schedulingType: 'WAVE', maxCapacity: 2 },
      ]);
      // 2 existing bookings = full capacity!
      appointmentRepo.find.mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]);

      await expect(
        service.bookAppointment('patient-user-1', {
          doctorId: 'doc-uuid-1',
          date: futureDate,
          schedulingType: 'WAVE',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Edge Cases', () => {
    it('should throw BadRequestException when booking past date', async () => {
      await expect(
        service.bookAppointment('patient-user-1', {
          doctorId: 'doc-uuid-1',
          date: '2020-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
