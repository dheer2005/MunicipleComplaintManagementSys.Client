import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  auditLogs: any[] = [];

  constructor(private adminSvc: AdminService, private toastrSvc: ToastrService) { }

  ngOnInit(): void {
    this.adminSvc.getAllAuditLogs().subscribe({
      next: (res:any)=>{
        this.auditLogs = res;
        console.log("audit logs", res);
      },
      error: (err:any)=>{
        this.toastrSvc.error("Failed to load the logs");
      }
    })
  }

}
