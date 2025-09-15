import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../pages/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authSvc: AuthService, private router: Router) {}
  role: string | null = null;
  isLoggedIn: boolean = this.authSvc.isLoggedIn();

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      this.role = this.authSvc.getUserRole();
      if(!this.isLoggedIn || !this.authSvc.checkAuthentication() || !this.role){
        this.router.navigate(['/login']);
        return false;
      }
    return true;
  }
  
}
