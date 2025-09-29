import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JwtModule } from '@auth0/angular-jwt';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './pages/Auth/login/login.component';
import { RegisterComponent } from './pages/Auth/register/register.component';
import { NavbarComponent } from './pages/Shared/nav-bar/nav-bar.component';
import { NewComplaintComponent } from './pages/Citizen/new-complaint/new-complaint.component';
import { MyComplaintsComponent } from './pages/Citizen/my-complaints/my-complaints.component';
import { ProfileComponent } from './pages/Citizen/profile/profile.component';
import { WorkerDashboardComponent } from './pages/Worker/worker-dashboard/worker-dashboard.component';
import { MyTasksComponent } from './pages/Worker/my-tasks/my-tasks.component';
import { UpdateTaskComponent } from './pages/Worker/update-task/update-task.component';
import { ComplaintDepartmentsComponent } from './pages/Official/complaint-departments/complaint-departments.component';
import { AssignComplaintsComponent } from './pages/Official/assign-complaints/assign-complaints.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { AdminDashboardComponent } from './pages/Admin/admin-dashboard/admin-dashboard.component';
import { NgChartsModule } from 'ng2-charts';
import { DepartmentsComponent } from './pages/Admin/departments/departments.component';
import { UsersComponent } from './pages/Admin/users/users.component';
import { ComplaintsComponent } from './pages/Admin/complaints/complaints.component';
import { AuditLogsComponent } from './pages/Admin/audit-logs/audit-logs.component';
import { AddDepartmentsComponent } from './pages/Admin/add-departments/add-departments.component';

export function tokenGetter() {
  return localStorage.getItem('token'); 
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    NewComplaintComponent,
    MyComplaintsComponent,
    ProfileComponent,
    WorkerDashboardComponent,
    MyTasksComponent,
    UpdateTaskComponent,
    ComplaintDepartmentsComponent,
    AssignComplaintsComponent,
    PageNotFoundComponent,
    AdminDashboardComponent,
    DepartmentsComponent,
    UsersComponent,
    ComplaintsComponent,
    AuditLogsComponent,
    AddDepartmentsComponent,
    
  ],
  imports: [
    NgChartsModule,
    BrowserModule,
    RouterModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    FormsModule,
    CommonModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:7082'],
        disallowedRoutes: [
          'http://localhost:7082/api/Authentication/login',
          'http://localhost:7082/api/Authentication/register',
          // 'https://SmartLms.bsite.net/api/auth/login',
          // 'https://SmartLms.bsite.net/api/auth/register'
        ]
      }
    }),
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
