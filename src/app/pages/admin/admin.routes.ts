import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.AdminDashboardPage)
  },
  {
    path: 'doctor-verification',
    loadComponent: () => import('./doctor-verification/doctor-verification.page').then(m => m.DoctorVerificationPage)
  },
  {
    path: 'user-management',
    loadComponent: () => import('./user-management/user-management.page').then(m => m.UserManagementPage)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/analytics.page').then(m => m.AnalyticsPage)
  },
  {
    path: 'system-settings',
    loadComponent: () => import('./system-settings/system-settings.page').then(m => m.SystemSettingsPage)
  },
  {
    path: 'revenue',
    loadComponent: () => import('./revenue/revenue.page').then(m => m.RevenuePage)
  }
];
