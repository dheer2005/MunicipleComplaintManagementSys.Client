import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'MunicipleComplaintMgmtSys.Client';
  showNavbar = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // login & register page pe navbar hide
      if (event.urlAfterRedirects === '/login' || event.urlAfterRedirects === '/register' || event.urlAfterRedirects === '**') {
        this.showNavbar = false;
      } else {
        this.showNavbar = true;
      }
    });
  }
  
}
