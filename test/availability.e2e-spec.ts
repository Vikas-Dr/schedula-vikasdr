import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

interface AuthResponse {
  access_token: string;
}

interface AvailabilitySlotResponse {
  id: string;
  dayOfWeek?: string;
  date?: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  capacity?: number;
  type?: string;
  isRecurring?: boolean;
}

interface DateAvailabilityResponse {
  date: string;
  dayOfWeek: string;
  isOverride: boolean;
  doctorId: string;
  slots: AvailabilitySlotResponse[];
}

describe('Doctor Availability System (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let doctorToken: string;
  let patientToken: string;
  let doctorProfileId: string;
  let recurringSlotId: string;
  let overrideSlotId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register a doctor
    const docReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'avail.doctor@example.com',
        password: 'password123',
        name: 'Dr. Availability',
        phone: '1234567890',
        role: 'doctor',
      });
    doctorToken = (docReg.body as AuthResponse).access_token;

    // Create doctor profile
    const profileRes = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        specialization: 'General Medicine',
        experience: '5 years',
      });
    doctorProfileId = (profileRes.body as { id: string }).id;

    // Register a patient
    const patReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'avail.patient@example.com',
        password: 'password123',
        name: 'Patient Test',
        phone: '0987654321',
        role: 'patient',
      });
    patientToken = (patReg.body as AuthResponse).access_token;
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Recurring Availability APIs', () => {
    it('POST /doctor/availability should create a recurring slot with capacity and type', async () => {
      const res = await request(app.getHttpServer())
        .post('/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          dayOfWeek: 'Monday',
          startTime: '10:00 AM',
          endTime: '1:00 PM',
          capacity: 5,
          type: 'recurring',
        })
        .expect(201);

      const body = res.body as AvailabilitySlotResponse;
      expect(body.id).toBeDefined();
      expect(body.dayOfWeek).toBe('Monday');
      expect(body.startTime).toBe('10:00');
      expect(body.endTime).toBe('13:00');
      expect(body.capacity).toBe(5);
      expect(body.type).toBe('recurring');
      recurringSlotId = body.id;
    });

    it('POST /doctor/availability should support multi-day creation (daysOfWeek: [Tuesday, Thursday]) and wave type', async () => {
      const res = await request(app.getHttpServer())
        .post('/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          daysOfWeek: ['Tuesday', 'Thursday'],
          startTime: '2:00 PM',
          endTime: '5:00 PM',
          capacity: 4,
          type: 'wave',
        })
        .expect(201);

      const slots = res.body as AvailabilitySlotResponse[];
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBe(2);
      expect(slots[0].type).toBe('wave');
      expect(slots[0].capacity).toBe(4);
    });

    it('POST /doctor/availability should fail (400) on overlapping slot (11:00 AM - 12:00 PM)', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          dayOfWeek: 'Monday',
          startTime: '11:00 AM',
          endTime: '12:00 PM',
        })
        .expect(400);
    });

    it('POST /doctor/availability should fail (400) on invalid time range (3 PM to 1 PM)', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          dayOfWeek: 'Monday',
          startTime: '3:00 PM',
          endTime: '1:00 PM',
        })
        .expect(400);
    });

    it('GET /doctor/availability should return list of recurring slots showing capacity & type', async () => {
      const res = await request(app.getHttpServer())
        .get('/doctor/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const slots = res.body as AvailabilitySlotResponse[];
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBe(3);
      expect(slots[0].capacity).toBeDefined();
      expect(slots[0].type).toBeDefined();
    });

    it('PATCH /doctor/availability/:id should update a recurring slot', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/doctor/availability/${recurringSlotId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          startTime: '09:00 AM',
          capacity: 6,
        })
        .expect(200);

      const body = res.body as AvailabilitySlotResponse;
      expect(body.startTime).toBe('09:00');
      expect(body.capacity).toBe(6);
    });
  });

  describe('Custom Date Override APIs (Stream / Non-Recurring)', () => {
    it('POST /doctor/availability/override should create custom stream override with capacity', async () => {
      const res = await request(app.getHttpServer())
        .post('/doctor/availability/override')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          date: '2026-06-15',
          startTime: '2:00 PM',
          endTime: '3:00 PM',
          isAvailable: true,
          slotDuration: 60,
          capacity: 2,
          type: 'stream',
        })
        .expect(201);

      const body = res.body as AvailabilitySlotResponse;
      expect(body.id).toBeDefined();
      expect(body.date).toBe('2026-06-15');
      expect(body.startTime).toBe('14:00');
      expect(body.endTime).toBe('15:00');
      expect(body.capacity).toBe(2);
      expect(body.type).toBe('stream');
      overrideSlotId = body.id;
    });

    it('GET /doctor/availability/override should list custom overrides', async () => {
      const res = await request(app.getHttpServer())
        .get('/doctor/availability/override')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const overrides = res.body as AvailabilitySlotResponse[];
      expect(overrides.length).toBe(1);
      expect(overrides[0].type).toBe('stream');
    });
  });

  describe('Effective Date Query (GET /doctor/availability/date)', () => {
    it('GET /doctor/availability/date?date=2026-06-15 should return stream override slots (isRecurring: false)', async () => {
      const res = await request(app.getHttpServer())
        .get('/doctor/availability/date?date=2026-06-15')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = res.body as DateAvailabilityResponse;
      expect(body.date).toBe('2026-06-15');
      expect(body.dayOfWeek).toBe('Monday');
      expect(body.isOverride).toBe(true);
      expect(body.slots.length).toBe(1);
      expect(body.slots[0].startTime).toBe('14:00');
    });

    it('GET /doctor/availability/date?date=2026-06-22 should fall back to recurring Monday slots (isRecurring: true)', async () => {
      const res = await request(app.getHttpServer())
        .get('/doctor/availability/date?date=2026-06-22')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = res.body as DateAvailabilityResponse;
      expect(body.date).toBe('2026-06-22');
      expect(body.dayOfWeek).toBe('Monday');
      expect(body.isOverride).toBe(false);
      expect(body.slots.length).toBeGreaterThan(0);
    });
  });

  describe('Role-Based Access Control', () => {
    it('Patient should NOT be able to create availability (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          dayOfWeek: 'Monday',
          startTime: '10:00',
          endTime: '12:00',
        })
        .expect(403);
    });

    it('Patient CAN query doctor availability for a date with doctorId', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/doctor/availability/date?date=2026-06-15&doctorId=${doctorProfileId}`,
        )
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const body = res.body as DateAvailabilityResponse;
      expect(body.date).toBe('2026-06-15');
      expect(body.isOverride).toBe(true);
    });
  });

  describe('Deletion Clean-up', () => {
    it('DELETE /doctor/availability/override/:id should delete custom override', async () => {
      await request(app.getHttpServer())
        .delete(`/doctor/availability/override/${overrideSlotId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);
    });

    it('DELETE /doctor/availability/:id should delete recurring slot', async () => {
      await request(app.getHttpServer())
        .delete(`/doctor/availability/${recurringSlotId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);
    });
  });
});
