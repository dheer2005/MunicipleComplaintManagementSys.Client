import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = "token";
  
    constructor(private jwtHelper: JwtHelperService, private toastrSvc: ToastrService, private router: Router ) { }
    
    getToken(): string | null {
      return localStorage.getItem(this.tokenKey);
    }
  
    setToken(token: string): void {
      localStorage.setItem(this.tokenKey, token);
    }
  
    removeToken(): void {
      localStorage.removeItem(this.tokenKey);
    }
  
    isLoggedIn(): boolean {
      return this.getToken() !== null;
    }
  
    checkAuthentication(){
      const token = this.getToken();
      if (token && !this.jwtHelper.isTokenExpired(token)) {
        return true;
      }else{
        if(token){
          this.toastrSvc.info("Session Expired! Please login again.","Info");
          this.removeToken();
          this.router.navigate(['/login']);
          return false;
        }
      }
      return false;
    }
  
    getDecodedToken(): any{
      const token = this.getToken();
      if(token){
        return this.jwtHelper.decodeToken(token);
      }
      return null;
    }
  
    getUserId(): string | null {
      const decodedToken = this.getDecodedToken();
      return decodedToken ? decodedToken.sub : null;
    }
  
    getUserEmail(): string | null{
      const decodedToken = this.getDecodedToken();
      return decodedToken ? decodedToken.email : null;
    }
  
    getUserRole(): string | null 
    {
      const decodedToken = this.getDecodedToken();
      return decodedToken ? decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] : null;
    } 
  
    getUserFullName(): string | null{
      const decodedToken = this.getDecodedToken();
      return decodedToken ? decodedToken.name : null;
    }
}
