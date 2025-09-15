import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { fromEvent, Subscription } from 'rxjs';
import { filter, debounceTime } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('navList', { static: true }) navList!: ElementRef<HTMLElement>;
  @ViewChild('underline', { static: true }) underline!: ElementRef<HTMLElement>;

  role: string | null = null;   
  fullName: string | null = null;

  private subs = new Subscription();

  constructor(private router: Router, private authSvc: AuthService) {
    this.role = this.authSvc.getUserRole();
    this.fullName = this.authSvc.getUserFullName();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.moveUnderlineToActive(), 100);

    const navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.moveUnderlineToActive(), 100));
    this.subs.add(navSub);

    const resizeSub = fromEvent(window, 'resize')
      .pipe(debounceTime(120))
      .subscribe(() => this.moveUnderlineToActive());
    this.subs.add(resizeSub);
  }

  moveUnderlineToActive() {
    const ulEl = this.navList.nativeElement;
    const underlineEl = this.underline.nativeElement;
    const activeItem = ulEl.querySelector('li.active') as HTMLElement;

    if (!activeItem) {
      underlineEl.style.width = '0';
      underlineEl.style.opacity = '0';
      return;
    }

    const ulRect = ulEl.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const left = itemRect.left - ulRect.left;
    const width = itemRect.width;

    underlineEl.style.left = `${left}px`;
    underlineEl.style.width = `${width}px`;
    underlineEl.style.opacity = '1';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
