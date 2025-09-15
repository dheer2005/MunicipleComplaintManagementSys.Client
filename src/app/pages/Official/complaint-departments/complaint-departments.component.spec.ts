import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplaintDepartmentsComponent } from './complaint-departments.component';

describe('ComplaintDepartmentsComponent', () => {
  let component: ComplaintDepartmentsComponent;
  let fixture: ComponentFixture<ComplaintDepartmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComplaintDepartmentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplaintDepartmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
