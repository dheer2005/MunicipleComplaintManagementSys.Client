import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { AdminService, DepartmentOverview } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css']
})
export class DepartmentsComponent implements OnInit {
  departments: { departmentId: number, departmentName: string }[] = [];
  selectedDepartmentId!: number;
  overview!: DepartmentOverview;

  //chat.js
  pieChartOptions: ChartOptions = { 
    responsive: true 
  };

  pieChartLabels: string[] = [];
  pieChartType: ChartType = 'doughnut';
  pieChartData!: ChartData<'doughnut', number[], string>;
  totalDepartmentComplaints: number = 0;
  

  constructor(private deptSvc: DepartmentService, private toastrSvc: ToastrService, private adminSvc: AdminService, private authSvc: AuthService, private apiSvc: ApiService) { }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(){
    this.deptSvc.getAllDepartments().subscribe({
      next: (res:any)=>{
        this.departments = res;
        if(res.length){
          this.selectedDepartmentId = res[0].departmentId;
          this.loadDepartmentsOverView(this.selectedDepartmentId);
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
