import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api.service';
import { DepartmentService } from '../../services/department.service';

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


  newWorker: any = {};
  newOfficial: any = {};
  departments: any[] = [];

  constructor(private adminSvc: AdminService, private toastrSvc: ToastrService, private apiSvc: ApiService, private deptSvc: DepartmentService) { }

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

  onAddWorker(form: any) {
    if(form.valid){
      // call API to add worker
      console.log('Worker data:', this.newWorker);
    }
  }

  onAddOfficial(form: any) {
    if(form.valid){
      // call API to add official
      console.log('Official data:', this.newOfficial);
    }
  }


}
