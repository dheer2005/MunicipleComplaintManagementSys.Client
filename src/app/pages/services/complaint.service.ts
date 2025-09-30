import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  // private apiUrl = 'https://localhost:7082/api/Complaint';
  private apiUrl = 'https://nogoxo.bsite.net/api/Complaint';

  constructor(private http: HttpClient) { }

  createComplaint(complaintData: any) {
    return this.http.post<any>(`${this.apiUrl}/Create-complaint`, complaintData);
  }

  getAllComplaintsByUserId(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/Get-Complaint/userId/${userId}`);
  }


  submitFeedback(feedbackData: any) {
    return this.http.post<any>(`${this.apiUrl}/submit-feedback`, feedbackData);
  }

  reopenComplaint(complaintId: string) {
    return this.http.put<any>(`${this.apiUrl}/reopen-complaint/${complaintId}`, {});
  }

  updateComplaintStatus(complaintId: string, status: string){
    return this.http.put<any>(`${this.apiUrl}/update-status/${complaintId}`, { status });
  }


  deleteComplaint(complaintId: string){
    return this.http.delete<any>(`${this.apiUrl}/delete-complaint/${complaintId}`);
  }

  editComplaint(complaintId: string, complaint: any){
    return this.http.put<any>(`${this.apiUrl}/edit-complaint/${complaintId}`, complaint);
  }

  deleteComplaintAttachment(complaintId: string, attachmentId: number){
    return this.http.delete(`${this.apiUrl}/delete-complaint-attachments/${complaintId}/${attachmentId}`);
  }
  
}
