import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { AdminService, DepartmentOverview } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { OfficialService } from '../../services/official.service';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css']
})
export class DepartmentsComponent implements OnInit {
  departments: { departmentId: number, departmentName: string }[] = [];
  selectedDepartmentId!: number;
  overview!: DepartmentOverview;

  pieChartOptions: ChartOptions = { 
    responsive: true 
  };

  pieChartLabels: string[] = [];
  pieChartType: ChartType = 'doughnut';
  pieChartData!: ChartData<'doughnut', number[], string>;
  totalDepartmentComplaints: number = 0;
  selectedOfficialId: string | null = null;
  allOfficials: any[] = [];
  assignedOfficials: any[] = [];
  

  constructor(private deptSvc: DepartmentService, private officialSvc: OfficialService ,private toastrSvc: ToastrService, private adminSvc: AdminService, private authSvc: AuthService, private apiSvc: ApiService) { }

  ngOnInit(): void {
    this.loadDepartments();
    
  }

  

  assignOfficial(){
    console.log("selectedDepartmentID:", this.selectedDepartmentId);
    console.log("selectedofficialID:", this.selectedOfficialId);
    this.adminSvc.assignOfficial(this.selectedOfficialId!, this.selectedDepartmentId).subscribe({
      next: (res:any)=>{
        console.log(res);
        this.toastrSvc.success(`${res.message}`);
        this.loadAssignedOfficials(this.selectedDepartmentId);
        this.loadAllOfficial(this.selectedDepartmentId);
      },
      error: (err:any)=>{
        console.log(err);
        this.toastrSvc.error(`${err.error.message}`);
      }
    })
  }

  removeOfficial(officialId: string){
    if(confirm("Are you really want to unassign the official from this department")){
      this.adminSvc.unAssignOfficial(officialId, this.selectedDepartmentId).subscribe({
        next: (res:any)=>{
          this.loadAssignedOfficials(this.selectedDepartmentId);
          this.loadAllOfficial(this.selectedDepartmentId);
          this.toastrSvc.success(`${res.message}`);
        },
        error: (err:any)=>{
          this.toastrSvc.error(`${err.error.message}`);
        }
      });
    }
  }

  loadAllOfficial(departmentId: number){
    this.officialSvc.getAllOfficials(departmentId).subscribe({
      next: (res:any)=>{
        this.allOfficials = res;
        // console.log("officials:", this.allOfficials);
      },
      error: (err:any)=>{
        console.log("Failed to load all officials: ", err);
        this.toastrSvc.error("Falied to load all officials");
      }
    })
  }

  loadAssignedOfficials(departmentId: number){
    // console.log("departmentId:", departmentId);
    this.officialSvc.getAssignedOfficialForAllDepartments(departmentId).subscribe({
      next: (res:any)=>{
        this.assignedOfficials = res;
        // console.log("assigned Officials:", this.assignedOfficials);
      },
      error: (err:any)=>{
        console.log("failed to load assigned officials: ", err);
        this.toastrSvc.error("Failed to load assigned officials");
      }
    })
  }

  loadDepartments(){
    this.deptSvc.getAllDepartments().subscribe({
      next: (res:any)=>{
        this.departments = res;
        if(res.length){
          this.selectedDepartmentId = res[0].departmentId;
          this.loadDepartmentsOverView(this.selectedDepartmentId);
          this.loadAssignedOfficials(this.selectedDepartmentId);
          this.loadAllOfficial(this.selectedDepartmentId);
        }
      },
      error: (err)=>{
        console.log(err);
        this.toastrSvc.error("Failed to load departments");
      }
    });
  }

  onDepartmentChange(){
    this.loadDepartmentsOverView(this.selectedDepartmentId);
    this.loadAssignedOfficials(this.selectedDepartmentId);
    this.loadAllOfficial(this.selectedDepartmentId);
  }

  loadDepartmentsOverView(departmentId: number){
    this.adminSvc.getDepartmentOverview(departmentId).subscribe({
      next: (res:any)=>{
        this.overview = res;
        this.totalDepartmentComplaints = res.complaintStatus.reduce((acc:any,n:any)=> acc+n.count, 0)
        
        this.pieChartData = {
          labels: res.complaintStatus.map((c:any) => c.status),
          datasets: [
            {
              data: res.complaintStatus.map((c:any) => c.count),
              backgroundColor: [
                '#007bff',
                '#dc3545', 
                '#28a745', 
                '#ffc107', 
                '#6f42c1', 
                '#fd7e14', 
                '#20c997'
              ]
            }
          ]
        };
      },
      error: (err:any)=>{
        this.toastrSvc.error("Failed to load departmentOverview");
      }
    });
  }

}