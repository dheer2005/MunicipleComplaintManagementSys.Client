import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { Worker } from 'cluster';
import { WorkerService } from '../../services/worker.service';

interface TaskComplaint {
  complaintId: string;
  ticketNo: string;
  citizenName: string;
  categoryName: string;
  subCategoryName?: string;
  description: string;
  currentStatus: string;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: Date;
  assignedAt: Date;
  slaDueAt: Date;
  updatedAt?: Date;
  latitude?: number;
  longitude?: number;
  addressText?: string;
  attachments: TaskAttachment[];
  isOverdue: boolean;
  daysSinceAssigned: number;
  daysUntilDue: number;
}

interface TaskAttachment {
  attachmentId: string;
  imageUrl: string;
  attachmentType: string;
  uploadedAt: Date;
}

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {

  // Data properties
  allTasks: TaskComplaint[] = [];
  filteredTasks: TaskComplaint[] = [];
  
  // Filter and sorting
  statusFilter = 'All';
  priorityFilter = 'All';
  overdueFilter = false;
  searchTerm = '';
  sortBy = 'assignedAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  // UI state
  loading = false;
  selectedTask: TaskComplaint | null = null;
  showTaskDetails = false;
  viewMode: 'list' | 'card' = 'list';
  
  // Worker info
  workerId: string | null = null;
  
  // Statistics
  taskStats = {
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0
  };

  constructor(
    private authService: AuthService,
    private toastrService: ToastrService,
    private workerService: WorkerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadMyTasks();
  }

  initializeComponent(): void {
    this.workerId = this.authService.getUserId();
    if (!this.workerId) {
      this.toastrService.error('Worker ID not found');
      this.router.navigate(['/login']);
    }
  }

  async loadMyTasks(): Promise<void> {
    this.loading = true;
    try {
      await this.fetchWorkerTasks();
      // this.calculateTaskPriorities();
      // this.calculateStatistics();
      // this.applyFilters();
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.toastrService.error('Failed to load your tasks');
    } finally {
      this.loading = false;
    }
  }

  async fetchWorkerTasks(): Promise<void> {
    this.workerService.getComplaintsForWorker(this.workerId!).subscribe((res: any[]) => {
      
      this.allTasks = res.map(c => {
        // calculate extra fields
        const assignedAt = new Date(c.updatedAt ?? c.createdAt);
        const slaDue = new Date(c.slaDueAt);
        const daysUntilDue = this.calculateDaysUntilDue(slaDue);
        const daysSinceAssigned = this.calculateDaysSinceAssigned(assignedAt);
        
        return {
          complaintId: c.complaintId,
          ticketNo: c.ticketNo,
          citizenName: c.citizenName,
          categoryName: c.categoryName,
          subCategoryName: c.subCategoryName,
          description: c.description,
          currentStatus: c.currentStatus,
          priority: (daysUntilDue < 0 || daysUntilDue <= 1) ? 'High'
                  : (daysUntilDue <= 3 ? 'Medium' : 'Low'),
          createdAt: new Date(c.createdAt),
          assignedAt: assignedAt,
          slaDueAt: slaDue,
          updatedAt: new Date(c.updatedAt),
          latitude: c.latitude,
          longitude: c.longitude,
          addressText: c.addressText,
          attachments: (c.attachments || []).map((a: any) => ({
            attachmentId: a.attachmentId.toString(),
            imageUrl: a.imageUrl,
            attachmentType: a.attachmentType,
            uploadedAt: new Date(a.uploadedAt)
          })),
          isOverdue: daysUntilDue < 0,
          daysSinceAssigned: daysSinceAssigned,
          daysUntilDue: daysUntilDue
        } as TaskComplaint;
      });
      // console.log("tasks", this.allTasks);

      // baaki calculations
      this.calculateTaskPriorities();
      this.calculateStatistics();
      this.applyFilters();
    });
  }

  calculateTaskPriorities(): void {
    this.allTasks.forEach(task => {
      const daysUntilDue = this.calculateDaysUntilDue(task.slaDueAt);
      const daysSinceAssigned = this.calculateDaysSinceAssigned(task.assignedAt);
      
      task.daysUntilDue = daysUntilDue;
      task.daysSinceAssigned = daysSinceAssigned;
      task.isOverdue = daysUntilDue < 0;
      
      // Auto-calculate priority based on urgency if not set
      if (!task.priority) {
        if (task.isOverdue || daysUntilDue <= 1) {
          task.priority = 'High';
        } else if (daysUntilDue <= 3) {
          task.priority = 'Medium';
        } else {
          task.priority = 'Low';
        }
      }
    });
  }

  calculateDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateDaysSinceAssigned(assignedDate: Date): number {
    const today = new Date();
    const assigned = new Date(assignedDate);
    const diffTime = today.getTime() - assigned.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateStatistics(): void {
    this.workerService.getWorkerStats(this.workerId!).subscribe((res:any)=>{
      console.log("stats",res);
      this.taskStats = res;
      // this.workerService.getTaskPriority(this.workerId!).subscribe((res:any)=>{
      //   console.log("priority",res);
      //   this.taskPriority = res;
      // });
    });
    // this.taskStats = {
    //   total: this.allTasks.length,
    //   pending: this.allTasks.filter(t => t.currentStatus === 'Pending').length,
    //   inProgress: this.allTasks.filter(t => t.currentStatus === 'InProgress').length,
    //   resolved: this.allTasks.filter(t => t.currentStatus === 'Resolved').length,
    //   overdue: this.allTasks.filter(t => t.isOverdue).length
    // };
  }

  applyFilters(): void {
    this.filteredTasks = this.allTasks.filter(task => {
      const matchesStatus = this.statusFilter === 'All' || task.currentStatus === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'All' || task.priority === this.priorityFilter;
      const matchesOverdue = !this.overdueFilter || task.isOverdue;
      const matchesSearch = this.searchTerm === '' || 
        task.ticketNo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.citizenName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.categoryName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesOverdue && matchesSearch;
    });

    this.sortTasks();
    this.currentPage = 1; // Reset to first page when filters change
  }

  sortTasks(): void {
    this.filteredTasks.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = new Date(a.slaDueAt).getTime();
          bValue = new Date(b.slaDueAt).getTime();
          break;
        case 'assignedAt':
          aValue = new Date(a.assignedAt).getTime();
          bValue = new Date(b.assignedAt).getTime();
          break;
        case 'status':
          aValue = a.currentStatus;
          bValue = b.currentStatus;
          break;
        default:
          aValue = a.assignedAt;
          bValue = b.assignedAt;
      }
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Event handlers
  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.sortTasks();
  }

  // Task actions
  viewTaskDetails(task: TaskComplaint): void {
    this.selectedTask = task;
    this.showTaskDetails = true;
  }

  closeTaskDetails(): void {
    this.selectedTask = null;
    this.showTaskDetails = false;
  }

  updateTaskStatus(task: TaskComplaint): void {
    this.router.navigate(['/worker/update-task', task.complaintId]);
  }

  viewOnMap(task: TaskComplaint): void {
    if (task.latitude && task.longitude) {
      const url = `https://www.google.com/maps?q=${task.latitude},${task.longitude}`;
      window.open(url, '_blank');
    } else {
      this.toastrService.warning('Location coordinates not available for this task');
    }
  }

  refreshTasks(): void {
    this.loadMyTasks();
  }

  exportTasks(): void {
    // Implementation for exporting tasks
    this.toastrService.info('Export functionality will be implemented');
  }

  // Utility methods
  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'badge-warning';
      case 'inprogress': return 'badge-info';
      case 'resolved': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'fas fa-exclamation-triangle';
      case 'medium': return 'fas fa-exclamation-circle';
      case 'low': return 'fas fa-info-circle';
      default: return 'fas fa-circle';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'fas fa-clock';
      case 'inprogress': return 'fas fa-cog fa-spin';
      case 'resolved': return 'fas fa-check-circle';
      default: return 'fas fa-circle';
    }
  }

  // Pagination
  get paginatedTasks(): TaskComplaint[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTasks.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTasks.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages = [];
    const maxPages = Math.min(5, this.totalPages);
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getAbs(value: number): number {
    return Math.abs(value);
  }

  openAttachment(url: string): void {
    window.open(url, '_blank');
  }
}
