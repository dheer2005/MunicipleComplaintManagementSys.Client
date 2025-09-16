import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NavbarComponent } from './pages/Shared/nav-bar/nav-bar.component';
import { LoginComponent } from './pages/Auth/login/login.component';
import { RegisterComponent } from './pages/Auth/register/register.component';
import { NewComplaintComponent } from './pages/Citizen/new-complaint/new-complaint.component';
import { MyComplaintsComponent } from './pages/Citizen/my-complaints/my-complaints.component';
import { ProfileComponent } from './pages/Citizen/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/Citizen/dashboard/dashboard.component';
import { MyTasksComponent } from './pages/Worker/my-tasks/my-tasks.component';
import { UpdateTaskComponent } from './pages/Worker/update-task/update-task.component';
import { ComplaintDepartmentsComponent } from './pages/Official/complaint-departments/complaint-departments.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { WorkerDashboardComponent } from './pages/Worker/worker-dashboard/worker-dashboard.component';
import { OfficialDashboardComponent } from './pages/Official/official-dashboard/official-dashboard.component';
import { AssignComplaintsComponent } from './pages/Official/assign-complaints/assign-complaints.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'citizen/dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'citizen/complaint/new', component: NewComplaintComponent, canActivate: [AuthGuard] },
  { path: 'citizen/complaints/my', component: MyComplaintsComponent, canActivate: [AuthGuard] },
  { path: 'citizen/profile', component: ProfileComponent,canActivate: [AuthGuard] },
  { path: 'worker/dashboard', component: WorkerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'worker/tasks', component: MyTasksComponent, canActivate: [AuthGuard]},
  { path: 'worker/update-task/:complaintId', component: UpdateTaskComponent, canActivate: [AuthGuard]},
  { path: 'official/dashboard', component: OfficialDashboardComponent, canActivate: [AuthGuard] },
  { path: 'official/complaints/department', component: ComplaintDepartmentsComponent, canActivate: [AuthGuard] },
  { path: 'official/complaints/assign', component: AssignComplaintsComponent, canActivate: [AuthGuard] },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
