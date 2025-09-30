import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  // private apiUrl = 'https://localhost:7082/api/Department';
  private apiUrl = 'https://nogoxo.bsite.net/api/Department';

  constructor(private http: HttpClient) { }

  createNewDepartment(departmentData: any) {
    return this.http.post<any>(`${this.apiUrl}/create`, departmentData);
  }

  deleteDepartment(departmentId: number) {
    return this.http.delete<any>(`${this.apiUrl}/delete/${departmentId}`);
  }

  updateDepartment(departmentId: number, departmentData: any) {
    return this.http.put<any>(`${this.apiUrl}/update/${departmentId}`, departmentData);
  }

  createNewCategory(categoryData: any) {
    return this.http.post<any>(`${this.apiUrl}/categories/create`, categoryData);
  }

  createNewSubCategory(subCategoryData: any) {
    return this.http.post<any>(`${this.apiUrl}/category/sub-category/create`, subCategoryData);
  }

  getAllDepartments() {
    return this.http.get<any[]>(`${this.apiUrl}/getAllDepartments`);
  }

  getAllCategoriesbyDepartment(departmentId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/categories/departmentId/${departmentId}`);
  }

  getAllSubCategoriesbyCategory(categoryId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/Sub-category/by-CategoryId/${categoryId}`);
  }
}
