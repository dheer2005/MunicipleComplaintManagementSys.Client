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
  selectedGallery: { type: string, images: any[]} | null = null;
  showGalleryModal: boolean = false;

  constructor(private adminSvc: AdminService, private authSvc: AuthService, private toastrSvc: ToastrService) { }

  ngOnInit(): void {
    this.adminSvc.getAllComplaint().subscribe({
      next: (res:any)=> this.complaints = res,
      error: (err:any) => this.toastrSvc.error("Failed to load the complaints")
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
