import { Routes } from '@angular/router';
import { PatientShellComponent } from './patient-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: PatientShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then(m => m.PatientDashboardPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then(m => m.PatientProfilePage)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./appointments/appointments.page').then(m => m.PatientAppointmentsPage)
      },
      {
        path: 'search-doctors',
        loadComponent: () => import('./search-doctors/search-doctors.page').then(m => m.SearchDoctorsPage)
      },
      {
        path: 'doctor-details/:id',
        loadComponent: () => import('./doctor-details/doctor-details.page').then(m => m.DoctorDetailsPage)
      },
      {
        path: 'book-appointment/:doctorId',
        loadComponent: () => import('./book-appointment/book-appointment.page').then(m => m.BookAppointmentPage)
      },
      {
        path: 'reschedule-appointment/:appointmentId',
        loadComponent: () => import('./reschedule-appointment/reschedule-appointment.page').then(m => m.RescheduleAppointmentPage)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./prescriptions/prescriptions.page').then(m => m.PatientPrescriptionsPage)
      },
      {
        path: 'simple-notification-test',
        loadComponent: () => import('../../components/simple-notification-test.component').then(m => m.SimpleNotificationTestComponent)
      }
    ]
  }
];
