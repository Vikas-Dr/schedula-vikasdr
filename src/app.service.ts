import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'success',
      message:
        'Service running successfully and all the end points are working successfully',
      service: 'Schedula Advanced Doctor Scheduling & Appointment API',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth_apis: ['POST /auth/register', 'POST /auth/login'],
        doctor_apis: [
          'POST /doctor/profile',
          'GET /doctor/profile',
          'POST /doctor/availability/recurring',
          'POST /doctor/availability/override',
          'GET /doctor/availability/date',
        ],
        patient_apis: ['POST /patient/profile', 'GET /patient/profile'],
        appointment_apis: [
          'POST /appointments/book',
          'GET /appointments/patient',
          'GET /appointments/doctor',
          'PATCH /appointments/:id/cancel',
          'PATCH /appointments/:id/reschedule',
        ],
      },
    };
  }
}
