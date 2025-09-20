import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'user-type',
    loadComponent: () => import('./pages/user-type/user-type.page').then(m => m.UserTypePage)
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'doctor',
    loadChildren: () => import('./pages/doctor/doctor.routes').then(m => m.routes)
  },
  {
    path: 'patient',
    loadChildren: () => import('./pages/patient/patient.routes').then(m => m.routes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.routes)
  },
  {
    path: 'admin-setup',
    loadComponent: () => import('./pages/admin-setup/admin-setup.page').then(m => m.AdminSetupPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'video-consultation/:appointmentId',
    loadComponent: () => import('./pages/video-consultation/video-consultation.page').then(m => m.VideoConsultationPage)
  },
  {
    path: 'video-demo',
    loadComponent: () => import('./pages/video-demo/video-demo.page').then(m => m.VideoDemoPage)
  },
];
