import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonBackButton, IonButtons, IonChip, IonLabel,
  IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonSpinner,
  ActionSheetController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, timeOutline, locationOutline, personOutline,
  callOutline, videocamOutline, cashOutline, cardOutline,
  ellipsisVerticalOutline, checkmarkCircleOutline, closeCircleOutline,
  timeOutline as timeCircleOutline, refreshOutline, searchOutline,
  eyeOutline, closeOutline, helpCircleOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { AppointmentService } from '../../../services/appointment.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-patient-appointments',
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/patient/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>My Appointments</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">

      <ion-refresher slot="fixed" (ionRefresh)="refreshAppointments($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="appointments-container">
        <!-- Filter Segment -->
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="onFilterChange($event)">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="upcoming">
            <ion-label>Upcoming</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Completed</ion-label>
          </ion-segment-button>
          <ion-segment-button value="cancelled">
            <ion-label>Cancelled</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Loading appointments...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredAppointments.length === 0" class="empty-state">
          <ion-icon name="calendar-outline" size="large" color="medium"></ion-icon>
          <h3>No appointments found</h3>
          <p>{{ getEmptyStateMessage() }}</p>
          <ion-button fill="outline" (click)="searchDoctors()">
            <ion-icon name="search-outline" slot="start"></ion-icon>
            Find Doctors
          </ion-button>
        </div>

        <!-- Appointments List -->
        <div *ngIf="!isLoading && filteredAppointments.length > 0" class="appointments-list">
          <ion-card *ngFor="let appointment of filteredAppointments" class="appointment-card">
            <ion-card-content>
              <div class="appointment-header">
                <div class="doctor-info">
                  <!-- <ion-avatar>
                    <img [src]="appointment.doctorAvatar || 'assets/default-doctor.png'" [alt]="appointment.doctorName">
                  </ion-avatar> -->
                  <div class="doctor-details">
                    <h3>{{ appointment.doctorName }}</h3>
                    <p class="specialization">{{ appointment.specialization }}</p>
                  </div>
                </div>
                <div class="appointment-actions">
                  <ion-chip [color]="getStatusColor(appointment.status)">
                    <ion-icon [name]="getStatusIcon(appointment.status)"></ion-icon>
                    <ion-label>{{ appointment.status }}</ion-label>
                  </ion-chip>
                  <ion-button fill="clear" size="small" (click)="showAppointmentActions(appointment)">
                    <ion-icon style="color:white" name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>

              <div class="appointment-details">
                <div class="detail-item">
                  <ion-icon name="calendar-outline" color="primary"></ion-icon>
                  <span>{{ formatDate(appointment.date) }}</span>
                </div>
                <div class="detail-item">
                  <ion-icon name="time-outline" color="primary"></ion-icon>
                  <span>{{ appointment.time }}</span>
                </div>
                <div class="detail-item">
                  <ion-icon [name]="appointment.type === 'video' ? 'videocam-outline' : 'location-outline'" color="primary"></ion-icon>
                  <span>{{ appointment.type === 'video' ? 'Video Consultation' : 'Clinic Visit' }}</span>
                </div>
                <div class="detail-item">
                  <ion-icon [name]="appointment.paymentMethod === 'online' ? 'card-outline' : 'cash-outline'" color="primary"></ion-icon>
                  <span>₹{{ appointment.fee }} - {{ appointment.paymentMethod === 'online' ? 'Paid Online' : 'Pay at Clinic' }}</span>
                </div>
              </div>

              <div *ngIf="appointment.symptoms" class="symptoms">
                <p><strong>Symptoms:</strong> {{ appointment.symptoms }}</p>
              </div>

              <div class="appointment-footer">
               
                <div class="action-buttons">
                  <ion-button *ngIf="canReschedule(appointment)" fill="outline" size="small" (click)="rescheduleAppointment(appointment)">
                    Reschedule
                  </ion-button>
                  <ion-button *ngIf="canCancel(appointment)" fill="outline" color="danger" size="small" (click)="cancelAppointment(appointment)">
                    Cancel
                  </ion-button>
                  <ion-button *ngIf="appointment.status === 'confirmed' && isToday(appointment.date)" fill="solid" size="small" (click)="joinConsultation(appointment)">
                    {{ appointment.type === 'video' ? 'Join Video Call' : 'View Details' }}
                  </ion-button>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* Force header height in this component */
    :host ion-header ion-toolbar {
      --min-height: 40px !important;
      height: 40px !important;
      min-height: 40px !important;
      max-height: 40px !important;
    }
    
    :host ion-header ion-toolbar ion-title {
      height: 40px !important;
      font-size: 1rem !important;
      display: flex !important;
      align-items: center !important;
    }
    
    :host ion-header ion-toolbar ion-buttons {
      height: 40px !important;
    }
    
    :host ion-header ion-toolbar ion-back-button {
      height: 40px !important;
      --min-height: 40px !important;
    }
    
    .appointments-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    ion-segment {
      margin-bottom: 1rem;
    }
    
    .loading-container {
      text-align: center;
      padding: 3rem 1rem;
    }
    
    .loading-container p {
      margin-top: 1rem;
      opacity: 0.7;
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    
    .empty-state ion-icon {
      margin-bottom: 1rem;
    }
    
    .empty-state h3 {
      margin: 1rem 0 0.5rem 0;
      color: var(--ion-color-medium);
    }
    
    .empty-state p {
      margin-bottom: 2rem;
      opacity: 0.7;
    }
    
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .appointment-card {
      margin: 0;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .doctor-info {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex: 1;
    }
    
    .doctor-details h3 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
      font-size: 1.1rem;
    }
    
    .doctor-details p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .specialization {
      color: var(--ion-color-primary);
      font-weight: 500;
    }
    
    .appointment-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .appointment-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    @media (max-width: 768px) {
      .appointments-container {
        padding: 0.5rem;
      }
      
      .appointment-details {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      
      .appointment-header {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
      
      .doctor-info {
        width: 100%;
      }
      
      .appointment-actions {
        width: 100%;
        justify-content: space-between;
      }
      
      .detail-item {
        font-size: 0.85rem;
      }
      
      .action-buttons ion-button {
        font-size: 0.8rem;
        --padding-start: 0.5rem;
        --padding-end: 0.5rem;
      }
    }
    
    @media (max-width: 480px) {
      .appointments-container {
        padding: 0.25rem;
      }
      
      .appointment-card {
        border-radius: 8px;
      }
      
      .doctor-details h3 {
        font-size: 1rem;
      }
      
      .doctor-details p {
        font-size: 0.8rem;
      }
      
      .action-buttons {
        flex-direction: column;
        width: 100%;
        gap: 0.25rem;
      }
      
      .action-buttons ion-button {
        width: 100%;
        margin: 0;
      }
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .detail-item ion-icon {
      font-size: 1rem;
    }
    
    .symptoms {
      background: var(--ion-color-light);
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .symptoms p {
      margin: 0;
      font-size: 0.9rem;
    }
    
    .appointment-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--ion-color-light);
    }
    
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    @media (max-width: 768px) {
      .appointment-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .action-buttons {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonBackButton, IonButtons, IonChip, IonLabel,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonSpinner
  ],
  standalone: true
})
export class PatientAppointmentsPage implements OnInit {
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  selectedFilter = 'all';
  isLoading = true;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private appointmentService: AppointmentService,
    private notificationService: NotificationService,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      calendarOutline, timeOutline, locationOutline, personOutline,
      callOutline, videocamOutline, cashOutline, cardOutline,
      ellipsisVerticalOutline, checkmarkCircleOutline, closeCircleOutline,
      timeCircleOutline, refreshOutline, searchOutline, eyeOutline,
      closeOutline, helpCircleOutline
    });
  }

  ngOnInit() {
    this.overrideBackButton();
    this.loadAppointments();
  }

  // Override the default back button behavior to ensure navigation to dashboard
  private overrideBackButton() {
    // Add a small delay to ensure the back button is properly initialized
    setTimeout(() => {
      const backButton = document.querySelector('ion-back-button');
      if (backButton) {
        // Remove any existing event listeners
        backButton.removeEventListener('click', this.handleBackButtonClick.bind(this));
        // Add our custom event listener
        backButton.addEventListener('click', this.handleBackButtonClick.bind(this));
      }
    }, 100);
  }

  // Handle back button click event
  private handleBackButtonClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if user is authenticated before navigation
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Navigate to patient dashboard
      this.router.navigate(['/patient/dashboard']);
    } else {
      // If not authenticated, go to login
      this.router.navigate(['/auth/login']);
    }
  }

  async loadAppointments() {
    this.isLoading = true;

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Fetch appointments from Firebase
      this.firebaseService.getAppointmentsByPatient(currentUser.uid).subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          this.filterAppointments();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.showToast('Failed to load appointments', 'danger');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showToast('Failed to load appointments', 'danger');
      this.isLoading = false;
    }
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.filterAppointments();
  }

  filterAppointments() {
    if (this.selectedFilter === 'all') {
      this.filteredAppointments = [...this.appointments];
    } else {
      this.filteredAppointments = this.appointments.filter(appointment =>
        appointment.status.toLowerCase() === this.selectedFilter
      );
    }

    // Sort by date (newest first)
    this.filteredAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async refreshAppointments(event: any) {
    await this.loadAppointments();
    event.target.complete();
  }

  getEmptyStateMessage(): string {
    switch (this.selectedFilter) {
      case 'upcoming': return 'You have no upcoming appointments.';
      case 'completed': return 'You have no completed appointments.';
      case 'cancelled': return 'You have no cancelled appointments.';
      default: return 'You haven\'t booked any appointments yet.';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'checkmark-circle-outline';
      case 'pending': return 'time-circle-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canReschedule(appointment: any): boolean {
    return ['confirmed', 'pending'].includes(appointment.status.toLowerCase()) &&
      new Date(appointment.date) > new Date();
  }

  canCancel(appointment: any): boolean {
    return ['confirmed', 'pending'].includes(appointment.status.toLowerCase()) &&
      new Date(appointment.date) > new Date();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    const appointmentDate = new Date(date);
    return appointmentDate.toDateString() === today.toDateString();
  }

  async showAppointmentActions(appointment: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Appointment Actions',
      buttons: [
        {
          text: 'View Details',
          icon: 'eye-outline',
          handler: () => {
            this.viewAppointmentDetails(appointment);
          }
        },
        {
          text: 'Contact Doctor',
          icon: 'call-outline',
          handler: () => {
            this.contactDoctor(appointment);
          }
        },
        ...(this.canReschedule(appointment) ? [{
          text: 'Reschedule',
          icon: 'calendar-outline',
          handler: () => {
            this.rescheduleAppointment(appointment);
          }
        }] : []),
        ...(this.canCancel(appointment) ? [{
          text: 'Cancel',
          icon: 'close-outline',
          role: 'destructive',
          handler: () => {
            this.cancelAppointment(appointment);
          }
        }] : []),
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  viewAppointmentDetails(appointment: any) {
    // Navigate to appointment details page
    this.router.navigate(['/patient/appointment-details', appointment.id]);
  }

  contactDoctor(appointment: any) {
    // Navigate to doctor contact page or show contact options
    this.router.navigate(['/patient/doctor-details', appointment.doctorId]);
  }

  rescheduleAppointment(appointment: any) {
    // Navigate to reschedule page
    this.router.navigate(['/patient/reschedule-appointment', appointment.id]);
  }

  async cancelAppointment(appointment: any) {
    const alert = await this.alertController.create({
      header: 'Cancel Appointment',
      message: `Are you sure you want to cancel your appointment with ${appointment.doctorName}?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for cancellation (optional)'
        }
      ],
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          handler: async (data) => {
            try {
              await this.appointmentService.cancelAppointment(appointment.id);
              await this.loadAppointments(); // Refresh the list
              await this.showToast('Appointment cancelled successfully', 'success');
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              await this.showToast('Failed to cancel appointment', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  joinConsultation(appointment: any) {
    if (appointment.type === 'video') {
      // Navigate to video consultation page
      this.router.navigate(['/patient/video-consultation', appointment.id]);
    } else {
      // Show clinic details
      this.viewAppointmentDetails(appointment);
    }
  }

  searchDoctors() {
    this.router.navigate(['/patient/search-doctors']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
