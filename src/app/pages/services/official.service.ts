import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Department {
  departmentId: number;
  departmentName: string;
  totalComplaints: number;
  pendingComplaints: number;
  assignedComplaints: number;
  resolvedComplaints: number;
  overdueComplaints: number;
}

export interface ComplaintSummary {
  complaintId: string;
  ticketNo: string;
  citizenName: string;
  categoryName: string;
  subCategoryName: string;
  description: string;
  currentStatus: string;
  createdAt: Date;
  slaDueAt: Date;
  isOverdue: boolean;
  assignedWorkerName?: string;
}

export interface Worker {
  workerId: number;
  fullName: string;
  departmentId: number;
  isActive: boolean;
  currentAssignments: number;
}

export interface DashboardStats {
  totalComplaints: number;
  pendingComplaints: number;
  assignedComplaints: number;
  resolvedComplaints: number;
  overdueComplaints: number;
  totalDepartments: number;
  activeWorkers: number;
}

export interface AssignComplaintRequest {
  workerId: number;
}

export interface BulkAssignRequest {
  complaintIds: string[];
  workerId: number;
}

export interface ReassignComplaintRequest {
  newWorkerId: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfficialService {

  private apiUrl = 'https://localhost:7082/api/Official';

  constructor(private http: HttpClient) { }

  assignComplaint(complaintId: string, workerId: string) {
    return this.http.put<any>(`${this.apiUrl}/assign-complaint/${complaintId}`, { workerId });
  }

  deleteComplaint(complaintId: string){
    return this.http.delete(`${this.apiUrl}/delete-complaint/${complaintId}`);
  }


  // Department Management
  getDepartmentsOverview(userId: string): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/departments-overview/${userId}`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard-stats`);
  }

  // Worker Management
  getWorkersByDepartment(departmentId: number): Observable<Worker[]> {
    return this.http.get<Worker[]>(`${this.apiUrl}/workers-by-department/${departmentId}`);
  }

  // Complaint Management
  getComplaintSummaryByDepartment(departmentId: number): Observable<ComplaintSummary[]> {
    return this.http.get<ComplaintSummary[]>(`${this.apiUrl}/complaint-summary-by-department/${departmentId}`);
  }

  bulkAssignComplaints(request: BulkAssignRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/bulk-assign-complaints`, request);
  }

  reassignComplaint(complaintId: string, request: ReassignComplaintRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/reassign-complaint/${complaintId}`, request);
  }

  // Export functionality
  exportComplaintsByDepartment(departmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/complaints-export/${departmentId}`);
  }

  // Additional utility methods
  getComplaintsByStatus(departmentId: number, status: string): Observable<ComplaintSummary[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<ComplaintSummary[]>(`${this.apiUrl}/complaint-summary-by-department/${departmentId}`, { params });
  }

  getOverdueComplaints(departmentId?: number): Observable<ComplaintSummary[]> {
    let url = `${this.apiUrl}/overdue-complaints`;
    if (departmentId) {
      url += `/${departmentId}`;
    }
    return this.http.get<ComplaintSummary[]>(url);
  }

  // Search and filter methods
  searchComplaints(searchTerm: string, departmentId?: number): Observable<ComplaintSummary[]> {
    let params = new HttpParams().set('search', searchTerm);
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get<ComplaintSummary[]>(`${this.apiUrl}/search-complaints`, { params });
  }

  // Statistics methods
  getDepartmentPerformanceStats(departmentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/department-performance/${departmentId}`);
  }

  getWorkerPerformanceStats(workerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/worker-performance/${workerId}`);
  }

  getAssignedOfficialForAllDepartments(departmentId: number){
    return this.http.get(`${this.apiUrl}/assignedOfficialsByDepartmentId/${departmentId}`);
  }

  getAllOfficials(departmentId: number){
    return this.http.get(`${this.apiUrl}/GetAllUnassignedOfficialsForDepartment/${departmentId}`);
  }

}
