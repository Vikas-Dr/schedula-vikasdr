import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message:
        'Service running successfully and all the end points are working successfully',
      status: 'online',
      timestamp: new Date().toISOString(),
      service: 'Schedula Advanced Doctor Scheduling & Appointment API',
      version: '1.0.0',
      availableEndpoints: {
        auth: ['POST /auth/register', 'POST /auth/login'],
        doctor: [
          'POST /doctor/profile',
          'GET /doctor/profile',
          'POST /doctor/availability/recurring',
          'POST /doctor/availability/override',
          'GET /doctor/availability/date',
        ],
        patient: ['POST /patient/profile', 'GET /patient/profile'],
        appointments: [
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
