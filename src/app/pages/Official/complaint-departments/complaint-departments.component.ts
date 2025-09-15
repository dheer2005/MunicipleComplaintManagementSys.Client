import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OfficialService } from '../../services/official.service';

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



@Component({
  selector: 'app-complaint-departments',
  templateUrl: './complaint-departments.component.html',
  styleUrls: ['./complaint-departments.component.css']
})
export class ComplaintDepartmentsComponent implements OnInit {
  
  departments: Department[] = [];
  selectedDepartment: Department | null = null;
  departmentComplaints: ComplaintSummary[] = [];
  availableWorkers: Worker[] = [];
  
  loading = false;
  selectedComplaintId: string | null = null;
  selectedWorkerId: number | null = null;
  showAssignModal = false;
  
  // Filter options
  statusFilter = 'All';
  priorityFilter = 'All';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  constructor(private router: Router, private authSvc:AuthService, private OfficialSvc: OfficialService) { }

  ngOnInit(): void {
    this.loadDepartments();
  }

  async loadDepartments(): Promise<void> {
    this.loading = true;
    try {
      this.OfficialSvc.getDepartmentsOverview().subscribe((data: Department[]) => {
        this.departments = data;
        console.log("getDepartmentsOverview:", data);
      });
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      this.loading = false;
    }
  }

  async selectDepartment(department: Department): Promise<void> {
    this.selectedDepartment = department;
    this.loading = true;
    
    try {
      this.OfficialSvc.getComplaintSummaryByDepartment(department.departmentId).subscribe((data: ComplaintSummary[]) => {
        console.log("getComplaintSummaryByDepartment:", data);
        this.departmentComplaints = data;
      }); 
      
      await this.loadAvailableWorkers(department.departmentId);
      
    } catch (error) {
      console.error('Error loading department complaints:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadAvailableWorkers(departmentId: number): Promise<void> {
    try {
      this.OfficialSvc.getWorkersByDepartment(departmentId).subscribe((data: Worker[]) => {
        this.availableWorkers = data;
      });
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  }

  openAssignModal(complaintId: string): void {
    this.selectedComplaintId = complaintId;
    this.selectedWorkerId = null;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedComplaintId = null;
    this.selectedWorkerId = null;
  }

  async assignComplaint(): Promise<void> {
    if (!this.selectedComplaintId || !this.selectedWorkerId) {
      alert('Please select a worker');
      return;
    }

    try {
      this.OfficialSvc.assignComplaint(this.selectedComplaintId, this.selectedWorkerId.toString()).subscribe(); 
      
      // Refresh the complaints list
      if (this.selectedDepartment) {
        await this.selectDepartment(this.selectedDepartment);
      }
      
      this.closeAssignModal();
      alert('Complaint assigned successfully!');
      
    } catch (error) {
      console.error('Error assigning complaint:', error);
      alert('Error assigning complaint. Please try again.');
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'assigned': return 'status-assigned';
      case 'inprogress': return 'status-inprogress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      case 'reopened': return 'status-reopened';
      default: return 'status-default';
    }
  }

  getPriorityClass(isOverdue: boolean): string {
    return isOverdue ? 'priority-high' : 'priority-normal';
  }

  viewComplaintDetails(complaintId: string): void {
    this.router.navigate(['/complaint-details', complaintId]);
  }

  get filteredComplaints(): ComplaintSummary[] {
    return this.departmentComplaints.filter(complaint => {
      const matchesStatus = this.statusFilter === 'All' || complaint.currentStatus === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'All' || 
        (this.priorityFilter === 'High' && complaint.isOverdue) ||
        (this.priorityFilter === 'Normal' && !complaint.isOverdue);
      const matchesSearch = this.searchTerm === '' || 
        complaint.ticketNo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        complaint.citizenName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  get paginatedComplaints(): ComplaintSummary[] {
    const filtered = this.filteredComplaints;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredComplaints.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  exportToCSV(): void {
    // Implementation for CSV export
    console.log('Exporting to CSV...');
  }

  refreshData(): void {
    if (this.selectedDepartment) {
      this.selectDepartment(this.selectedDepartment);
    } else {
      this.loadDepartments();
    }
  }
}