import { TestBed } from '@angular/core/testing';

import { UnauthguardGuard } from './unauthguard.guard';

describe('UnauthguardGuard', () => {
  let guard: UnauthguardGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(UnauthguardGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
