import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ComplaintService } from '../../services/complaint.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { DepartmentService } from '../../services/department.service';
import { NgForm } from '@angular/forms';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  @ViewChild('fileInput') fileInputRef!: ElementRef;

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
  selectedComplaintForEdit: any = null;
  showComplaintDetailsModal: boolean = false;
  showEditComplaintDetailsModal: boolean = false;
  statusSteps: string[] = [];
  activeStepIndex = 0;
  progressWidth: number = 0;

  feedbackData = {
    rating: 5,
    comments: '',
    isSatisfied: true
  };

  departments: any[] = [];
  categories: any[] = [];
  subCategories: any[] = [];

  showLocationPanel: boolean = false;
  showMapEdit: boolean = false;
  isLoadingLocationEdit: boolean = false;
  locationErrorEdit: string = '';
  mapEdit: any = null;
  markerEdit: any = null;

  selectedFiles: File[] = [];
  previewImages: string[] = [];
  isSubmitting = false;
  showDeleteModal = false;
  deleteComplaintId: string | null = null;
  showDeleteAttachmentModal = false;
  deleteTarget: { complaintId: string, attachmentId: number } | null = null;


  constructor(
    private complaintService: ComplaintService,
    private authSvc: AuthService,
    private departmentSvc: DepartmentService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadComplaints();
    this.loadDepartments();
    if (this.selectedComplaintForDetails) {
      this.setStatusFlow(this.selectedComplaintForDetails.statusInfo.value, this.selectedComplaintForDetails.isReopened);
    }
  }

  openDeleteAttachmentModal(complaintId: string, attachmentId: number) {
    this.deleteTarget = { complaintId, attachmentId };
    this.showDeleteAttachmentModal = true;
  }

  
  closeDeleteAttachmentModal() {
    this.showDeleteAttachmentModal = false;
    this.deleteTarget = null;
  }

  confirmDeleteAttachment() {
    if (!this.deleteTarget) return;

    const { complaintId, attachmentId } = this.deleteTarget;

    this.complaintService.deleteComplaintAttachment(complaintId, attachmentId).subscribe({
      next: () => {
        const auditObj = {
          userId: this.currentUserId,
          action: 'Complaint deletion',
          ActionResult: `Attchment: ${attachmentId} of complaint:- ${complaintId} deleted successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.selectedComplaintForEdit.attachments =
          this.selectedComplaintForEdit.attachments.filter((att: any) => att.attachmentId !== attachmentId);

        this.toastr.success('Attachment deleted successfully');
        this.loadComplaints();
        this.closeDeleteAttachmentModal();
      },
      error: () => {
        const auditObj = {
          userId: this.currentUserId,
          action: 'Complaint deletion',
          ActionResult: `Failed to delete Attchment: ${attachmentId} of complaint:- ${complaintId}`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.error('Failed to delete attachment');
        this.closeDeleteAttachmentModal();
      }
    });
  }


  closeDeleteModal(){
    this.showDeleteModal = false;
  }

  openAttachment(url:string){
    window.open(url, '_blank');
  }

  removeImage(index: number) {
    this.previewImages.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  onFileSelected(event: any) {
    const files: File[] = Array.from(event.target.files);
    
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.toastr.warning(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        this.toastr.warning(`File ${file.name} is not a valid image.`);
        continue;
      }

      this.selectedFiles.push(file);
      if(this.fileInputRef){
        this.fileInputRef.nativeElement.value = '';
      }
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewImages.push(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  onDepartmentChangeForEdit(){
    const deptId = this.selectedComplaintForEdit.departmentId;
    this.selectedComplaintForEdit.categoryId = '';
    this.selectedComplaintForEdit.subCategoryId = '';
    this.subCategories = [];
    this.categories = [];
    if (deptId) {
      this.departmentSvc.getAllCategoriesbyDepartment(deptId).subscribe({
        next: (res) => this.categories = res,
        error: (err) => this.toastr.error('Failed to load categories')
      });
    }
  }

  onCategoryChangeForEdit(){
    const catId = this.selectedComplaintForEdit.categoryId;
    this.selectedComplaintForEdit.subCategoryId = '';
    this.subCategories = [];
    if (catId) {
      this.departmentSvc.getAllSubCategoriesbyCategory(catId).subscribe({
        next: (res) => this.subCategories = res,
        error: (err) => this.toastr.error('Failed to load sub-categories')
      });
    }
  }

  loadDepartments() {
    this.departmentSvc.getAllDepartments().subscribe({
      next: (res) => this.departments = res,
      error: (err) => this.toastr.error('Failed to load departments')
    });
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
        this.complaints = data
          .map(complaint => {
            const citizenAttachments = (complaint.attachments || [])
              .filter((att:any) => att.attachmentType === 'CitizenProof');

            const workerAttachments = (complaint.attachments || [])
              .filter((att:any) => att.attachmentType === 'WorkerProof');
            return {
              ...complaint,
              statusInfo: this.getStatusInfo(complaint.currentStatus),
              citizenAttachments,
              workerAttachments
            };
          })
        .sort((a:any,b:any)=>{

          if(a.currentStatus == 'Closed' && b.currentStatus != 'Closed') return 1;
          if(a.currentStatus != 'Closed' && b.currentStatus == 'Closed') return -1;
          if(a.currentStatus == 'Resolved' && b.currentStatus != 'Resolved') return 1;
          if(a.currentStatus != 'Resolved' && b.currentStatus == 'Resolved') return -1;

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
    return complaint.currentStatus === ComplaintStatus.Resolved && complaint.feedback;
  }

  canReopenComplaint(complaint: any): boolean {
    return complaint.currentStatus === ComplaintStatus.Resolved;
  }

  canDeleteComplaint(complaint:any): boolean{
    return complaint.currentStatus === ComplaintStatus.Pending;
  }

  canEditComplaint(complaint: any): boolean{
    return complaint.currentStatus === ComplaintStatus.Pending;
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
        const auditObj = {
          userId: this.currentUserId,
          action: 'Feedback Submission',
          ActionResult: `Feedback for complaint ${this.selectedComplaintForFeedback.complaintId} submitted successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
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
        const auditObj = {
          userId: this.currentUserId,
          action: 'Feedback Submission',
          ActionResult: `Failed to submit Feedback for complaint ${this.selectedComplaintForFeedback.complaintId} `
        };
        this.authSvc.createAudit(auditObj).subscribe();
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
        const auditObj = {
          userId: this.currentUserId,
          action: 'Complaint Reopen',
          ActionResult: `Complaint ${this.selectedComplaintForFeedback.complaintId} reopened successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.info('Complaint has been reopened');
        this.loadComplaints();
      },
      error: (error) => {
        const auditObj = {
          userId: this.currentUserId,
          action: 'Complaint Reopen',
          ActionResult: `Failed to reopened complaint ${this.selectedComplaintForFeedback.complaintId}`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.error('Failed to reopen complaint');
      }
    });
  }

  deleteComplaint(complaintId: string){
    this.deleteComplaintId = complaintId;
    this.showDeleteModal = true;
  }

  confirmDeleteComplaint(){
  if(!this.deleteComplaintId) return;
    this.complaintService.deleteComplaint(this.deleteComplaintId).subscribe({
      next: (response) => {
        const auditObj = {
          userId: this.currentUserId,
          action: 'Complaint deletion',
          ActionResult: `Complaint ${this.selectedComplaintForFeedback.complaintId} deleted successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.success('Complaint has been deleted');
        this.deleteComplaintId = null;
        this.loadComplaints();
        this.showDeleteModal = false;
      },
      error: (error) => {
        const auditObj = {
          userId: this.currentUserId,
          action: 'Complaint deletion',
          ActionResult: `Complaint ${this.selectedComplaintForFeedback.complaintId} deletion failed`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.error('Failed to delete complaint');
        this.deleteComplaintId = null;
        this.showDeleteModal = false;
      }
    })
  }

  editComplaint(complaint: any){
    this.showEditComplaintDetailsModal = true;
    this.selectedComplaintForEdit = { ...complaint };

    this.showLocationPanel = false;
    this.showMapEdit = false;
    this.locationErrorEdit = '';


    const dept = this.departments.find(d => d.departmentName === complaint.departmentName);
    if (dept) {
      this.selectedComplaintForEdit.departmentId = dept.departmentId;

      this.departmentSvc.getAllCategoriesbyDepartment(dept.departmentId).subscribe({
        next: (res) => {
          this.categories = res;
          const cat = this.categories.find(c => c.categoryName === complaint.categoryName);
          if (cat) {
            this.selectedComplaintForEdit.categoryId = cat.categoryId;
            this.departmentSvc.getAllSubCategoriesbyCategory(cat.categoryId).subscribe({
              next: (res) => {
                this.subCategories = res;
                const subCat = this.subCategories.find(sc => sc.subCategoryName === complaint.subCategoryName);
                if (subCat) {
                  this.selectedComplaintForEdit.subCategoryId = subCat.subCategoryId;
                }
              }
            });
          }
        }
      });
    }
  }

  closeEditComplaintModal() {
    this.showEditComplaintDetailsModal = false;
    this.selectedComplaintForEdit = null;
    this.showLocationPanel = false;
    this.destroyMapEdit();
  }

  openLocationPanel() {
    this.showLocationPanel = true;
  }

  closeLocationPanel() {
    this.showLocationPanel = false;
    this.destroyMapEdit();
  }

  saveLocationChanges() {
    this.showLocationPanel = false;
    this.showMapEdit = false;
    this.destroyMapEdit();
  }

  toggleMapForEdit(){
    this.showMapEdit = !this.showMapEdit;
    this.locationErrorEdit = '';

    if(this.showMapEdit){
      setTimeout(() => {
        this.initializeMapForEdit();
      }, 100);
    } else {
      this.destroyMapEdit();
    }
  }

  initializeMapForEdit(){
    try{
      if(this.mapEdit){
        this.mapEdit.remove();
        this.mapEdit = null;
      }

      const defaultLat = 26.9124;
      const defaultLng = 75.7873;

      const lat = this.selectedComplaintForEdit.latitude ?? defaultLat;
      const lng = this.selectedComplaintForEdit.longitude ?? defaultLng;

      this.mapEdit = L.map('mapContainerEdit', {
        center: [lat, lng],
        zoom: this.selectedComplaintForEdit.latitude ? 15 : 10,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.mapEdit);

      if(this.selectedComplaintForEdit.latitude && this.selectedComplaintForEdit.longitude){
        this.addMarkerForEdit(this.selectedComplaintForEdit.latitude, this.selectedComplaintForEdit.longitude);
      }

      this.mapEdit.on('click', (e: L.LeafletMouseEvent) => {
        this.addMarkerForEdit(e.latlng.lat, e.latlng.lng);
        this.reverseGeocodeForEdit(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(()=>{
        if(this.mapEdit){
          this.mapEdit.invalidateSize();
        }
      },200);
    } catch(error){
      console.error('Error initializing map:', error);
      this.locationErrorEdit = 'Failed to initialize map';
    }
  }

  addMarkerForEdit(lat: number, lng: number){
    try{
      if(this.markerEdit){
        this.mapEdit.removeLayer(this.markerEdit);
      }

      this.markerEdit = L.marker([lat, lng], {
        draggable: true
      }).addTo(this.mapEdit);

      this.selectedComplaintForEdit.latitude = lat;
      this.selectedComplaintForEdit.longitude = lng;

      this.markerEdit.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        this.selectedComplaintForEdit.latitude = position.lat;
        this.selectedComplaintForEdit.longitude = position.lng;
        this.reverseGeocodeForEdit(position.lat, position.lng);
      });

      this.mapEdit.setView([lat, lng], 15);

    } catch(error){
      console.error('Error adding marker:', error);
    }
  }

  useCurrentLocationForEdit(){
    if(!navigator.geolocation){
      this.toastr.warning('Geolocation is not supported by your browser');
      return;
    }

    this.isLoadingLocationEdit = true;
    this.locationErrorEdit = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if(!this.showMapEdit){
          this.showMapEdit = true;
          setTimeout(() => {
            this.initializeMapForEdit();
            this.addMarkerForEdit(lat, lng);
            this.reverseGeocodeForEdit(lat, lng);
          }, 100);
        } else {
          this.addMarkerForEdit(lat, lng);
          this.reverseGeocodeForEdit(lat, lng);
        }

        this.isLoadingLocationEdit = false;
        const auditObj = {
          userId: this.currentUserId,
          action: 'Location detection',
          ActionResult: `Location of user: ${this.currentUserId} detected successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.success('Location detected successfully');
      },
      (error) => {
        this.isLoadingLocationEdit = false;
        const auditObj = {
          userId: this.currentUserId,
          action: 'Location detection',
          ActionResult: `Failed to detect the location of the user: ${this.currentUserId}`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        let message = 'Failed to get your location';

        switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out';
          break;
        }

        this.locationErrorEdit = message;
        this.toastr.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  reverseGeocodeForEdit(lat: number, lng: number){
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          this.selectedComplaintForEdit.addressText = data.display_name;
        }
      })
      .catch(error => {
        this.toastr.error('Reverse geocoding failed:', error);
      });
  }

  destroyMapEdit(){
    if (this.mapEdit) {
      this.mapEdit.remove();
      this.mapEdit = null;
      this.markerEdit = null;
    }
  }

  saveComplaintChanges() {

    const EditcomplaintData = {
      citizenId: this.authSvc.getUserId(),
      description: this.selectedComplaintForEdit.description,
      departmentId: this.selectedComplaintForEdit.departmentId,
      categoryId: this.selectedComplaintForEdit.categoryId,
      subCategoryId: this.selectedComplaintForEdit.subCategoryId,
      addressText: this.selectedComplaintForEdit.addressText,
      latitude: this.selectedComplaintForEdit.latitude,
      longitude: this.selectedComplaintForEdit.longitude
    };

    const formData = new FormData();
    
    Object.entries(EditcomplaintData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      } else {
        formData.append(key, "");
      }
    });

    this.selectedFiles.forEach(file => {
      formData.append('attachments', file);
    });

    this.isSubmitting = true;
    
    this.complaintService.editComplaint(this.selectedComplaintForEdit.complaintId, formData).subscribe({
      next: (res:any)=>{
        const auditObj = {
          userId: this.currentUserId,
          action: 'Update complaint',
          ActionResult: `Complaint ${this.selectedComplaintForFeedback.complaintId} updated successfully`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.success('Complaint updated successfully');
        this.selectedFiles = [];
        this.previewImages = [];
        this.closeEditComplaintModal();
        this.isSubmitting = false;
        this.loadComplaints();

      },
      error: (err:any)=>{
        const auditObj = {
          userId: this.currentUserId,
          action: 'Update complaint',
          ActionResult: `Complaint ${this.selectedComplaintForFeedback.complaintId} updation failed`
        };
        this.authSvc.createAudit(auditObj).subscribe();
        this.toastr.error('Failed to update complaint');
        this.isSubmitting = false;
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
    }, 300); 
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

    this.progressWidth = Math.min(this.progressWidth, 100);
  }

  viewComplaintDetails(complaint: any) {
    this.selectedComplaintForDetails = complaint;
    this.showComplaintDetailsModal = true;
    this.setStatusFlow(complaint.statusInfo.value, complaint.isReopened);
    this.activeStepIndex = 0;

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