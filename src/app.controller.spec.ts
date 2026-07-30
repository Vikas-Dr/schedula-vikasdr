import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Request, Response } from 'express';

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
    it('should return service health JSON when called by API client', () => {
      const req = { headers: { accept: 'application/json' } } as unknown as Request;
      const res = {
        json: jest.fn().mockImplementation((data) => data),
      } as unknown as Response;

      const result = appController.getHello(req, res);
      expect(res.json).toHaveBeenCalled();
      expect(result.message).toBe(
        'Service running successfully and all the end points are working successfully',
      );
    });
  });
});
