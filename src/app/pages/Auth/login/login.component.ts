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
export class LoginComponent implements OnInit {
  loginData: any = {
    emailId: '',
    password: ''
  };

  constructor(private apiSvc: ApiService, private authSvc: AuthService, private route: Router, private toastrSvc: ToastrService) { }

  ngOnInit(): void {
  }

  onLogin() {
    this.apiSvc.login(this.loginData).subscribe({
      next: (res) => {
        this.authSvc.setToken(res.token);
        this.toastrSvc.success("Login successful!","Success");
        const role = this.authSvc.getUserRole();

        if (role === 'Citizen') {
          this.route.navigate(['/citizen/dashboard']);
        } else if (role === 'Official') {
          this.route.navigate(['/official/dashboard']);
        } else if (role === 'Worker') {
          this.route.navigate(['/worker/dashboard']);
        } else {
          this.route.navigate(['/']); // fallback
        }
        
      },
      error: (err) => {
        this.toastrSvc.error(err.error?.message || "Login failed. Please try again.","Error");
      }
    });
    
  }

}
