import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private baseUrl = `https://localhost:7082/api/Worker`;

  constructor(private http: HttpClient) { }

  getWorkerStats(workerId: string) {
    return this.http.get<any>(`${this.baseUrl}/worker-stats/${workerId}`);
  }

  getRecentTasks(workerId: string) {
    return this.http.get<any[]>(`${this.baseUrl}/worker-recent-tasks/${workerId}`);
  }

  getUpcomingDeadlines(workerId: string) {
    return this.http.get<any[]>(`${this.baseUrl}/worker-upcoming-deadlines/${workerId}`);
  }

  getTaskPriority(userId: string){
    return this.http.get<any[]>(`${this.baseUrl}/priority-stats/${userId}`);
  }

  getComplaintsForWorker(userId: string){
    return this.http.get<any[]>(`${this.baseUrl}/Get-complaint-for-worker/userId/${userId}`);
  }


  getComplaintDetails(complaintId: string) {
    return this.http.get(`${this.baseUrl}/Get-complaint/${complaintId}`);
  }
  getWorkHistory(complaintId: string) {
    return this.http.get(`${this.baseUrl}/get-work-history/${complaintId}`);
  }
  addWorkUpdate(complaintId: string, update: any) {
    return this.http.post(`${this.baseUrl}/add-work-update/${complaintId}`, update);
  }
}
