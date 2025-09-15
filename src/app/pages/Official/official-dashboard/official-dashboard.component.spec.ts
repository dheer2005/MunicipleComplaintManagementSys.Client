import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficialDashboardComponent } from './official-dashboard.component';

describe('OfficialDashboardComponent', () => {
  let component: OfficialDashboardComponent;
  let fixture: ComponentFixture<OfficialDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OfficialDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficialDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
