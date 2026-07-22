import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (userRole?: string): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : null,
        }),
      }),
    } as any;
  };

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    const context = createMockContext('patient');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['doctor']);
    const context = createMockContext('doctor');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['doctor']);
    const context = createMockContext('patient');

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if user is not attached to request', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['doctor']);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});
