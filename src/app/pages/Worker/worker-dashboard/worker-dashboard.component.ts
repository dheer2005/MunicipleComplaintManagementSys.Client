import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { WorkerService } from '../../services/worker.service';

interface DashboardStats {
  totalAssigned: number;
  assigned: number;
  pending: number;
  inProgress: number;
  resolved: number;
  overdue: number;
}

interface TaskPriority {
  high: number;
  medium: number;
  low: number;
}

@Component({
  selector: 'app-worker-dashboard',
  templateUrl: './worker-dashboard.component.html',
  styleUrls: ['./worker-dashboard.component.css']
})
export class WorkerDashboardComponent implements OnInit {
  selectedComplaint: any = null;
  isComplaintModalOpen = false;

  stats: DashboardStats = {
    totalAssigned: 0,
    assigned: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0
  };
  
  taskPriority: TaskPriority = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  recentTasks: any[] = [];
  upcomingDeadlines: any[] = [];
  
  loading = false;
  workerId: string | null = null;
  workerName: string | null = null;
  
  statusChartData: any[] = [];
  priorityChartData: any[] = [];
  
  constructor(
    private authService: AuthService,
    private toastrService: ToastrService,
    private workerSvc: WorkerService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.checkUserPermissions();
    this.initializeWorker();
    this.loadDashboardData();
  }

  checkUserPermissions(): void {
    const userRole = this.authService.getUserRole();
    if (userRole !== 'Worker') {
      this.toastrService.error('Access denied. Only workers can access this dashboard.');
      this.router.navigate(['/login']);
      return;
    }
  }

  openComplaintModal(task: any): void {
    this.selectedComplaint = task;
    this.isComplaintModalOpen = true;
  }

  closeComplaintModal(): void {
    this.selectedComplaint = null;
    this.isComplaintModalOpen = false;
  }

  initializeWorker(): void {
    this.workerId = this.authService.getUserId();
    this.workerName = this.authService.getUserFullName();
  }
  

  loadDashboardData(){
    this.loading = true;
    try {
      this.loadWorkerStats();
      this.loadRecentTasks();
      this.loadUpcomingDeadlines();
      this.prepareChartData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.toastrService.error('Failed to load dashboard data');
    } finally {
      this.loading = false;
    }
  }

  loadWorkerStats(){
    this.workerSvc.getWorkerStats(this.workerId!).subscribe((res:any)=>{
      this.stats = res;
      console.log("dashboard stats:", this.stats)
      this.workerSvc.getTaskPriority(this.workerId!).subscribe((res:any)=>{
        this.taskPriority = res;
        console.log("worker task priority:", this.taskPriority);
      });
    });
    
  }

  loadRecentTasks(){
    this.workerSvc.getRecentTasks(this.workerId!).subscribe((res:any)=>{
      this.recentTasks = res.sort((a:any,b:any)=>{
        if(a.status == 'Closed' && b.status != 'Closed') return 1;
        if(a.status != 'Closed' && b.status == 'Closed') return -1;
        if(a.status == 'Resolved' && b.status != 'Resolved') return 1;
        if(a.status != 'Resolved' && b.status == 'Resolved') return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }); 
      console.log("worker recent data:", this.recentTasks); 
      this.loadUpcomingDeadlines();
    });
  }

  loadUpcomingDeadlines(){
    this.workerSvc.getUpcomingDeadlines(this.workerId!).subscribe((res:any)=>{
      this.upcomingDeadlines = res;
      console.log("worker upcomingdeadlines data:", this.upcomingDeadlines);
    });
  }

  prepareChartData(): void {
    this.statusChartData = [
      { name: 'Pending', value: this.stats.pending, color: '#ffc107' },
      { name: 'In Progress', value: this.stats.inProgress, color: '#17a2b8' },
      { name: 'Resolved', value: this.stats.resolved, color: '#28a745' },
      { name: 'Overdue', value: this.stats.overdue, color: '#dc3545' }
    ];
    
    this.priorityChartData = [
      { name: 'High', value: this.taskPriority.high, color: '#dc3545' },
      { name: 'Medium', value: this.taskPriority.medium, color: '#ffc107' },
      { name: 'Low', value: this.taskPriority.low, color: '#28a745' }
    ];
  }

  viewMyTasks(): void {
    this.router.navigate(['/worker/tasks']);
  }

  viewTaskDetails(taskId: string): void {
    this.router.navigate(['/worker/update-task', taskId]);
  }

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
      case 'overdue': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}