import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { OfficialService } from '../../services/official.service';
import { DepartmentService } from '../../services/department.service';

@Component({
  selector: 'app-add-departments',
  templateUrl: './add-departments.component.html',
  styleUrls: ['./add-departments.component.css']
})
export class AddDepartmentsComponent implements OnInit {
  departments: { departmentId: number, departmentName: string }[] = [];

  newDepartment = { departmentName: ''};
  selectedCategoryDepartmentId: number = -1;
  newCategory = {
    departmentId: this.selectedCategoryDepartmentId,
    categoryName: '',
    defaultSlaHours: 48
   };
  newSubCategory = { categoryId: this.selectedCategoryDepartmentId, subCategoryName: '', slaHours: 24 };
  categories: any[] = [];

  constructor(private deptSvc: DepartmentService, private officialSvc: OfficialService, private toastrSvc: ToastrService, private adminSvc: AdminService, private authSvc: AuthService, private apiSvc: ApiService) { }

  ngOnInit(): void {
    this.loadDepartments();
  }

  createDepartment() {
    this.deptSvc.createNewDepartment(this.newDepartment).subscribe({
      next: (res:any)=>{
        this.toastrSvc.success(`${res.message}`);
        this.loadDepartments();
        this.newDepartment = {departmentName: ''};
        this.onCategoryDepartmentChange();
      },
      error: (err:any)=>{
        this.toastrSvc.error(`${err.error.message}`);
      }
    })
  }
  onCategoryDepartmentChange() {
    this.deptSvc.getAllCategoriesbyDepartment(this.selectedCategoryDepartmentId).subscribe({
      next: (res:any) =>{
        this.categories = res;
      },
      error: (err:any)=>{
        this.toastrSvc.error("Failed to load categories ");
      }
    });
  }
  createCategory() {
    const newCategoryObj = {
      ...this.newCategory,
      departmentId: this.selectedCategoryDepartmentId
    }
    this.deptSvc.createNewCategory(newCategoryObj).subscribe({
      next: (res:any)=>{
        this.toastrSvc.success(`${res.message}`);
        this.newCategory.categoryName = '';
        this.onCategoryDepartmentChange();
      },
      error: (err:any)=>{
        this.toastrSvc.error(`${err.error.message}`);
      }
    });
  }
  createSubCategory() {
    this.deptSvc.createNewSubCategory(this.newSubCategory).subscribe({
      next: (res:any)=>{
        this.toastrSvc.success(`${res.message}`);
        this.newSubCategory.subCategoryName = '';
        this.onCategoryDepartmentChange();
      },
      error: (err:any)=>{
        this.toastrSvc.error(`${err.error.message}`);
      }
    });
  }
  deleteCategory(categoryId: number) {
    this.adminSvc.deleteCategory(categoryId).subscribe({
      next: (res:any)=>{
        this.toastrSvc.success(`${res.message}`);
        this.onCategoryDepartmentChange();
      },
      error: (err:any)=>{
        this.toastrSvc.error(`${err.error.message}`);
      }
    })
  }
  deleteSubCategory(subCategoryId: number) {
    this.adminSvc.deleteSubCategory(subCategoryId).subscribe({
      next: (res:any)=>{
        this.toastrSvc.success(`${res.message}`);
        this.loadDepartments();
        this.onCategoryDepartmentChange();
      },
      error: (err:any)=>{
        this.toastrSvc.error(`${err.error.message}`);
      }
    })
  }

  loadDepartments(){
    this.deptSvc.getAllDepartments().subscribe({
      next: (res:any)=>{
        this.departments = res;
      },
      error: (err)=>{
        console.log(err);
        this.toastrSvc.error("Failed to load departments");
      }
    });
  }

}
