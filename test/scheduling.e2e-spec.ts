import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

interface AuthResponse {
  access_token: string;
}

describe('Advanced Doctor Scheduling System - Wave & Stream (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let streamDoctorToken: string;
  let waveDoctorToken: string;
  let patient1Token: string;
  let patient2Token: string;
  let streamDoctorId: string;
  let waveDoctorId: string;

  const testDate = '2030-06-15'; // Future date

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

    // Register Stream Doctor
    const streamDocReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'stream.doctor@example.com',
        password: 'password123',
        name: 'Dr. Stream',
        phone: '1111111111',
        role: 'doctor',
      });
    streamDoctorToken = (streamDocReg.body as AuthResponse).access_token;

    // Create Stream Doctor Profile
    const streamProfileRes = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${streamDoctorToken}`)
      .send({
        specialization: 'Psychiatry',
        schedulingType: 'STREAM',
      });
    streamDoctorId = streamProfileRes.body.id;

    // Register Wave Doctor
    const waveDocReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'wave.doctor@example.com',
        password: 'password123',
        name: 'Dr. Wave',
        phone: '2222222222',
        role: 'doctor',
      });
    waveDoctorToken = (waveDocReg.body as AuthResponse).access_token;

    // Create Wave Doctor Profile
    const waveProfileRes = await request(app.getHttpServer())
      .post('/doctor/profile')
      .set('Authorization', `Bearer ${waveDoctorToken}`)
      .send({
        specialization: 'General Physician',
        schedulingType: 'WAVE',
      });
    waveDoctorId = waveProfileRes.body.id;

    // Register Patient 1
    const pat1Reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'patient1@example.com',
        password: 'password123',
        name: 'Patient One',
        phone: '3333333333',
        role: 'patient',
      });
    patient1Token = (pat1Reg.body as AuthResponse).access_token;
    await request(app.getHttpServer())
      .post('/patient/profile')
      .set('Authorization', `Bearer ${patient1Token}`)
      .send({ age: 25, gender: 'Male' });

    // Register Patient 2
    const pat2Reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'patient2@example.com',
        password: 'password123',
        name: 'Patient Two',
        phone: '4444444444',
        role: 'patient',
      });
    patient2Token = (pat2Reg.body as AuthResponse).access_token;
    await request(app.getHttpServer())
      .post('/patient/profile')
      .set('Authorization', `Bearer ${patient2Token}`)
      .send({ age: 30, gender: 'Female' });
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Stream Scheduling Strategy', () => {
    it('Doctor can set Stream availability with slotDuration (15) and bufferTime (5)', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability/override')
        .set('Authorization', `Bearer ${streamDoctorToken}`)
        .send({
          date: testDate,
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'STREAM',
          slotDuration: 15,
          bufferTime: 5,
        })
        .expect(201);
    });

    it('Patient views discrete Stream slots (10:00-10:15, 10:20-10:35, 10:40-10:55)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/doctor/availability/date?date=${testDate}&doctorId=${streamDoctorId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .expect(200);

      expect(res.body.schedulingType).toBe('STREAM');
      expect(res.body.slots.length).toBe(3);
      expect(res.body.slots[0].appointmentTime).toBe('10:00 - 10:15');
      expect(res.body.slots[1].appointmentTime).toBe('10:20 - 10:35');
      expect(res.body.slots[2].appointmentTime).toBe('10:40 - 10:55');
    });

    it('Patient 1 books exact Stream slot (10:00-10:15)', async () => {
      const res = await request(app.getHttpServer())
        .post('/appointments/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: streamDoctorId,
          date: testDate,
          startTime: '10:00',
          endTime: '10:15',
          schedulingType: 'STREAM',
          reason: 'Checkup',
        })
        .expect(201);

      expect(res.body.schedulingType).toBe('STREAM');
      expect(res.body.startTime).toBe('10:00');
      expect(res.body.endTime).toBe('10:15');
      expect(res.body.status).toBe('CONFIRMED');
    });

    it('Patient 2 attempts to book same Stream slot (10:00-10:15) and gets 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/appointments/book')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({
          doctorId: streamDoctorId,
          date: testDate,
          startTime: '10:00',
          endTime: '10:15',
          schedulingType: 'STREAM',
        })
        .expect(409);
    });

    it('GET /doctor/availability/date shows 10:00-10:15 as BOOKED and 10:20-10:35 as AVAILABLE', async () => {
      const res = await request(app.getHttpServer())
        .get(`/doctor/availability/date?date=${testDate}&doctorId=${streamDoctorId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .expect(200);

      const slots = res.body.slots;
      expect(slots[0].status).toBe('BOOKED');
      expect(slots[0].isAvailable).toBe(false);
      expect(slots[1].status).toBe('AVAILABLE');
      expect(slots[1].isAvailable).toBe(true);
    });
  });

  describe('Wave Scheduling Strategy & Token Assignment', () => {
    it('Doctor can set Wave availability with maxCapacity = 2', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability/override')
        .set('Authorization', `Bearer ${waveDoctorToken}`)
        .send({
          date: testDate,
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'WAVE',
          maxCapacity: 2,
        })
        .expect(201);
    });

    it('Patient views Wave window and initial capacity (Available: 2/2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/doctor/availability/date?date=${testDate}&doctorId=${waveDoctorId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .expect(200);

      expect(res.body.schedulingType).toBe('WAVE');
      const wave = res.body.waves[0];
      expect(wave.timeWindow).toBe('10:00 - 11:00');
      expect(wave.maxCapacity).toBe(2);
      expect(wave.available).toBe(2);
      expect(wave.displayAvailability).toBe('Available: 2/2');
    });

    it('Patient 1 books Wave window and receives Token No: 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/appointments/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: waveDoctorId,
          date: testDate,
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'WAVE',
          reason: 'General Consultation',
        })
        .expect(201);

      expect(res.body.schedulingType).toBe('WAVE');
      expect(res.body.tokenNumber).toBe(1);
      expect(res.body.displayToken).toBe('Token No: 1');
      expect(res.body.timeWindow).toBe('10:00 - 11:00');
    });

    it('Patient 2 books Wave window and receives Token No: 2', async () => {
      const res = await request(app.getHttpServer())
        .post('/appointments/book')
        .set('Authorization', `Bearer ${patient2Token}`)
        .send({
          doctorId: waveDoctorId,
          date: testDate,
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'WAVE',
        })
        .expect(201);

      expect(res.body.schedulingType).toBe('WAVE');
      expect(res.body.tokenNumber).toBe(2);
      expect(res.body.displayToken).toBe('Token No: 2');
    });

    it('GET /doctor/availability/date shows Wave is FULL (Available: 0/2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/doctor/availability/date?date=${testDate}&doctorId=${waveDoctorId}`)
        .set('Authorization', `Bearer ${patient1Token}`)
        .expect(200);

      const wave = res.body.waves[0];
      expect(wave.available).toBe(0);
      expect(wave.status).toBe('FULL');
      expect(wave.isAvailable).toBe(false);
      expect(wave.displayAvailability).toBe('Available: 0/2');
    });

    it('Next booking attempt when Wave is full returns 409 Conflict', async () => {
      // Register Patient 3
      const pat3Reg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'patient3@example.com',
          password: 'password123',
          name: 'Patient Three',
          phone: '5555555555',
          role: 'patient',
        });
      const patient3Token = (pat3Reg.body as AuthResponse).access_token;
      await request(app.getHttpServer())
        .post('/patient/profile')
        .set('Authorization', `Bearer ${patient3Token}`)
        .send({ age: 40, gender: 'Male' });

      await request(app.getHttpServer())
        .post('/appointments/book')
        .set('Authorization', `Bearer ${patient3Token}`)
        .send({
          doctorId: waveDoctorId,
          date: testDate,
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'WAVE',
        })
        .expect(409);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('Invalid slotDuration (0) returns 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability/override')
        .set('Authorization', `Bearer ${streamDoctorToken}`)
        .send({
          date: '2030-07-01',
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'STREAM',
          slotDuration: 0,
        })
        .expect(400);
    });

    it('Negative bufferTime (-5) returns 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/doctor/availability/override')
        .set('Authorization', `Bearer ${streamDoctorToken}`)
        .send({
          date: '2030-07-01',
          startTime: '10:00',
          endTime: '11:00',
          schedulingType: 'STREAM',
          slotDuration: 15,
          bufferTime: -5,
        })
        .expect(400);
    });

    it('Booking a past date returns 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/appointments/book')
        .set('Authorization', `Bearer ${patient1Token}`)
        .send({
          doctorId: streamDoctorId,
          date: '2020-01-01',
          startTime: '10:00',
          endTime: '10:15',
          schedulingType: 'STREAM',
        })
        .expect(400);
    });
  });
});
