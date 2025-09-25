import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { 
  OfficialService, 
  Department, 
  ComplaintSummary, 
  Worker, 
  AssignComplaintRequest, 
  BulkAssignRequest 
} from '../../services/official.service';
import { AuthService } from '../../services/auth.service';

interface UnassignedComplaint extends ComplaintSummary {
  selected?: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  daysSinceCreated?: number;
}

interface WorkerWithLoad extends Worker {
  workloadPercentage?: number;
  availabilityStatus?: 'Available' | 'Busy' | 'Overloaded';
}

@Component({
  selector: 'app-assign-complaints',
  templateUrl: './assign-complaints.component.html',
  styleUrls: ['./assign-complaints.component.css']
})
export class AssignComplaintsComponent implements OnInit {

  departments!: Department;
  selectedDepartmentId: number | null = null;
  selectedDepartment: Department | null = null;
  unassignedComplaints: UnassignedComplaint[] = [];
  availableWorkers: WorkerWithLoad[] = [];
  
  loading = false;
  assigningComplaint = false;
  showBulkAssignModal = false;
  showWorkerDetailsModal = false;
  
  selectedComplaintId: string | null = null;
  selectedWorkerId: number | null = null;
  selectedComplaints: string[] = [];
  bulkAssignWorkerId: number | null = null;
  selectedWorkerDetails: WorkerWithLoad | null = null;
  
  statusFilter = 'All';
  priorityFilter = 'All';
  categoryFilter = 'All';
  searchTerm = '';
  sortBy = 'createdAt';
  sortOrder = 'desc';
  currentPage = 1;
  itemsPerPage = 10;
  
  assignmentMode: 'individual' | 'bulk' | 'auto' = 'individual';
  autoAssignmentCriteria: 'workload' | 'random' | 'roundrobin' = 'workload';
  
  totalUnassigned = 0;
  overdueUnassigned = 0;
  highPriorityUnassigned = 0;
  currentUserId: string | null = null;

  constructor(
    private officialService: OfficialService,
    private authService: AuthService,
    private toastrService: ToastrService,
    private router: Router
  ) {
    this.currentUserId = this.authService.getUserId();
   }

  ngOnInit(): void {
    this.checkUserPermissions();
    this.loadDepartments();
  }

  checkUserPermissions(): void {
    const userRole = this.authService.getUserRole();
    if (userRole !== 'Official' && userRole !== 'Admin') {
      this.toastrService.error('Access denied. Only officials can assign complaints.');
      this.router.navigate(['/dashboard']);
      return;
    }
  }

  loadDepartments(){
    this.loading = true;
    try {
      this.officialService.getDepartmentsOverview(this.currentUserId).subscribe((res)=> {
        this.departments = res[0];
        this.selectDepartment(this.departments.departmentId);
      })
    } catch (error) {
      console.error('Error loading departments:', error);
      this.toastrService.error('Failed to load departments');
    } finally {
      this.loading = false;
    }
  }

  async selectDepartment(departmentId: number): Promise<void> {
    this.selectedDepartmentId = departmentId;
    this.selectedDepartment = this.departments;
    this.resetFiltersAndSelection();
    
    await Promise.all([
      this.loadUnassignedComplaints(departmentId),
      this.loadAvailableWorkers(departmentId)
    ]);
    
    this.calculateStatistics();
  }

  async loadUnassignedComplaints(departmentId: number): Promise<void> {
    this.loading = true;
    try {

      await this.officialService.getComplaintSummaryByDepartment(departmentId).subscribe((res:any)=>{
        const allComplaints = res;
        this.unassignedComplaints = allComplaints
        .filter((complaint:any) => complaint.currentStatus === 'Pending' && !complaint.assignedWorkerName)
        .map((complaint:any) => ({
          ...complaint,
          selected: false,
          priority: this.calculatePriority(complaint),
          daysSinceCreated: this.calculateDaysSinceCreated(complaint.createdAt)
        }));
        this.totalUnassigned = this.unassignedComplaints.length;
        this.overdueUnassigned = this.unassignedComplaints.filter(c=>c.isOverdue).length ?? 0;
        this.highPriorityUnassigned = this.unassignedComplaints.filter(c=>c.priority == 'High').length ?? 0;
      });
    } catch (error) {
      console.error('Error loading unassigned complaints:', error);
      this.toastrService.error('Failed to load unassigned complaints');
    } finally {
      this.loading = false;
    }
  }

  loadAvailableWorkers(departmentId: number) {
    try {
      this.officialService.getWorkersByDepartment(departmentId).subscribe((res:any)=>{
        const allWorkers = res;
        this.availableWorkers = allWorkers
        .filter((worker:any) => worker.isActive)
        .map((worker:any) => ({
          ...worker,
          workloadPercentage: this.calculateWorkloadPercentage(worker.currentAssignments),
          availabilityStatus: this.getAvailabilityStatus(worker.currentAssignments)
        }))
      })
        
    } catch (error) {
      console.error('Error loading workers:', error);
      this.toastrService.error('Failed to load available workers');
    }
  }

  calculatePriority(complaint: ComplaintSummary): 'High' | 'Medium' | 'Low' {
    const daysSinceCreated = this.calculateDaysSinceCreated(complaint.createdAt);
    
    if (complaint.isOverdue || daysSinceCreated > 7) {
      return 'High';
    } else if (daysSinceCreated > 3) {
      return 'Medium';
    }
    return 'Low';
  }

  calculateDaysSinceCreated(createdAt: Date): number {
    const today = new Date();
    const created = new Date(createdAt);
    return Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  calculateWorkloadPercentage(currentAssignments: number): number {
    const maxCapacity = 10; // Assume max 10 assignments per worker
    return Math.min((currentAssignments / maxCapacity) * 100, 100);
  }

  getAvailabilityStatus(currentAssignments: number): 'Available' | 'Busy' | 'Overloaded' {
    if (currentAssignments <= 3) return 'Available';
    if (currentAssignments <= 7) return 'Busy';
    return 'Overloaded';
  }

  calculateStatistics(): void {
    this.totalUnassigned = this.unassignedComplaints.length;
    this.overdueUnassigned = this.unassignedComplaints.filter(c => c.isOverdue).length;
    this.highPriorityUnassigned = this.unassignedComplaints.filter(c => c.priority === 'High').length;
  }

  assignComplaint(complaintId: string, workerId: number){
    if (this.assigningComplaint) return;
    
    this.assigningComplaint = true;
    try {
        this.officialService.assignComplaint(complaintId, workerId.toString()).subscribe({
          next: (res:any)=>{
            this.toastrService.success('Complaint assigned successfully!');
          },
          error : (err:any)=>{
            this.toastrService.error('Failed to assigned the complaint to the worker!');
          }
        }
      );
      
      if (this.selectedDepartmentId) {
        this.selectDepartment(this.selectedDepartmentId);
      }
      
      this.closeAssignModal();
      
    } catch (error) {
      console.error('Error assigning complaint:', error);
      this.toastrService.error('Failed to assign complaint. Please try again.');
    } finally {
      this.assigningComplaint = false;
    }
  }

  // async bulkAssignComplaints(): Promise<void> {
  //   if (!this.bulkAssignWorkerId || this.selectedComplaints.length === 0) {
  //     this.toastrService.warning('Please select complaints and a worker');
  //     return;
  //   }

  //   this.assigningComplaint = true;
  //   try {
  //     const request: BulkAssignRequest = {
  //       complaintIds: this.selectedComplaints,
  //       workerId: this.bulkAssignWorkerId
  //     };

  //     await this.officialService.bulkAssignComplaints(request).toPromise();
      
  //     this.toastrService.success(`${this.selectedComplaints.length} complaints assigned successfully!`);
      
  //     // Refresh data
  //     if (this.selectedDepartmentId) {
  //       await this.selectDepartment(this.selectedDepartmentId);
  //     }
      
  //     this.closeBulkAssignModal();
      
  //   } catch (error) {
  //     console.error('Error bulk assigning complaints:', error);
  //     this.toastrService.error('Failed to assign complaints. Please try again.');
  //   } finally {
  //     this.assigningComplaint = false;
  //   }
  // }

  autoAssignComplaints() {
    if (this.unassignedComplaints.length === 0 || this.availableWorkers.length === 0) {
      this.toastrService.warning('No complaints or workers available for auto-assignment');
      return;
    }

    this.assigningComplaint = true;
    try {
      let assignments: { complaintId: string, workerId: number }[] = [];
      
      switch (this.autoAssignmentCriteria) {
        case 'workload':
          assignments = this.createWorkloadBasedAssignments();
          break;
        case 'random':
          assignments = this.createRandomAssignments();
          break;
        case 'roundrobin':
          assignments = this.createRoundRobinAssignments();
          break;
      }

      for (const assignment of assignments) {
        this.officialService.assignComplaint(assignment.complaintId, assignment.workerId.toString()).toPromise();
      }

      this.toastrService.success(`${assignments.length} complaints auto-assigned successfully!`);
      
      if (this.selectedDepartmentId) {
       this.selectDepartment(this.selectedDepartmentId);
      }
      
    } catch (error) {
      console.error('Error auto-assigning complaints:', error);
      this.toastrService.error('Failed to auto-assign complaints');
    } finally {
      this.assigningComplaint = false;
    }
  }

  createWorkloadBasedAssignments(): { complaintId: string, workerId: number }[] {
    const assignments: { complaintId: string, workerId: number }[] = [];
    const sortedComplaints = [...this.filteredComplaints].sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (priorityOrder[b.priority!] || 0) - (priorityOrder[a.priority!] || 0);
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const availableWorkers = [...this.availableWorkers].filter(w => w.currentAssignments < 10);

    for (const complaint of sortedComplaints) {
      const worker = availableWorkers.find(w => w.currentAssignments < 10);
      if (worker) {
        assignments.push({ complaintId: complaint.complaintId, workerId: worker.workerId });
        worker.currentAssignments++;
      }
    }

    return assignments;
  }

  createRandomAssignments(): { complaintId: string, workerId: number }[] {
    const assignments: { complaintId: string, workerId: number }[] = [];
    const availableWorkers = this.availableWorkers.filter(w => w.currentAssignments < 10);

    for (const complaint of this.filteredComplaints) {
      const randomWorker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
      if (randomWorker) {
        assignments.push({ complaintId: complaint.complaintId, workerId: randomWorker.workerId });
      }
    }

    return assignments;
  }

  createRoundRobinAssignments(): { complaintId: string, workerId: number }[] {
    const assignments: { complaintId: string, workerId: number }[] = [];
    const availableWorkers = this.availableWorkers.filter(w => w.currentAssignments < 10);
    let currentWorkerIndex = 0;

    for (const complaint of this.filteredComplaints) {
      if (availableWorkers.length > 0) {
        const worker = availableWorkers[currentWorkerIndex % availableWorkers.length];
        assignments.push({ complaintId: complaint.complaintId, workerId: worker.workerId });
        currentWorkerIndex++;
      }
    }

    return assignments;
  }

  openAssignModal(complaintId: string): void {
    this.selectedComplaintId = complaintId;
    this.selectedWorkerId = null;
    this.assignmentMode = 'individual';
  }

  closeAssignModal(): void {
    this.selectedComplaintId = null;
    this.selectedWorkerId = null;
  }

  // openBulkAssignModal(): void {
  //   if (this.selectedComplaints.length === 0) {
  //     this.toastrService.warning('Please select complaints to assign');
  //     return;
  //   }
  //   this.showBulkAssignModal = true;
  //   this.bulkAssignWorkerId = null;
  // }

  // closeBulkAssignModal(): void {
  //   this.showBulkAssignModal = false;
  //   this.bulkAssignWorkerId = null;
  //   this.selectedComplaints = [];
  //   this.unassignedComplaints.forEach(c => c.selected = false);
  // }

  openWorkerDetails(worker: WorkerWithLoad): void {
    this.selectedWorkerDetails = worker;
    this.showWorkerDetailsModal = true;
  }

  closeWorkerDetailsModal(): void {
    this.selectedWorkerDetails = null;
    this.showWorkerDetailsModal = false;
  }

  toggleComplaintSelection(complaintId: string): void {
    const complaint = this.unassignedComplaints.find(c => c.complaintId === complaintId);
    if (complaint) {
      complaint.selected = !complaint.selected;
      if (complaint.selected) {
        this.selectedComplaints.push(complaintId);
      } else {
        this.selectedComplaints = this.selectedComplaints.filter(id => id !== complaintId);
      }
    }
  }

  selectAllComplaints(selectAll: boolean): void {
    this.filteredComplaints.forEach(complaint => {
      complaint.selected = selectAll;
    });
    
    if (selectAll) {
      this.selectedComplaints = this.filteredComplaints.map(c => c.complaintId);
    } else {
      this.selectedComplaints = [];
    }
  }

  resetFiltersAndSelection(): void {
    this.statusFilter = 'All';
    this.priorityFilter = 'All';
    this.categoryFilter = 'All';
    this.searchTerm = '';
    this.selectedComplaints = [];
    this.currentPage = 1;
  }

  // Computed properties
  get filteredComplaints(): UnassignedComplaint[] {
    return this.unassignedComplaints.filter(complaint => {
      const matchesPriority = this.priorityFilter === 'All' || complaint.priority === this.priorityFilter;
      const matchesSearch = this.searchTerm === '' || 
        complaint.ticketNo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        complaint.citizenName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        complaint.categoryName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesPriority && matchesSearch;
    });
  }

  get paginatedComplaints(): UnassignedComplaint[] {
    const filtered = this.filteredComplaints;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredComplaints.length / this.itemsPerPage);
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'priority-normal';
    }
  }

  getAvailabilityClass(status: string): string {
    switch (status) {
      case 'Available': return 'availability-available';
      case 'Busy': return 'availability-busy';
      case 'Overloaded': return 'availability-overloaded';
      default: return 'availability-unknown';
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewComplaintDetails(complaintId: string): void {
    this.router.navigate(['/complaint-details', complaintId]);
  }

  exportAssignments(): void {
    if (this.selectedDepartmentId) {
      // Implementation for exporting assignment data
      console.log('Exporting assignments for department:', this.selectedDepartmentId);
      this.toastrService.info('Export functionality will be implemented');
    }
  }
}