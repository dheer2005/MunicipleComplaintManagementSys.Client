import { TestBed } from '@angular/core/testing';

import { OfficialService } from './official.service';

describe('OfficialService', () => {
  let service: OfficialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
