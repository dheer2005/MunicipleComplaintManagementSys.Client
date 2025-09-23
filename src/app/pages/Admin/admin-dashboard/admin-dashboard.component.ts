import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AdminService, DashboardStats, RecentComplaints } from '../../services/admin.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  Chart, 
  ChartConfiguration, 
  ChartData, 
  ChartType, 
  registerables 
} from 'chart.js';

export enum ComplaintStatus {
  Pending = 0,
  Underview = 1,
  Assigned = 2,
  InProgress = 3,
  Resolved = 4,
  Closed = 5,
  Rejected = 6,
  Reopened = 7
}


// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('statusChart', { static: false}) statusChart!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;
  dashboardStats: DashboardStats | null = null;
  recentComplaints: RecentComplaints | null = null;
  loading = true;
  error: string | null = null;
  chartInitialized: boolean = false;
  totalComplaints: number | undefined = 0;
  
  private destroy$ = new Subject<void>();
  public pieChartData!: ChartData<'doughnut', number[], string | string[]>
  public pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'left' as const,
        labels: {
          boxWidth: 20,
          padding: 10,
        }
      }
    }
  };

  pieChartType: ChartType = 'doughnut';
  
  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusName(statusNumber: string) : string{
    return ComplaintStatus[Number(statusNumber)] || 'Unknown';
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
     
    this.adminService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          console.log("stats:", stats);
          this.dashboardStats = stats;

          this.totalComplaints = this.dashboardStats?.complaintByStatus.reduce((acc,n)=>acc+n.count, 0)

          this.pieChartData = {
            labels: this.dashboardStats!.complaintByStatus.map((item:any)=>this.formatStatusLabel(item.status)),
            datasets: [
              {
                data: this.dashboardStats!.complaintByStatus.map((item:any)=>item.count),
                backgroundColor: this.getStatusColors(this.dashboardStats!.complaintByStatus.length),
              }
            ]
          };

          
          this.loadRecentComplaints();
        },
        error: (error: any) => {
          console.error('Error loading dashboard stats:', error);
          this.error = 'Failed to load dashboard statistics';
          this.loading = false;
        }
      });
  }

  private loadRecentComplaints(): void {
    this.adminService.getRecentComplaints()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (complaints: any) => {
          console.log("complaints:", complaints);
          this.recentComplaints = complaints;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading recent complaints:', error);
          this.error = 'Failed to load recent complaints';
          this.loading = false;
        }
      });
  }

  private getStatusColors(count: number): string[] {
    const baseColors = [
      'rgba(255, 107, 107, 0.8)',
      'rgba(78, 205, 196, 0.8)',
      'rgba(69, 183, 209, 0.8)',
      'rgba(150, 206, 180, 0.8)',
      'rgba(254, 202, 87, 0.8)',
      'rgba(155, 89, 182, 0.8)',
      'rgba(241, 148, 138, 0.8)',
      'rgba(52, 152, 219, 0.8)'
    ];
    
    return baseColors.slice(0, count);
  }

  private formatStatusLabel(status: string): string {
    // Convert camelCase or lowercase to proper case
    return status.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge-light';
    
    const statusLower = status;
    switch (statusLower) {
      case 'Closed': return 'badge-secondary'; 
      case 'InProgress': return 'badge-warning';
      case 'Resolved': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      case 'Reopened': return 'badge-info';
      case 'Assigned': return 'badge-primary';
      default: return 'badge-light';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  refreshDashboard(): void {
    this.chartInitialized = false;
    this.loadDashboardData();
  }

  calculateWorkerActivityPercentage(): number {
    if (!this.dashboardStats || this.dashboardStats.totalWorkers === 0) {
      return 0;
    }
    return Math.round((this.dashboardStats.activeWorkers / this.dashboardStats.totalWorkers) * 100);
  }

  getOverduePercentage(): number {
    if (!this.dashboardStats || this.dashboardStats.totalComplaints === 0) {
      return 0;
    }
    return Math.round((this.dashboardStats.overDueComplaints / this.dashboardStats.totalComplaints) * 100);
  }

  // Chart legend data for display
  getChartLegendData(): any[] {
    if (!this.dashboardStats?.complaintByStatus) return [];
    
    const colors = this.getStatusColors(this.dashboardStats.complaintByStatus.length);
    return this.dashboardStats.complaintByStatus.map((item: any, index: number) => ({
      label: this.formatStatusLabel(item.status),
      count: item.count,
      color: colors[index] || '#ccc',
      badgeClass: this.getStatusBadgeClass(item.status)
    }));
  }

  navigateToComplaints(): void {
    // Navigation logic for complaints page
  }

  navigateToDepartments(): void {
    // Navigation logic for departments page
  }

  navigateToUsers(): void {
    // Navigation logic for users page
  }

  navigateToReports(): void {
    // Navigation logic for reports page
  }
}