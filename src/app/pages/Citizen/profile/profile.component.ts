import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

export enum UserRole {
  Citizen = 0,
  Official = 1,
  Worker = 2
}


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userProfile: any = null;
  isLoading = false;
  isEditing = false;
  
  // Mock current user ID - replace with actual logged-in user ID from auth service
  currentUserId: string | null = null;

  // Edit form data
  editForm = {
    fullName: '',
    email: '',
    phone: ''
  };

  // Role information
  roleInfo: {
    Official: { name: string; icon: string; color: string; description: string };
    Worker: { name: string; icon: string; color: string; description: string };
    Citizen: { name: string; icon: string; color: string; description: string };
  } = {
    Official: { name: 'Official', icon: 'fa-user-tie', color: 'primary', description: 'Municipal Official' },
    Worker: { name: 'Worker', icon: 'fa-hard-hat', color: 'success', description: 'Field Worker' },
    Citizen: { name: 'Citizen', icon: 'fa-user', color: 'info', description: 'Citizen' }
  };

  constructor(
    private apiService: ApiService,
    private authSvc: AuthService,
    private toastr: ToastrService
  ) {
    this.currentUserId = this.authSvc.getUserId();
   }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;
    
    this.apiService.userProfile(this.currentUserId!).subscribe({
      next: (data) => {
        console.log('Profile data:', data);
        this.userProfile = data;
        this.populateEditForm();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information');
        this.isLoading = false;
        console.error('Error loading profile:', error);
      }
    });
  }

  populateEditForm() {
    if (this.userProfile) {
      this.editForm = {
        fullName: this.userProfile.fullName || '',
        email: this.userProfile.email || '',
        phone: this.userProfile.phone || ''
      };
    }
  }

  getRoleInfo() {
    const role = this.authSvc.getUserRole();

    if (role && ['Official', 'Worker', 'Citizen'].includes(role)) {
      return this.roleInfo[role as 'Official' | 'Worker' | 'Citizen'];
    }

    return this.roleInfo.Citizen;
  }

  getAccountAge() {
    if (!this.userProfile?.createdAt) return 'Unknown';
    
    const createdDate = new Date(this.userProfile.createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - createdDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }

  getStatusBadge() {
    if (this.userProfile?.isActive) {
      return { class: 'bg-success', text: 'Active', icon: 'fa-check-circle' };
    } else {
      return { class: 'bg-danger', text: 'Inactive', icon: 'fa-times-circle' };
    }
  }

  getWorkerAvailabilityBadge() {
    if (this.userProfile?.isWorkerAvailable === true) {
      return { class: 'bg-success', text: 'Available', icon: 'fa-check-circle' };
    } else if (this.userProfile?.isWorkerAvailable === false) {
      return { class: 'bg-warning', text: 'Busy', icon: 'fa-clock' };
    } else {
      return { class: 'bg-secondary', text: 'N/A', icon: 'fa-minus' };
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateEditForm(); // Reset form if canceling
    }
  }

  saveProfile() {
    if (!this.validateForm()) {
      return;
    }

    // Here you would call an update profile API
    // this.apiService.updateProfile(this.currentUserId, this.editForm).subscribe({
    //   next: (response) => {
    //     this.toastr.success('Profile updated successfully');
    //     this.userProfile = { ...this.userProfile, ...this.editForm };
    //     this.isEditing = false;
    //   },
    //   error: (error) => {
    //     this.toastr.error('Failed to update profile');
    //   }
    // });

    // Mock update for now
    this.userProfile = { ...this.userProfile, ...this.editForm };
    this.toastr.success('Profile updated successfully');
    this.isEditing = false;
  }

  validateForm(): boolean {
    if (!this.editForm.fullName.trim()) {
      this.toastr.error('Full name is required');
      return false;
    }

    if (!this.editForm.email.trim()) {
      this.toastr.error('Email is required');
      return false;
    }

    if (!this.isValidEmail(this.editForm.email)) {
      this.toastr.error('Please enter a valid email address');
      return false;
    }

    if (!this.editForm.phone.trim()) {
      this.toastr.error('Phone number is required');
      return false;
    }

    if (!this.isValidPhone(this.editForm.phone)) {
      this.toastr.error('Please enter a valid phone number');
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  getComplaintSuccessRate(): number {
    if (!this.userProfile || this.userProfile.totalComplaints === 0) return 0;
    return Math.round((this.userProfile.resolvedComplaints / this.userProfile.totalComplaints) * 100);
  }

  getAverageRatingStars(): number[] {
    const rating = this.userProfile?.averageRating || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 1 : (i - rating < 1 ? rating - Math.floor(rating) : 0));
    }
    return stars;
  }

  refreshProfile() {
    this.loadUserProfile();
    this.toastr.info('Profile refreshed');
  }

  isCitizen(): boolean {
    return this.userProfile?.role === UserRole.Citizen;
  }

  isWorker(): boolean {
    return this.userProfile?.role === UserRole.Worker;
  }

  isOfficial(): boolean {
    return this.userProfile?.role === UserRole.Official;
  }

  hasStats(): boolean {
    return this.userProfile && (
      this.userProfile.totalComplaints > 0 ||
      this.userProfile.totalFeedbacks > 0 ||
      this.userProfile.averageRating
    );
  }

}
