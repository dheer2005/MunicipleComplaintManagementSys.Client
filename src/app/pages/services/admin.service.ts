import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalComplaints: number;
  complaintByStatus: { status: string; count: number }[];
  overDueComplaints: number;
  totalDepartments: number;
  totalWorkers: number;
  activeWorkers: number;
  totalCitizens: number;
  totalOfficials: number;
}

export interface RecentComplaints {
  recentSubmittedComplaints: Complaint[];
  recentResolvedComplaints: Complaint[];
}

export interface Complaint {
  complaintId: number;
  title: string;
  description: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string;
  citizenId: number;
  departmentId: number;
  assignedWorkerId?: number;
}

export interface CitizenInfo {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  totalComplaints: number;
  totalResolvedComplaints: number;
}

export interface WorkerInfo {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  totalAssignedComplaints: number;
  totalResolvedComplaints: number;
  totalPendingComplaints: number;
}

export interface OfficialInfo {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface DepartmentOverview {
  departmentId: number;
  totalComplaint: number;
  complaintStatus: { status: string; count: number }[];
  overDueComplaint: number;
  slaCompliance: {
    met: number;
    missed: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = `https://localhost:7082/api/Admin`;
  private auditUrl = `https://localhost:7082/api/Audit`;

  constructor(private http: HttpClient) { }
 
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard-stats`);
  }
 
  getRecentComplaints(): Observable<RecentComplaints> {
    return this.http.get<RecentComplaints>(`${this.baseUrl}/recent-complaints`);
  }
 
  getDepartmentOverview(departmentId: number): Observable<DepartmentOverview> {
    return this.http.get<DepartmentOverview>(`${this.baseUrl}/departments-overview/${departmentId}`);
  }
 
  getCitizensInfo(): Observable<CitizenInfo[]> {
    return this.http.get<CitizenInfo[]>(`${this.baseUrl}/Citizens`);
  }
 
  getWorkersInfo(): Observable<WorkerInfo[]> {
    return this.http.get<WorkerInfo[]>(`${this.baseUrl}/workers`);
  }
 
  getOfficialsInfo(): Observable<OfficialInfo[]> {
    return this.http.get<OfficialInfo[]>(`${this.baseUrl}/Official`);
  }

  getAllComplaint(){
    return this.http.get(`${this.baseUrl}/Get-complaints`);
  }

  getAllAuditLogs(){
    return this.http.get(`${this.auditUrl}/GetAllAuditlogs`);
  }

  assignOfficial(officialId: string, departmentId: number){
    return this.http.get(`${this.baseUrl}/assignOfficialToDepartment/${officialId}/${departmentId}`);
  }

  unAssignOfficial(officialId: string, departmentId: number){
    return this.http.get(`${this.baseUrl}/unAssignOfficialFromDepartment/${officialId}/${departmentId}`)
  }
}