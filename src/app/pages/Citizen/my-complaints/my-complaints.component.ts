import { Component, OnInit } from '@angular/core';
import { ComplaintService } from '../../services/complaint.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

export enum ComplaintStatus {
  Pending = 'Pending',
  // UnderReview = 'UnderReview',
  Assigned = 'Assigned',
  InProgress = 'InProgress',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Rejected = 'Rejected',
  Reopened = 'Reopened'
}

@Component({
  selector: 'app-my-complaints',
  templateUrl: './my-complaints.component.html',
  styleUrls: ['./my-complaints.component.css']
})
export class MyComplaintsComponent implements OnInit {
  ComplaintStatus = ComplaintStatus;
  complaints: any[] = [];
  filteredComplaints: any[] = [];
  selectedStatus = 'All';
  isLoading = false;
  
  currentUserId: string | null = this.authSvc.getUserId();

  statusOptions = [
    { value: 'All', label: 'All Status', icon: 'fa-list', color: 'secondary' },
    { value: ComplaintStatus.Pending, label: 'Pending', icon: 'fa-clock', color: 'warning' },
    // { value: ComplaintStatus.UnderReview, label: 'Under Review', icon: 'fa-search', color: 'info' },
    { value: ComplaintStatus.Assigned, label: 'Assigned', icon: 'fa-user-check', color: 'primary' },
    { value: ComplaintStatus.InProgress, label: 'In Progress', icon: 'fa-spinner', color: 'primary' },
    { value: ComplaintStatus.Resolved, label: 'Resolved', icon: 'fa-check-circle', color: 'success' },
    { value: ComplaintStatus.Closed, label: 'Closed', icon: 'fa-times-circle', color: 'dark' },
    { value: ComplaintStatus.Rejected, label: 'Rejected', icon: 'fa-ban', color: 'danger' },
    { value: ComplaintStatus.Reopened, label: 'Reopened', icon: 'fa-redo', color: 'warning' }
  ];

  showFeedbackModal = false;
  selectedComplaintForFeedback: any = null;
  selectedComplaintForDetails: any = null;
  showComplaintDetailsModal: boolean = false;
  statusSteps: string[] = [];
  activeStepIndex = 0;
  progressWidth: number = 0;

  feedbackData = {
    rating: 5,
    comments: '',
    isSatisfied: true
  };

  constructor(
    private complaintService: ComplaintService,
    private authSvc: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadComplaints();
    if (this.selectedComplaintForDetails) {
      this.setStatusFlow(this.selectedComplaintForDetails.statusInfo.value, this.selectedComplaintForDetails.isReopened);
    }
  }

  
  setStatusFlow(currentStatus: ComplaintStatus, isReopened: boolean) {
    if (currentStatus === ComplaintStatus.Rejected) {
      this.statusSteps = [
        ComplaintStatus.Pending,
        ComplaintStatus.Rejected
      ];
    } else {
      this.statusSteps = [
        ComplaintStatus.Pending,
        ComplaintStatus.Assigned,
        ComplaintStatus.InProgress,
        ComplaintStatus.Resolved,
        ComplaintStatus.Closed
      ];
    }

    if (isReopened) {
      const assignedIndex = this.statusSteps.indexOf(ComplaintStatus.Assigned);
      if (assignedIndex !== -1) {
        if (!this.statusSteps.includes(ComplaintStatus.Reopened)) {
          this.statusSteps.splice(assignedIndex + 1, 0, ComplaintStatus.Reopened);
        }
      }
    }

    this.activeStepIndex = this.statusSteps.indexOf(currentStatus);

    // Set CSS custom property for line positioning
    setTimeout(() => {
      const stepContainer = document.querySelector('.step-container') as HTMLElement;
      if (stepContainer) {
        stepContainer.style.setProperty('--total-steps', this.statusSteps.length.toString());
      }
    }, 0);
  }

  loadComplaints() {
    this.isLoading = true;
    
    this.complaintService.getAllComplaintsByUserId(this.currentUserId!).subscribe({
      next: (data) => {
        this.complaints = data.map(complaint => ({
          ...complaint,
          statusInfo: this.getStatusInfo(complaint.currentStatus)
        }))
        .sort((a:any,b:any)=>{
          if(a.currentStatus == 'Closed' && b.currentStatus != 'Closed') return 1;
          if(a.currentStatus != 'Closed' && b.currentStatus == 'Closed') return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.filterComplaints();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load complaints');
        this.isLoading = false;
        console.error('Error loading complaints:', error);
      }
    });
  }

  filterComplaints() {
    if (this.selectedStatus === 'All') {
      this.filteredComplaints = [...this.complaints];
    } else {
      this.filteredComplaints = this.complaints.filter(
        complaint => complaint.currentStatus === this.selectedStatus
      );
    }
  }

  onStatusFilter(status: string) {
    this.selectedStatus = status;
    this.filterComplaints();
  }

  getStatusInfo(status: string) {
    return this.statusOptions.find(option => option.value === status) || 
           { value: status, label: status, icon: 'fa-question', color: 'secondary' };
  }

  getStatusBadgeClass(status: string): string {
    const statusInfo = this.getStatusInfo(status);
    return `badge bg-${statusInfo.color}`;
  }

  canProvideFeedback(complaint: any): boolean {
    return complaint.currentStatus === ComplaintStatus.Resolved && !complaint.feedback;
  }

  canReopenComplaint(complaint: any): boolean {
    return complaint.currentStatus === ComplaintStatus.Resolved;
  }

  openFeedbackModal(complaint: any) {
    this.selectedComplaintForFeedback = complaint;
    this.feedbackData = {
      rating: 5,
      comments: '',
      isSatisfied: true
    };
    this.showFeedbackModal = true;
  }

  closeFeedbackModal() {
    this.showFeedbackModal = false;
    this.selectedComplaintForFeedback = null;
  }

  submitFeedback() {
    if (!this.selectedComplaintForFeedback) return;


    const feedbackPayload = {
      citizenId: this.currentUserId,
      complaintId: this.selectedComplaintForFeedback.complaintId,
      rating: this.feedbackData.rating,
      comments: this.feedbackData.comments,
      isSatisfied: this.feedbackData.isSatisfied
    };

    this.complaintService.submitFeedback(feedbackPayload).subscribe({
      next: (response) => {
        this.toastr.success('Feedback submitted successfully');
        this.closeFeedbackModal();
        
        // If not satisfied, reopen the complaint
        if (!this.feedbackData.isSatisfied) {
          this.reopenComplaint(this.selectedComplaintForFeedback.complaintId);
        } else {
          this.loadComplaints(); 
        }
      },
      error: (error) => {
        this.toastr.error('Failed to submit feedback');
      }
    });
    
    if (!this.feedbackData.isSatisfied) {
      this.reopenComplaint(this.selectedComplaintForFeedback.complaintId);
    } else {
      this.loadComplaints();
    }
  }

  reopenComplaint(complaintId: string) {
    this.complaintService.reopenComplaint(complaintId).subscribe({
      next: (response) => {
        this.toastr.info('Complaint has been reopened');
        this.loadComplaints();
      },
      error: (error) => {
        this.toastr.error('Failed to reopen complaint');
      }
    });

  }

  animateStepper(targetIndex: number) {
    this.activeStepIndex = 0;
    this.progressWidth = 0;

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep <= targetIndex) {
        this.activeStepIndex = currentStep;
        this.updateProgressWidth(currentStep);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 300); // Faster animation for better UX
  }
  
  updateProgressWidth(stepIndex: number) {
    const totalSteps = this.statusSteps.length;
    if (totalSteps <= 0) {
      this.progressWidth = 0;
      return;
    }

    if (totalSteps === 1) {
      this.progressWidth = 0;
      return;
    }

    // Calculate progress based on actual step completion
    // Each step represents a segment between circles
    const segmentWidth = 100 / (totalSteps);
    this.progressWidth = stepIndex * segmentWidth;

    // Ensure don't exceed 100%
    this.progressWidth = Math.min(this.progressWidth, 100);
  }

  viewComplaintDetails(complaint: any) {
    this.selectedComplaintForDetails = complaint;
    this.showComplaintDetailsModal = true;
    this.setStatusFlow(complaint.statusInfo.value, complaint.isReopened);
    this.activeStepIndex = 0;

    // Set CSS custom property for total steps
    setTimeout(() => {
      const stepContainer = document.querySelector('.step-container') as HTMLElement;
      if (stepContainer) {
        stepContainer.style.setProperty('--total-steps', this.statusSteps.length.toString());
      }
      this.animateStepper(this.statusSteps.indexOf(complaint.statusInfo.value));
    }, 100);
  }


  closeComplaintDetailsModal() {
    this.showComplaintDetailsModal = false;
    this.selectedComplaintForDetails = null;
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const complaintDate = new Date(date);
    const diffInMs = now.getTime() - complaintDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return complaintDate.toLocaleDateString();
    }
  }

  getProgressPercentage(status: string, complaint: any): number {
    var statusOrder = [];
    if(complaint.isReopened) {
      statusOrder = [
        ComplaintStatus.Pending,
        // ComplaintStatus.UnderReview,
        ComplaintStatus.Assigned,
        ComplaintStatus.Reopened,
        ComplaintStatus.InProgress,
        ComplaintStatus.Resolved,
        ComplaintStatus.Closed
      ];

    } else if(status === ComplaintStatus.Rejected) {
      statusOrder = [
        ComplaintStatus.Pending,
        // ComplaintStatus.UnderReview,
        ComplaintStatus.Rejected
      ];
    } else{
      statusOrder = [
        ComplaintStatus.Pending,
        // ComplaintStatus.UnderReview,
        ComplaintStatus.Assigned,
        ComplaintStatus.InProgress,
        ComplaintStatus.Resolved,
        ComplaintStatus.Closed
      ];
    }
    const currentIndex = statusOrder.indexOf(status as ComplaintStatus);
    if (currentIndex === -1) return 0;
    
    return ((currentIndex + 1) / statusOrder.length) * 100;
  }

  setRating(rating: number) {
    this.feedbackData.rating = rating;
  }

  getComplaintsCountByStatus(status: string): number {
    if (status === 'All') {
      return this.complaints.length;
    }
    return this.complaints.filter(c => c.currentStatus === status).length;
  }
}