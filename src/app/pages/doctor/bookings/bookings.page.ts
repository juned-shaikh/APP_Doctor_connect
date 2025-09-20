import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonChip, IonLabel,
  IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonSpinner,
  IonItem, IonAvatar, IonNote, ActionSheetController, AlertController, ToastController,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, timeOutline, personOutline, callOutline,
  videocamOutline, cashOutline, cardOutline, ellipsisVerticalOutline,
  checkmarkCircleOutline, closeCircleOutline, warningOutline,
  documentTextOutline, locationOutline, refreshOutline, searchOutline,
  eyeOutline, closeOutline, helpCircleOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, AppointmentData } from '../../../services/firebase.service';
import { AppointmentService } from '../../../services/appointment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-bookings',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button (click)="goBack()"></ion-back-button>
        </ion-buttons>
        <ion-title>Appointment Bookings</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="refreshBookings()">
            <ion-icon name="refresh-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <ion-refresher slot="fixed" (ionRefresh)="refreshBookings($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="bookings-container">
        <!-- Stats Overview -->
       

        <!-- Filter Segment -->
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="onFilterChange($event)" class="auth-segment">
          <ion-segment-button value="all" class="segment-btn">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pending" class="segment-btn">
            <ion-label>Pending</ion-label>
            <ion-badge *ngIf="pendingApprovals > 0" color="warning">{{ pendingApprovals }}</ion-badge>
          </ion-segment-button>
          <ion-segment-button value="confirmed" class="segment-btn">
            <ion-label>Confirmed</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed" class="segment-btn">
            <ion-label>Completed</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Loading bookings...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredBookings.length === 0" class="empty-state">
          <ion-icon name="calendar-outline" size="large" color="medium"></ion-icon>
          <h3>No bookings found</h3>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>

        <!-- Bookings List -->
        <div *ngIf="!isLoading && filteredBookings.length > 0" class="bookings-list">
          <ion-card *ngFor="let booking of filteredBookings" class="booking-card">
            <ion-card-content>
              <div class="booking-header">
                <div class="patient-info">
                  <ion-avatar>
                    <img [src]="booking.patientAvatar || 'assets/default-patient.png'" [alt]="booking.patientName">
                  </ion-avatar>
                  <div class="patient-details">
                    <h3>{{ booking.patientName }}</h3>
                    <p class="age-gender">{{ booking.patientAge }} years, {{ booking.patientGender }}</p>
                    <p class="phone">{{ booking.patientPhone }}</p>
                  </div>
                </div>
                <div class="booking-actions">
                  <ion-chip [color]="getStatusColor(booking.status)">
                    <ion-icon [name]="getStatusIcon(booking.status)"></ion-icon>
                    <ion-label>{{ booking.status }}</ion-label>
                  </ion-chip>
                  <ion-button fill="clear" size="small" (click)="showBookingActions(booking)">
                    <ion-icon name="ellipsis-vertical-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>

              <div class="booking-details">
                <div class="detail-item">
                  <ion-icon name="calendar-outline" color="primary"></ion-icon>
                  <span>{{ formatDate(booking.date) }}</span>
                </div>
                <div class="detail-item">
                  <ion-icon name="time-outline" color="primary"></ion-icon>
                  <span>{{ booking.time }}</span>
                </div>
                <div class="detail-item">
                  <ion-icon [name]="booking.appointmentType === 'video' ? 'videocam-outline' : 'location-outline'" color="primary"></ion-icon>
                  <span>{{ booking.appointmentType === 'video' ? 'Video Consultation' : 'Clinic Visit' }}</span>
                </div>
                <div class="detail-item">
                  <ion-icon [name]="booking.paymentMethod === 'online' ? 'card-outline' : 'cash-outline'" color="primary"></ion-icon>
                  <span>₹{{ booking.fee }} - {{ booking.paymentMethod === 'online' ? 'Paid Online' : 'Pay at Clinic' }}</span>
                </div>
              </div>

              <div *ngIf="booking.symptoms" class="symptoms">
                <p><strong>Symptoms/Reason:</strong> {{ booking.symptoms }}</p>
              </div>

              <div class="booking-footer">
                <div class="action-buttons">
                  <ion-button *ngIf="booking.status === 'pending'" fill="solid" color="success" size="small" (click)="approveBooking(booking)">
                    <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                    Approve
                  </ion-button>
                  <ion-button *ngIf="booking.status === 'pending'" fill="outline" color="danger" size="small" (click)="rejectBooking(booking)">
                    <ion-icon name="close-circle-outline" slot="start"></ion-icon>
                    Reject
                  </ion-button>
                  <ion-button *ngIf="booking.status === 'confirmed' && isToday(booking.date)" fill="solid" size="small" (click)="startConsultation(booking)">
                    <ion-icon [name]="booking.appointmentType === 'video' ? 'videocam-outline' : 'person-outline'" slot="start"></ion-icon>
                    {{ booking.appointmentType === 'video' ? 'Start Video Call' : 'Mark Present' }}
                  </ion-button>
                  <ion-button *ngIf="booking.status === 'completed'" fill="outline" size="small" (click)="viewPrescription(booking)">
                    <ion-icon name="document-text-outline" slot="start"></ion-icon>
                    Prescription
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
    .bookings-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .stats-overview {
      margin-bottom: 1rem;
    }
    
    .stats-card {
      margin: 0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      text-align: center;
    }
    
    .stat-item h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--ion-color-primary);
    }
    
    .stat-item p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    
    .stat-item ion-badge {
      margin-left: 0.5rem;
    }
    
    ion-segment {
      margin-bottom: 1rem;
    }

    /* Pill segment styling to match Login page */
    .auth-segment {
      --background: rgba(32, 201, 151, 0.10);
      border-radius: 16px;
      padding: 6px;
      margin-bottom: 14px;
    }

    .segment-btn {
      --background: transparent;
      --background-checked: linear-gradient(135deg, rgba(40,167,69,0.95), rgba(32,201,151,0.95));
      --color: rgba(0,0,0,0.6);
      --color-checked: #ffffff;
      --indicator-color: transparent;
      border-radius: 12px;
      min-height: 44px;
      position: relative;
      transition: opacity .2s ease, transform .2s ease;
      opacity: 0.7;
    }

    .segment-btn.segment-button-checked {
      opacity: 1;
      box-shadow: 0 8px 20px rgba(40,167,69,0.20);
    }

    .segment-btn.segment-button-checked::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 6px;
      height: 2px;
      background: #ffffff;
      border-radius: 2px;
      opacity: 0.95;
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
    
    .bookings-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .booking-card {
      margin: 0;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .patient-info {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex: 1;
    }
    
    .patient-details h3 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
      font-size: 1.1rem;
    }
    
    .patient-details p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .age-gender {
      color: var(--ion-color-primary);
      font-weight: 500;
    }
    
    .phone {
      color: var(--ion-color-medium);
    }
    
    .booking-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .booking-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    @media (max-width: 768px) {
      .booking-details {
        grid-template-columns: 1fr;
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
    
    .booking-footer {
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
      .booking-header {
        flex-direction: column;
        gap: 1rem;
      }
      
      .booking-actions {
        width: 100%;
        justify-content: space-between;
      }
      
      .booking-footer {
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
    IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonChip, IonLabel,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonSpinner,
    IonItem, IonAvatar, IonNote, IonBadge
  ],
  standalone: true
})
export class DoctorBookingsPage implements OnInit {
  bookings: any[] = [];
  filteredBookings: any[] = [];
  selectedFilter = 'all';
  isLoading = true;
  private bookingsSub?: Subscription;

  // Stats
  todayBookings = 0;
  pendingApprovals = 0;
  weeklyBookings = 0;
  weeklyRevenue = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController,
    private firebaseService: FirebaseService,
    private appointmentService: AppointmentService
  ) {
    addIcons({
      calendarOutline, timeOutline, personOutline, callOutline,
      videocamOutline, cashOutline, cardOutline, ellipsisVerticalOutline,
      checkmarkCircleOutline, closeCircleOutline, warningOutline,
      documentTextOutline, locationOutline, refreshOutline, searchOutline,
      eyeOutline, closeOutline, helpCircleOutline
    });
  }

  ngOnInit() {
    // Subscribe to live appointments for this doctor
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.uid) {
      this.subscribeToDoctorBookings(currentUser.uid);
    } else {
      // Fallback: wait briefly for auth state, then try again
      setTimeout(() => {
        const user = this.authService.getCurrentUser();
        if (user?.uid) {
          this.subscribeToDoctorBookings(user.uid);
        } else {
          this.isLoading = false;
          console.error('Doctor not authenticated');
        }
      }, 500);
    }
  }

  ngOnDestroy() {
    this.bookingsSub?.unsubscribe();
  }

  private subscribeToDoctorBookings(doctorUid: string) {
    this.isLoading = true;
    this.bookingsSub?.unsubscribe();
    this.bookingsSub = this.firebaseService.getAppointmentsByDoctor(doctorUid).subscribe({
      next: (appointments) => {
        console.log('Appointments received:', appointments.length);
        this.bookings = appointments;
        this.calculateStats();
        this.filterBookings();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error subscribing to bookings:', err);
        this.isLoading = false;
      }
    });
  }
  goBack() {
    this.router.navigate(['/doctor/dashboard']);
  }

  calculateStats() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.todayBookings = this.bookings.filter(booking =>
      new Date(booking.date).toDateString() === today.toDateString()
    ).length;

    this.pendingApprovals = this.bookings.filter(booking =>
      booking.status === 'pending'
    ).length;
console.log(this.pendingApprovals)
    const weeklyBookings = this.bookings.filter(booking =>
      new Date(booking.date) >= weekAgo && new Date(booking.date) <= today
    );

    this.weeklyBookings = weeklyBookings.length;
    this.weeklyRevenue = weeklyBookings
      .filter(booking => booking.status === 'completed' || booking.paymentMethod === 'online')
      .reduce((sum, booking) => sum + booking.fee, 0);
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.filterBookings();
  }

  filterBookings() {
    if (this.selectedFilter === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(booking =>
        booking.status.toLowerCase() === this.selectedFilter
      );
    }
  }

  async refreshBookings(event?: any) {
    // Live updates are already active; just complete refresher
    if (event) event.target.complete();
  }

  getEmptyStateMessage(): string {
    switch (this.selectedFilter) {
      case 'pending': return 'No pending bookings to review.';
      case 'confirmed': return 'No confirmed bookings.';
      case 'completed': return 'No completed consultations.';
      default: return 'No bookings found.';
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
      case 'pending': return 'time-outline';
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

  isToday(date: Date): boolean {
    const today = new Date();
    const bookingDate = new Date(date);
    return bookingDate.toDateString() === today.toDateString();
  }

  async showBookingActions(booking: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Booking Actions',
      buttons: [
        {
          text: 'View Patient Details',
          icon: 'person-outline',
          handler: () => this.viewPatientDetails(booking)
        },
        {
          text: 'Contact Patient',
          icon: 'call-outline',
          handler: () => this.contactPatient(booking)
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  viewPatientDetails(booking: any) {
    console.log('View patient details:', booking.patientName);
  }

  contactPatient(booking: any) {
    console.log('Contact patient:', booking.patientName);
  }

  async approveBooking(booking: any) {
    if (!booking.id) return;
    try {
      await this.appointmentService.approveAppointment(booking.id);
    } catch (e) {
      console.error(e);
      await this.showToast('Failed to approve booking', 'danger');
    }
  }

  async rejectBooking(booking: any) {
    const alert = await this.alertController.create({
      header: 'Reject Booking',
      message: `Reject appointment with ${booking.patientName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: async () => {
            try {
              if (booking.id) {
                await this.appointmentService.rejectAppointment(booking.id, 'Rejected by doctor');
              }
            } catch (e) {
              console.error(e);
              await this.showToast('Failed to reject booking', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async startConsultation(booking: any) {
    try {
      if (booking.appointmentType === 'video') {
        // Navigate to video consultation page
        this.router.navigate(['/video-consultation', booking.id]);
        return;
      }
      
      // For clinic visits, mark patient as present
      if (!booking.id) return;
      await this.appointmentService.checkInAppointment(booking.id);
      await this.showToast('Marked patient as present', 'success');
    } catch (e) {
      console.error(e);
      await this.showToast('Failed to start consultation', 'danger');
    }
  }

  viewPrescription(booking: any) {
    console.log('View prescription:', booking.patientName);
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
