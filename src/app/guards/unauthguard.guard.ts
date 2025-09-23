import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../pages/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UnauthguardGuard implements CanActivate {
  constructor(private authSvc: AuthService, private router: Router){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if(this.authSvc.isLoggedIn() && this.authSvc.checkAuthentication()){
        const role = this.authSvc.getUserRole();

        switch(role){
          case 'Citizen':
            this.router.navigate(['/citizen/complaints/my']);
            break;
          case 'Worker':
            this.router.navigate(['worker/dashboard']);
            break;
          case 'Admin':
            this.router.navigate(['admin/dashboard']);
            break;

          default:
            this.router.navigate(['/']);
        }

        return false;
      }

      return true;
  }
  
}
