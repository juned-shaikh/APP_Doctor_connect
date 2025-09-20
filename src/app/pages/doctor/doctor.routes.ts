import { Routes } from '@angular/router';
import { DoctorShellComponent } from './doctor-shell/doctor-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: DoctorShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DoctorDashboardPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then(m => m.DoctorProfilePage)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/bookings.page').then(m => m.DoctorBookingsPage)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./schedule/schedule.page').then(m => m.DoctorSchedulePage)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./prescriptions/prescriptions.page').then(m => m.DoctorPrescriptionsPage)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./analytics/analytics.page').then(m => m.DoctorAnalyticsPage)
      },
      {
        path: 'kyc-verification',
        loadComponent: () => import('./kyc-verification/kyc-verification.page').then(m => m.KycVerificationPage)
      }
    ]
  }
];
