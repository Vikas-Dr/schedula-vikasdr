import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service health JSON with endpoint categories', () => {
      const res = appController.getHello();
      expect(res.message).toBe(
        'Service running successfully and all the end points are working successfully',
      );
      expect(res.status).toBe('success');
      expect(res.endpoints.doctor_apis).toBeDefined();
      expect(res.endpoints.patient_apis).toBeDefined();
    });
  });
});
