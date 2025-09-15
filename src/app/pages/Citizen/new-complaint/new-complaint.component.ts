import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { ToastrService } from 'ngx-toastr';
import { ComplaintService } from '../../services/complaint.service';
import * as L from 'leaflet';
import { AuthService } from '../../services/auth.service';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

@Component({
  selector: 'app-new-complaint',
  templateUrl: './new-complaint.component.html',
  styleUrls: ['./new-complaint.component.css']
})
export class NewComplaintComponent implements OnInit, AfterViewInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  complaint: any = {
    citizenId: this.authSvc.getUserId(),
    description: '',
    departmentId: '',
    categoryId: '',
    subCategoryId: '',
    addressText: '',
    latitude: null,
    longitude: null
  };

  departments: any[] = [];
  categories: any[] = [];
  subCategories: any[] = [];

  selectedFiles: File[] = [];
  previewImages: string[] = [];
  isSubmitting = false;

  map: any;
  marker: any;
  showMap = false;
  isLoadingLocation = false;
  locationError = '';

  // Form steps for better UX
  currentStep = 1;
  totalSteps = 4;

  constructor(
    private departmentSvc: DepartmentService,
    private complaintSvc: ComplaintService,
    private authSvc: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    // Initialize map after view is ready if needed
  }

  loadDepartments() {
    this.departmentSvc.getAllDepartments().subscribe({
      next: (res) => this.departments = res,
      error: (err) => this.toastr.error('Failed to load departments')
    });
  }

  onDepartmentChange() {
    const deptId = this.complaint.departmentId;
    this.complaint.categoryId = '';
    this.complaint.subCategoryId = '';
    this.subCategories = [];
    this.categories = [];
    if (deptId) {
      this.departmentSvc.getAllCategoriesbyDepartment(deptId).subscribe({
        next: (res) => this.categories = res,
        error: (err) => this.toastr.error('Failed to load categories')
      });
    }
  }

  onCategoryChange() {
    const catId = this.complaint.categoryId;
    this.complaint.subCategoryId = '';
    this.subCategories = [];
    if (catId) {
      this.departmentSvc.getAllSubCategoriesbyCategory(catId).subscribe({
        next: (res) => this.subCategories = res,
        error: (err) => this.toastr.error('Failed to load sub-categories')
      });
    }
  }

  onFileSelected(event: any) {
    const files: File[] = Array.from(event.target.files);
    
    // Validate file size and type
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

  removeImage(index: number) {
    this.previewImages.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  toggleMap() {
    this.showMap = !this.showMap;
    this.locationError = '';

    if (this.showMap) {
      // Use setTimeout to ensure DOM is rendered
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    } else {
      this.destroyMap();
    }
  }

  initializeMap() {
    try {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Default location (you can change this to your city's coordinates)
      const defaultLat = 26.9124; // Jaipur coordinates
      const defaultLng = 75.7873;

      this.map = L.map('mapContainer', {
        center: [this.complaint.latitude || defaultLat, this.complaint.longitude || defaultLng],
        zoom: this.complaint.latitude ? 15 : 10,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Add existing marker if coordinates exist
      if (this.complaint.latitude && this.complaint.longitude) {
        this.addMarker(this.complaint.latitude, this.complaint.longitude);
      }

      // Map click event
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.addMarker(e.latlng.lat, e.latlng.lng);
        this.reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      // Invalidate size after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);

    } catch (error) {
      console.error('Error initializing map:', error);
      this.locationError = 'Failed to initialize map';
    }
  }

  addMarker(lat: number, lng: number) {
    try {
      // Remove existing marker
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      // Add new marker
      this.marker = L.marker([lat, lng], {
        draggable: true
      }).addTo(this.map);

      // Update complaint coordinates
      this.complaint.latitude = lat;
      this.complaint.longitude = lng;

      // Marker drag event
      this.marker.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        this.complaint.latitude = position.lat;
        this.complaint.longitude = position.lng;
        this.reverseGeocode(position.lat, position.lng);
      });

      // Center map on marker
      this.map.setView([lat, lng], 15);

    } catch (error) {
      console.error('Error adding marker:', error);
    }
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.toastr.warning('Geolocation is not supported by your browser');
      return;
    }

    this.isLoadingLocation = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (!this.showMap) {
          this.showMap = true;
          setTimeout(() => {
            this.initializeMap();
            this.addMarker(lat, lng);
            this.reverseGeocode(lat, lng);
          }, 100);
        } else {
          this.addMarker(lat, lng);
          this.reverseGeocode(lat, lng);
        }

        this.isLoadingLocation = false;
        this.toastr.success('Location detected successfully');
      },
      (error) => {
        this.isLoadingLocation = false;
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
        
        this.locationError = message;
        this.toastr.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  // Reverse geocoding to get address from coordinates
  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          this.complaint.addressText = data.display_name;
        }
      })
      .catch(error => {
        console.error('Reverse geocoding failed:', error);
      });
  }

  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  // Step navigation
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  // Form validation for steps
  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!this.complaint.description;
      case 2:
        return !!(this.complaint.departmentId && this.complaint.categoryId && this.complaint.subCategoryId);
      case 3:
        return true; // Location is optional
      case 4:
        return true; // Attachments are optional
      default:
        return false;
    }
  }

  onSubmit(form: any) {
    if (form.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    
    // Append complaint data
    Object.entries(this.complaint).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      } else {
        formData.append(key, "");
      }
    });

    // Append files
    this.selectedFiles.forEach(file => {
      formData.append('attachments', file);
    });

    this.isSubmitting = true;
    this.complaintSvc.createComplaint(formData).subscribe({
      next: (res: any) => {
        this.toastr.success(res.message || 'Complaint created successfully');
        form.resetForm();
        this.resetForm();
        this.isSubmitting = false
      },
      error: (err: any) => {
        this.toastr.error(err.error?.message || 'Failed to create complaint');
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    this.complaint = {
      description: '',
      departmentId: '',
      categoryId: '',
      subCategoryId: '',
      addressText: '',
      latitude: null,
      longitude: null
    };
    this.previewImages = [];
    this.selectedFiles = [];
    this.isSubmitting = false;
    this.currentStep = 1;
    this.showMap = false;
    this.locationError = '';
    this.destroyMap();
  }

  ngOnDestroy() {
    this.destroyMap();
  }
}