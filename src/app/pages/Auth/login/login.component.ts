import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData: any = {
    emailId: '',
    password: ''
  };

  constructor(private apiSvc: ApiService, private authSvc: AuthService, private route: Router, private toastrSvc: ToastrService) { }


  onLogin() {
    this.apiSvc.login(this.loginData).subscribe({
      next: (res) => {
        const auditObj = {
          userId: res.userId,
          action: 'Login',
          ActionResult: 'LoggedIn successfully'
        }
        this.authSvc.createAudit(auditObj).subscribe();
        this.authSvc.setToken(res.token);
        this.toastrSvc.success("Login successfull!","Success");
        const role = this.authSvc.getUserRole();

        if (role === 'Citizen') {
          this.route.navigate(['/citizen/complaints/my']);
        } else if (role === 'Official') {
          this.route.navigate(['/official/complaints/department']);
        } else if (role === 'Worker') {
          this.route.navigate(['/worker/dashboard']);
        }else if(role === 'Admin') {
          this.route.navigate(['/admin/dashboard']);
        }else {
          this.route.navigate(['/']); 
        }
      },
      error: (err) => {
        this.toastrSvc.error(err.error?.message || "Login failed. Please try again.","Error");
        const auditObj = {
          userId: '',
          action: 'Login',
          ActionResult: 'Failed to login'
        }
        this.authSvc.createAudit(auditObj).subscribe();
      }
    });
    
  }

}
