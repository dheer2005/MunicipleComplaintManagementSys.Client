import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DepartmentService } from '../../services/department.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  @ViewChild('roleHighlight') roleHighlight!: ElementRef<HTMLElement>;
  @ViewChild('roleButtons') roleButtons!: ElementRef<HTMLElement>;

  roles = [
    { value: 0, label: 'Citizen' },
    { value: 1, label: 'Official' },
    { value: 2, label: 'Worker' },
    { value: 3, label: 'Admin' }
  ];

  registerData: any = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: -1,
    departmentId: null
  };
  confirmPassword: string = '';

  selectedRoleLabel = '';
  departments: any[] = [];
  errorMessage = '';

  constructor(
    private apiSvc: ApiService,
    private authSvc: AuthService,
    private router: Router,
    private deptSvc: DepartmentService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.deptSvc.getAllDepartments().subscribe({
      next: (res:any) => {
        this.departments = res;
      },
      error: (err) => {
        console.error('Failed to load departments', err);
      }
    });
  }


  selectRole(role: any) {
    this.registerData.role = role.value;
    this.selectedRoleLabel = role.label;

    // Wait DOM update before moving highlight
    setTimeout(() => this.moveHighlight(), 10);
  }

  moveHighlight() {
    const highlightEl = this.roleHighlight?.nativeElement;
    if (!highlightEl) return;

    const activeBtn = this.roleButtons.nativeElement.querySelector('.role-btn.active') as HTMLElement;
    if (!activeBtn) {
      highlightEl.style.width = '0';
      return;
    }

    const parentRect = this.roleButtons.nativeElement.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    highlightEl.style.width = `${btnRect.width}px`;
    highlightEl.style.left = `${btnRect.left - parentRect.left}px`;
  }

  onRegister() {
    const registerPayload = {
      ...this.registerData,
      phone: this.registerData.phone?.toString()
    }
    this.apiSvc.register(registerPayload).subscribe({
      next: (res) => {
        console.log(res);
        const auditObj = {
          userId: res.userId,
          action: 'Register',
          ActionResult: `New ${this.registerData.role} registered successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.success(`${this.selectedRoleLabel} Registration successful!`, "Success");

        this.router.navigate(['/lgin']);
      },
      error: (err) => {
        const auditObj = {
          userId: '',
          action: 'Register',
          ActionResult: `Failed to register new ${this.registerData.role}`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.errorMessage = err.error?.message || "Registration failed. Please try again.";
        this.toastr.error(this.errorMessage, "Error");
      }
    });
  }
}
