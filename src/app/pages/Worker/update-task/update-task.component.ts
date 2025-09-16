import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { WorkerService } from '../../services/worker.service';
import { ComplaintService } from '../../services/complaint.service';

interface TaskDetails {
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
  workUpdates: WorkUpdate;
}

interface TaskAttachment {
  attachmentId: string;
  imageUrl: string;
  attachmentType: string;
  uploadedAt: Date;
}

interface WorkUpdate {
  notes: string;
  updatedAt: Date;
  completionPercentage: number;
  estimatedCompletionDate?: Date | null;
  requiresAdditionalResources?: boolean;
  additionalResourcesNeeded?: string;
}

@Component({
  selector: 'app-update-task',
  templateUrl: './update-task.component.html',
  styleUrls: ['./update-task.component.css']
})
export class UpdateTaskComponent implements OnInit {

  // Task data
  taskDetails: TaskDetails | null = null;
  workHistory: any[] = [];
  
  // Form data
  updateForm = {
    status: '',
    notes: '',
    completionPercentage: 0,
    estimatedCompletionDate: null as Date | null,
    requiresAdditionalResources: false,
    additionalResourcesNeeded: ''
  };
  
  // Track the minimum completion percentage (cannot go below last update)
  minCompletionPercentage: number = 0;
  
  // File upload
  selectedFiles: File[] = [];
  uploadProgress: number = 0;
  
  // UI state
  loading = false;
  saving = false;
  showWorkHistory = false;
  showLocationModal = false;
  activeTab = 'update';
  
  // Form validation
  formErrors: any = {};
  
  // Available statuses
  availableStatuses = [
    { value: 'Pending', label: 'Pending', icon: 'fas fa-clock', color: 'warning' },
    { value: 'InProgress', label: 'In Progress', icon: 'fas fa-cog', color: 'info' },
    { value: 'Resolved', label: 'Resolved', icon: 'fas fa-check-circle', color: 'success' },
    { value: 'Closed', label: 'Closed', icon: 'fas fa-times-circle', color: 'danger' }

  ];
  
  // Route params
  taskId: string | null = null;
  workerId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private workerService: WorkerService,
    private complaintService: ComplaintService,
    private toastrService: ToastrService
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadTaskDetails();
  }

  get daysSinceAssigned(): number {
    if (!this.taskDetails?.assignedAt) return 0;
    const now = Date.now();
    const assigned = new Date(this.taskDetails.assignedAt).getTime();
    return (now - assigned) / (1000 * 60 * 60 * 24);
  }

  openAttachment(url: string): void {
    window.open(url, '_blank');
  }

  getAbs(value: number): number {
    return Math.abs(value);
  }

  initializeComponent(): void {
    this.taskId = this.route.snapshot.paramMap.get('complaintId');
    this.workerId = this.authService.getUserId();
    
    if (!this.taskId) {
      this.toastrService.error('Task ID not found');
      this.router.navigate(['/worker/my-tasks']);
      return;
    }
  }

  loadTaskDetails() {
    this.loading = true;
    try {
      this.fetchTaskDetails();
      this.loadWorkHistory();
    } catch (error) {
      console.error('Error loading task details:', error);
      this.toastrService.error('Failed to load task details');
      this.router.navigate(['/worker/my-tasks']);
    } finally {
      this.loading = false;
    }
  }

  fetchTaskDetails() {
    this.workerService.getComplaintDetails(this.taskId!).subscribe((res:any)=>{
      console.log("task details",res);
      this.taskDetails = res;
      const daysUntilDue = this.calculateDaysUntilDue(res.slaDueAt);
      const isOverdue = daysUntilDue < 0;

      // Assign priority based on SLA
      let priority: 'High' | 'Medium' | 'Low';
      if (isOverdue || daysUntilDue <= 1) {
        priority = 'High';
      } else if (daysUntilDue <= 3) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      this.taskDetails = {
        ...res,
        createdAt: new Date(res.createdAt),
        updatedAt: res.updatedAt ? new Date(res.updatedAt) : undefined,
        slaDueAt: new Date(res.slaDueAt),
        priority: priority,
        isOverdue: isOverdue
      } as TaskDetails;

      console.log('task details with priority', this.taskDetails);
    });
  }

  private calculateDaysUntilDue(slaDueAt: string | Date): number {
    const dueDate = new Date(slaDueAt).getTime();
    const today = Date.now();
    return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  }

  loadWorkHistory(){
    this.workerService.getWorkHistory(this.taskId!).subscribe((res:any)=>{
      console.log("work history data:",res);
      this.workHistory = res.map((item: any) => ({
        ...item,
        updatedAt: new Date(item.updatedAt),
        estimatedCompletionDate: item.estimatedCompletionDate ? new Date(item.estimatedCompletionDate) : null
      }));

      // Initialize form with last update data
      // this.initializeFormWithLastUpdate();
    });
  }


  get latestCompletion(): number {
    if (this.workHistory.length > 0) {
      const lastUpdate = this.workHistory[this.workHistory.length - 1];
      return lastUpdate.completionPercentage;
    }
    return 0;
  }
  // initializeFormWithLastUpdate(): void {
  //   if (this.taskDetails) {
  //     // Set default values
  //     this.updateForm.status = this.taskDetails.currentStatus;
  //     this.updateForm.notes = '';
  //     this.updateForm.completionPercentage = 0;
  //     this.updateForm.estimatedCompletionDate = null;
  //     this.updateForm.requiresAdditionalResources = false;
  //     this.updateForm.additionalResourcesNeeded = '';
      
  //     if (this.workHistory.length > 0) {
  //       const sortedHistory = this.workHistory.sort((a, b) => 
  //         new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  //       );
        
  //       const lastUpdate = sortedHistory[0];
  //       this.updateForm.status = lastUpdate.status;
  //       this.updateForm.completionPercentage = lastUpdate.completionPercentage;
  //       this.updateForm.estimatedCompletionDate = lastUpdate.estimatedCompletionDate || null;
  //       this.updateForm.requiresAdditionalResources = lastUpdate.requiresAdditionalResources || false;
  //       this.updateForm.additionalResourcesNeeded = lastUpdate.additionalResourcesNeeded || '';
        
  //       this.minCompletionPercentage = lastUpdate.completionPercentage;
        
  //       this.updateForm.notes = '';
  //     } else {
  //       this.minCompletionPercentage = 0;
  //     }
  //   }
  // }

  // Fixed submitUpdate method
  submitUpdate(){
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    
    const formData = new FormData();

    // Ensure workerId is not null
    if (!this.workerId) {
      this.toastrService.error('Worker ID not found');
      this.saving = false;
      return;
    }

    // Append form data with proper formatting
    formData.append("updatedByUserId", this.workerId);
    formData.append("status", this.updateForm.status);
    formData.append("notes", this.updateForm.notes || '');
    formData.append("completionPercentage", this.updateForm.completionPercentage.toString());
    
    // Handle date properly - convert to ISO string if exists
    if (this.updateForm.estimatedCompletionDate) {
      const dateValue = new Date(this.updateForm.estimatedCompletionDate);
      formData.append("estimatedCompletionDate", dateValue.toISOString());
    }
    
    formData.append("requiresAdditionalResources", this.updateForm.requiresAdditionalResources.toString());
    if (this.updateForm.additionalResourcesNeeded && this.updateForm.additionalResourcesNeeded.trim() !== '') {
      formData.append("additionalResourcesNeeded", this.updateForm.additionalResourcesNeeded);
    }
    
    // Add files
    this.selectedFiles.forEach((file, index) => {
      formData.append("attachments", file);
    });

    console.log("Form data being sent:");
    console.log("Task ID:", this.taskId);
    console.log("Worker ID:", this.workerId);
    console.log("Status:", this.updateForm.status);
    console.log("Notes:", this.updateForm.notes);
    console.log("Completion:", this.updateForm.completionPercentage);
    console.log("Files count:", this.selectedFiles.length);
    console.log("Estimated Completion Date:", this.updateForm.requiresAdditionalResources);


    // Make the API call
    this.workerService.addWorkUpdate(this.taskId!, formData).subscribe({
      next: (res: any) => {
        console.log("API Response:", res);
        this.toastrService.success('Task updated successfully');
        
        // Update the minimum completion percentage for next update
        this.minCompletionPercentage = this.updateForm.completionPercentage;
        
        // Refresh data
        this.loadTaskDetails();
        this.resetForm();
      },
      error: (err: any) => {
        console.error("API Error:", err);
        
        // More specific error messages
        if (err.status === 404) {
          this.saving = false;
          this.toastrService.error('Task not found');
        } else if (err.status === 400) {
          this.saving = false;
          this.toastrService.error('Invalid data submitted');
        } else if (err.status === 500) {
          this.saving = false;
          this.toastrService.error('Server error occurred');
        } else {
          this.saving = false;
          this.toastrService.error('Failed to update task: ' + (err.message || 'Unknown error'));
        }
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!this.updateForm.status) {
      this.formErrors.status = 'Status is required';
      isValid = false;
    }

    if (this.updateForm.status === 'Resolved' && this.updateForm.completionPercentage < 100) {
      this.formErrors.completionPercentage = 'Completion percentage must be 100% for resolved tasks';
      isValid = false;
    }

    // Validate completion percentage cannot decrease
    if (this.updateForm.completionPercentage < this.minCompletionPercentage) {
      this.formErrors.completionPercentage = `Completion percentage cannot be less than ${this.minCompletionPercentage}% (current progress)`;
      isValid = false;
    }

    if (this.updateForm.requiresAdditionalResources && !this.updateForm.additionalResourcesNeeded.trim()) {
      this.formErrors.additionalResourcesNeeded = 'Please specify the additional resources needed';
      isValid = false;
    }

    // Require notes for updates
    if (!this.updateForm.notes.trim()) {
      this.formErrors.notes = 'Work notes are required to document progress';
      isValid = false;
    }

    if (!isValid) {
      this.toastrService.warning('Please fix the form errors before submitting');
    }

    return isValid;
  }

  uploadFiles() {
    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.uploadProgress = ((i + 1) / this.selectedFiles.length) * 100;
      this.delay(500);
    }
    this.uploadProgress = 0;
  }

  // File handling
  onFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...files.slice(0, 5 - this.selectedFiles.length)];
    
    if (files.length + this.selectedFiles.length > 5) {
      this.toastrService.warning('Maximum 5 files allowed');
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  // Status change handling
  onStatusChange(): void {
    if (this.updateForm.status === 'Resolved') {
      this.updateForm.completionPercentage = 100;
    }
    
    // Clear related fields when status changes
    if (this.updateForm.status !== 'OnHold') {
      this.updateForm.requiresAdditionalResources = false;
      this.updateForm.additionalResourcesNeeded = '';
    }
  }

  // Method to handle completion percentage change
  onCompletionPercentageChange(): void {
    // Ensure completion percentage doesn't go below minimum
    if (this.updateForm.completionPercentage < this.minCompletionPercentage) {
      this.updateForm.completionPercentage = this.minCompletionPercentage;
      this.toastrService.warning(`Cannot decrease completion below ${this.minCompletionPercentage}%`);
    }
    
    // Auto-update status based on completion percentage
    if (this.updateForm.completionPercentage === 100 && this.updateForm.status !== 'Resolved') {
      this.updateForm.status = 'Resolved';
    } else if (this.updateForm.completionPercentage > 0 && this.updateForm.completionPercentage < 100 && this.updateForm.status === 'Pending') {
      this.updateForm.status = 'InProgress';
    }
  }

  // UI methods
  resetForm(): void {
    // Don't reset status and completion percentage - keep current values
    this.updateForm.notes = '';
    this.updateForm.estimatedCompletionDate = null;
    this.updateForm.requiresAdditionalResources = false;
    this.updateForm.additionalResourcesNeeded = '';
    this.selectedFiles = [];
    this.formErrors = {};
  }

  toggleWorkHistory(): void {
    this.showWorkHistory = !this.showWorkHistory;
  }

  viewOnMap(): void {
    if (this.taskDetails?.latitude && this.taskDetails?.longitude) {
      const url = `https://www.google.com/maps?q=${this.taskDetails.latitude},${this.taskDetails.longitude}`;
      window.open(url, '_blank');
    } else {
      this.toastrService.warning('Location coordinates not available');
    }
  }

  goBack(): void {
    this.router.navigate(['/worker/my-tasks']);
  }

  // Utility methods
  getStatusConfig(status: string) {
    return this.availableStatuses.find(s => s.value === status) || this.availableStatuses[0];
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-secondary';
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

  getFileSize(file: File): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (file.size === 0) return '0 Bytes';
    const i = Math.floor(Math.log(file.size) / Math.log(1024));
    return Math.round(file.size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getDaysUntilDue(): number {
    if (!this.taskDetails) return 0;
    const today = new Date();
    const due = new Date(this.taskDetails.slaDueAt);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper method for mock delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}