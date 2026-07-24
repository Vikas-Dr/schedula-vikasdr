import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

interface AuthResponse {
  access_token: string;
}

interface DoctorProfileResponse {
  id: string;
  specialization?: string;
  yearsOfExperience?: string;
  qualification?: string;
  bio?: string;
  isVerified?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

interface PatientProfileResponse {
  id: string;
  age?: number;
  gender?: string;
  emergencyContact?: string;
  basicHealthInfo?: string;
  birthday?: string;
  bloodType?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

describe('Doctor and Patient Onboarding Flow (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let doctorToken: string;
  let patientToken: string;
  let newDoctorToken: string;

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
        email: 'onboarding.doctor@example.com',
        password: 'password123',
        name: 'Dr. Original',
        phone: '1112223333',
        role: 'doctor',
      });
    doctorToken = (docReg.body as AuthResponse).access_token;

    // Register a patient
    const patReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'onboarding.patient@example.com',
        password: 'password123',
        name: 'Patient Original',
        phone: '4445556666',
        role: 'patient',
      });
    patientToken = (patReg.body as AuthResponse).access_token;

    // Register a second doctor (no profile yet) to test 404
    const newDocReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'new.doctor@example.com',
        password: 'password123',
        name: 'Dr. New',
        phone: '7778889999',
        role: 'doctor',
      });
    newDoctorToken = (newDocReg.body as AuthResponse).access_token;
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Doctor Profile APIs (/doctor/profile)', () => {
    it('GET /doctor/profile should return 404 when profile does not exist yet', async () => {
      await request(app.getHttpServer())
        .get('/doctor/profile')
        .set('Authorization', `Bearer ${newDoctorToken}`)
        .expect(404);
    });

    it('PATCH /doctor/profile should return 404 when profile does not exist yet', async () => {
      await request(app.getHttpServer())
        .patch('/doctor/profile')
        .set('Authorization', `Bearer ${newDoctorToken}`)
        .send({ specialization: 'Cardiology' })
        .expect(404);
    });

    it('POST /doctor/profile should create a new doctor profile successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/doctor/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          name: 'Dr. Sarah Connor',
          specialization: 'Cardiology',
          experience: '8 years',
          qualification: 'MD, FACC',
          profileDetails: 'Cardiologist with 8+ years of experience.',
        })
        .expect(201);

      const body = res.body as DoctorProfileResponse;
      expect(body.id).toBeDefined();
      expect(body.specialization).toBe('Cardiology');
      expect(body.yearsOfExperience).toBe('8 years');
      expect(body.qualification).toBe('MD, FACC');
      expect(body.bio).toBe('Cardiologist with 8+ years of experience.');
      expect(body.user.name).toBe('Dr. Sarah Connor');
      expect(body.user.role).toBe('doctor');
    });

    it('POST /doctor/profile should fail with 409 Conflict if profile already exists', async () => {
      await request(app.getHttpServer())
        .post('/doctor/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialization: 'Neurology',
        })
        .expect(409);
    });

    it('GET /doctor/profile should retrieve current doctor profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/doctor/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const body = res.body as DoctorProfileResponse;
      expect(body.specialization).toBe('Cardiology');
      expect(body.qualification).toBe('MD, FACC');
    });

    it('PATCH /doctor/profile should update doctor profile details', async () => {
      const res = await request(app.getHttpServer())
        .patch('/doctor/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          specialization: 'Cardiology',
          experience: '10 years',
        })
        .expect(200);

      const body = res.body as DoctorProfileResponse;
      expect(body.yearsOfExperience).toBe('10 years');
      expect(body.specialization).toBe('Cardiology');
    });
  });

  describe('Patient Profile APIs (/patient/profile)', () => {
    it('POST /patient/profile should create a new patient profile successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/patient/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Jane Doe',
          age: 30,
          gender: 'Female',
          contactDetails: '9998887777',
          basicHealthInfo: 'No known allergies. Regular fitness routine.',
          bloodType: 'O+',
        })
        .expect(201);

      const body = res.body as PatientProfileResponse;
      expect(body.id).toBeDefined();
      expect(body.age).toBe(30);
      expect(body.gender).toBe('Female');
      expect(body.emergencyContact).toBe('9998887777');
      expect(body.basicHealthInfo).toBe(
        'No known allergies. Regular fitness routine.',
      );
      expect(body.user.name).toBe('Jane Doe');
      expect(body.user.role).toBe('patient');
    });

    it('POST /patient/profile should fail with 409 Conflict if profile already exists', async () => {
      await request(app.getHttpServer())
        .post('/patient/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          age: 31,
        })
        .expect(409);
    });

    it('GET /patient/profile should retrieve current patient profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/patient/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const body = res.body as PatientProfileResponse;
      expect(body.age).toBe(30);
      expect(body.gender).toBe('Female');
    });

    it('PATCH /patient/profile should update patient profile details', async () => {
      const res = await request(app.getHttpServer())
        .patch('/patient/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          age: 31,
          basicHealthInfo: 'Asthma in cold weather.',
        })
        .expect(200);

      const body = res.body as PatientProfileResponse;
      expect(body.age).toBe(31);
      expect(body.basicHealthInfo).toBe('Asthma in cold weather.');
    });
  });

  describe('Role Protection', () => {
    it('Patient should be forbidden from accessing Doctor onboarding APIs', async () => {
      await request(app.getHttpServer())
        .post('/doctor/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ specialization: 'Dermatology' })
        .expect(403);

      await request(app.getHttpServer())
        .get('/doctor/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch('/doctor/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ specialization: 'Dermatology' })
        .expect(403);
    });

    it('Doctor should be forbidden from accessing Patient onboarding APIs', async () => {
      await request(app.getHttpServer())
        .post('/patient/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ age: 40 })
        .expect(403);

      await request(app.getHttpServer())
        .get('/patient/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch('/patient/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ age: 40 })
        .expect(403);
    });

    it('Unauthenticated requests should return 401 Unauthorized', async () => {
      await request(app.getHttpServer()).get('/doctor/profile').expect(401);
      await request(app.getHttpServer()).get('/patient/profile').expect(401);
    });
  });
});
