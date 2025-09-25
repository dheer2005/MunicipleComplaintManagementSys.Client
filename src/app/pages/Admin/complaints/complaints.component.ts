import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-complaints',
  templateUrl: './complaints.component.html',
  styleUrls: ['./complaints.component.css']
})
export class ComplaintsComponent implements OnInit {
  complaints: any[] = [];
  filteredComplaints: any[] = []
  selectedGallery: { type: string, images: any[]} | null = null;
  showGalleryModal: boolean = false;
  searchTerm: string = '';
  statusFilter = 'All';
  feedbackFilter = 'All';
  sortBy = 'assignedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(private adminSvc: AdminService, private authSvc: AuthService, private toastrSvc: ToastrService) { }

  ngOnInit(): void {
    this.adminSvc.getAllComplaint().subscribe({
      next: (res:any)=> {
        this.complaints = res;
        this.filteredComplaints = this.complaints;
      }, 
      error: (err:any) => this.toastrSvc.error("Failed to load the complaints")
    });
    
  }

  onSearchChange(){
    this.applyFilters();
  }
  onFeedbackFilter(){
    this.applyFilters();
  }

  onStatusFilter(){
    this.applyFilters();
  }

  onSortChange(sortBy: string): void{
    if(this.sortBy === sortBy){
      this.sortOrder = this.sortOrder === 'asc'? 'desc':'asc';
    }else{
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }

    this.sortTasks();
  }

  sortTasks(){
    this.filteredComplaints.sort((a,b)=>{
      let aValue: any, bValue: any;

      switch(this.sortBy){
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default :
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if(this.sortOrder == 'asc'){
        return aValue > bValue ? 1 : -1;
      }else{
        return aValue < bValue ? 1 : -1;
      }
    })
  }
  
  applyFilters(){
    this.filteredComplaints = this.complaints.filter(complaints =>{
      const matchesStatus = this.statusFilter === 'All' || complaints.currentStatus === this.statusFilter;
      const matchesFeedback = this.feedbackFilter === 'All' || complaints.feedback?.isSatisfied === (this.feedbackFilter === 'true');
      const matchesSearchTerm = this.searchTerm === '' || 
      complaints.ticketNo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      complaints.citizenName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      complaints.categoryName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      complaints.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesFeedback && matchesSearchTerm;
    });
  }

  hasCitizenProof(attachments: any[]): boolean{
    return attachments?.some(a=>a.attachmentType == 'CitizenProof');
  }

  hasWorkerProof(attachments: any[]): boolean{
    return attachments?.some(a=>a.attachmentType == 'WorkerProof');
  }

  getCitizenProofs(attachments: any[]){
    return attachments?.filter(a=>a.attachmentType == 'CitizenProof');
  }

  getWorkerProofs(attachments: any[]){
    return attachments?.filter(a=>a.attachmentType == 'WorkerProof');
  }

  openMap(lat: number, lng: number) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  }

  openImage(url: string) {
    window.open(url, "_blank");
  }

  openGallery(images: any[], type: string){
    this.selectedGallery = { type, images };
    this.showGalleryModal = true;
  }

  closeGallery(){
    this.showGalleryModal = false;
    this.selectedGallery = null;
  }


}
