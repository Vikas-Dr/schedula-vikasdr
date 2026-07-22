import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Doctor and Patient Onboarding Flow (e2e)', () => {
  let app: INestApplication;
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
    doctorToken = docReg.body.access_token;

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
    patientToken = patReg.body.access_token;

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
    newDoctorToken = newDocReg.body.access_token;
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
          consultationFee: '$150',
          availability: 'Mon-Fri 9AM-5PM',
          profileDetails: 'Cardiologist with 8+ years of experience.',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.specialization).toBe('Cardiology');
      expect(res.body.yearsOfExperience).toBe('8 years');
      expect(res.body.qualification).toBe('MD, FACC');
      expect(res.body.fee).toBe('$150');
      expect(res.body.availability).toBe('Mon-Fri 9AM-5PM');
      expect(res.body.bio).toBe('Cardiologist with 8+ years of experience.');
      expect(res.body.user.name).toBe('Dr. Sarah Connor');
      expect(res.body.user.role).toBe('doctor');
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

      expect(res.body.specialization).toBe('Cardiology');
      expect(res.body.qualification).toBe('MD, FACC');
    });

    it('PATCH /doctor/profile should update doctor profile details', async () => {
      const res = await request(app.getHttpServer())
        .patch('/doctor/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationFee: '$200',
          availability: 'Mon-Thu 10AM-4PM',
        })
        .expect(200);

      expect(res.body.fee).toBe('$200');
      expect(res.body.availability).toBe('Mon-Thu 10AM-4PM');
      expect(res.body.specialization).toBe('Cardiology');
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

      expect(res.body.id).toBeDefined();
      expect(res.body.age).toBe(30);
      expect(res.body.gender).toBe('Female');
      expect(res.body.emergencyContact).toBe('9998887777');
      expect(res.body.basicHealthInfo).toBe(
        'No known allergies. Regular fitness routine.',
      );
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.body.user.role).toBe('patient');
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

      expect(res.body.age).toBe(30);
      expect(res.body.gender).toBe('Female');
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

      expect(res.body.age).toBe(31);
      expect(res.body.basicHealthInfo).toBe('Asthma in cold weather.');
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
