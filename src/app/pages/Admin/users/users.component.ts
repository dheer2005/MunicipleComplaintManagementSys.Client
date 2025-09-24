import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api.service';
import { DepartmentService } from '../../services/department.service';
import { AuthService } from '../../services/auth.service';
import { NgForm } from '@angular/forms';

declare var bootstrap: any;

export enum UserRole{
  Citizen = 0,
  Official = 1,
  Worker = 2,
  Admin = 3
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  workers: any[] = [];
  officials: any[] = [];
  generalUsers: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;


  newWorker: any = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.Worker,
    departmentId: null
  };
  newOfficial: any = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.Official,
    departmentId: null
  };
  departments: any[] = [];
  confirmPasswordWorker: string = '';
  confirmPasswordOfficial: string = '';

  constructor(private adminSvc: AdminService, private toastrSvc: ToastrService, private apiSvc: ApiService, private deptSvc: DepartmentService, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.deptSvc.getAllDepartments().subscribe({
      next: (res:any) => {
        this.departments = res;
      },
      error: (err) => {
        console.error('Failed to load departments', err);
      }
    });
    this.loadUsers();
  }

  getUserRole(roleNumber: string): string{
    return UserRole[Number(roleNumber)] || 'Unknown'
  }

  loadUsers(){
    this.isLoading = true;
    this.error = null;

    this.adminSvc.getOfficialsInfo().subscribe({
      next: (res:any) => this.officials = res,
      error: (err:any) => this.toastrSvc.error("Failed to load the officials info")
    });

    this.adminSvc.getWorkersInfo().subscribe({
      next: (res:any) => this.workers = res.sort((a:any,b:any)=>{
        return b.totalAssignedComplaints - a.totalAssignedComplaints
      }),
      error: (err:any) => this.toastrSvc.error("Failed to load workers info")
    });

    this.adminSvc.getCitizensInfo().subscribe({
      next: (res:any) => this.generalUsers = res,
      error: (err:any) => this.toastrSvc.error("Failed to load citizens info")
    });

    this.isLoading = false;
  }




  openWorkerModal() {
    const modal = new bootstrap.Modal(document.getElementById('workerModal'));
    modal.show();
  }

  openOfficialModal() {
    const modal = new bootstrap.Modal(document.getElementById('officialModal'));
    modal.show();
  }

  onAddWorker(form: NgForm) {
    const workerPayload = {
      ...this.newWorker,
      phone: this.newWorker.phone?.toString()
    }
      this.apiSvc.register(workerPayload).subscribe({
      next: (res) => {
        const auditObj = {
          userId: res.userId,
          action: 'Register',
          ActionResult: `New Worker registered successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        form.resetForm();
        this.toastrSvc.success(`Worker Registration successful!`, "Success");

      },
      error: (err) => {
        const auditObj = {
          userId: '',
          action: 'Register',
          ActionResult: `Failed to register new Worker`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastrSvc.error(err.error, "Error");
      }
    });
  }

  onAddOfficial(form: NgForm) {
    const officialPayload = {
      ...this.newOfficial,
      phone: this.newOfficial.phone?.toString()
    }
    this.apiSvc.register(officialPayload).subscribe({
      next: (res) => {
        const auditObj = {
          userId: res.userId,
          action: 'Register',
          ActionResult: `New Official registered successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        form.resetForm();
        this.toastrSvc.success(`Official Registration successful!`, "Success");
      },
      error: (err) => {
        const auditObj = {
          userId: '',
          action: 'Register',
          ActionResult: `Failed to register new Official`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastrSvc.error(err.error, "Error");
      }
    });
  }




}
