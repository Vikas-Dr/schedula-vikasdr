import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';

describe('Database Schema (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Sets environment variables for SQLite testing environment
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usersService = moduleFixture.get<UsersService>(UsersService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it('should successfully save and retrieve a Doctor with complete ER Diagram schema fields', async () => {
    const doctorData = {
      email: 'dr.john@test.com',
      password: 'hashedpassword',
      name: 'Dr. John',
      phone: '1234567890',
      role: 'doctor' as const,
      doctorProfile: {
        specialization: 'Neurology',
        bio: 'Expert in neurodegenerative disorders.',
        yearsOfExperience: '10',
      },
    };

    const savedUser = await usersService.createUser(doctorData);
    expect(savedUser.id).toBeDefined();
    expect(savedUser.email).toBe(doctorData.email);

    // Fetch from database to verify schema preservation
    const fetchedUser = await usersService.findOneById(savedUser.id);
    expect(fetchedUser).toBeDefined();
    expect(fetchedUser?.doctorProfile).toBeDefined();

    // Assert all doctor fields from the ER diagram schema
    const profile = fetchedUser?.doctorProfile;
    expect(profile?.specialization).toBe(
      doctorData.doctorProfile.specialization,
    );
    expect(profile?.bio).toBe(doctorData.doctorProfile.bio);
    expect(profile?.yearsOfExperience).toBe(
      doctorData.doctorProfile.yearsOfExperience,
    );
    expect(profile?.isVerified).toBe(false);
  });

  it('should successfully save and retrieve a Patient with complete ER Diagram schema fields', async () => {
    const patientData = {
      email: 'patient.bob@test.com',
      password: 'hashedpassword',
      name: 'Bob Smith',
      phone: '0987654321',
      role: 'patient' as const,
      patientProfile: {
        birthday: '1990-01-01',
        gender: 'Male',
        bloodType: 'O+',
        emergencyContact: '9119119111',
      },
    };

    const savedUser = await usersService.createUser(patientData);
    expect(savedUser.id).toBeDefined();
    expect(savedUser.email).toBe(patientData.email);

    // Fetch from database to verify schema preservation
    const fetchedUser = await usersService.findOneById(savedUser.id);
    expect(fetchedUser).toBeDefined();
    expect(fetchedUser?.patientProfile).toBeDefined();

    // Assert all patient fields from the ER diagram schema
    const profile = fetchedUser?.patientProfile;
    expect(profile?.birthday).toBe(patientData.patientProfile.birthday);
    expect(profile?.gender).toBe(patientData.patientProfile.gender);
    expect(profile?.bloodType).toBe(patientData.patientProfile.bloodType);
    expect(profile?.emergencyContact).toBe(
      patientData.patientProfile.emergencyContact,
    );
  });
});
