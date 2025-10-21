import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonGrid,
  IonRow, IonCol, IonChip, IonLabel, IonBadge, IonItem, IonAvatar, IonButtons,
  ActionSheetController, AlertController
} from '@ionic/angular/standalone';
import { FirebaseService, AppointmentData } from '../../../services/firebase.service';
import { AppointmentService } from '../../../services/appointment.service';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, peopleOutline, documentTextOutline, analyticsOutline,
  timeOutline, cashOutline, checkmarkCircleOutline, warningOutline,
  settingsOutline, notificationsOutline, starOutline, trendingUpOutline,
  ellipsisVerticalOutline, logOutOutline, videocamOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService, User } from 'src/app/services/auth.service';

@Component({
  selector: 'app-doctor-dashboard',
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-title>Doctor Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="viewNotifications()">
            <ion-icon name="notifications-outline"></ion-icon>
            <ion-badge *ngIf="notificationCount > 0" color="danger">{{ notificationCount }}</ion-badge>
          </ion-button>
          <ion-button fill="clear" (click)="showUserMenu()">
            <ion-icon name="ellipsis-vertical-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="dashboard-container">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <div class="doctor-info">
           
            <div class="doctor-details">
              <ion-text color="primary">
                <h2>Welcome, Dr. {{ currentUser?.name }}!</h2>
                <p>{{ getDoctorSpecialization() }}</p>
              </ion-text>
              <div class="verification-status">
                <ion-chip [color]="getVerificationColor()">
                  <ion-icon [name]="getVerificationIcon()"></ion-icon>
                  <ion-label>{{ getVerificationText() }}</ion-label>
                </ion-chip>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="stats-section">
          <ion-grid>
            <ion-row>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="calendar-outline" color="primary"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ todayAppointments }}</h3>
                        <p>Today's Appointments</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="people-outline" color="success"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ totalPatients }}</h3>
                        <p>Total Patients</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="cash-outline" color="warning"></ion-icon>
                      <div class="stat-details">
                        <h3>₹{{ monthlyRevenue }}</h3>
                        <p>This Month</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="star-outline" color="tertiary"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ rating }}</h3>
                        <p>Rating ({{ reviewCount }} reviews)</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <ion-text color="dark">
            <h3>Quick Actions</h3>
          </ion-text>
          <ion-grid>
            <ion-row>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="viewAppointments()">
                  <ion-card-content>
                    <ion-icon name="calendar-outline" color="primary"></ion-icon>
                    <p>Manage Appointments</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="manageSchedule()">
                  <ion-card-content>
                    <ion-icon name="time-outline" color="success"></ion-icon>
                    <p>Set Schedule</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="viewPrescriptions()">
                  <ion-card-content>
                    <ion-icon name="document-text-outline" color="tertiary"></ion-icon>
                    <p>Prescriptions</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="viewAnalytics()">
                  <ion-card-content>
                    <ion-icon name="analytics-outline" color="warning"></ion-icon>
                    <p>Analytics</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="updateProfile()">
                  <ion-card-content>
                    <ion-icon name="settings-outline" color="medium"></ion-icon>
                    <p>Profile Settings</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="completeKYC()" *ngIf="!isVerified()">
                  <ion-card-content>
                    <ion-icon name="checkmark-circle-outline" color="danger"></ion-icon>
                    <p>Complete KYC</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <!-- Today's Appointments -->
        <div class="appointments-section" *ngIf="upcomingAppointments.length > 0">
          <div class="section-header">
            <ion-text color="dark">
              <h3>Today's Appointments</h3>
            </ion-text>
            <ion-button fill="clear" size="small" (click)="viewAllAppointments()" style="color:white">
              View All
            </ion-button>
          </div>
          
          <ion-card *ngFor="let appointment of upcomingAppointments" class="appointment-card">
            <ion-card-content>
              <div class="appointment-info">
                <div class="appointment-details">
                  <h4>{{ appointment.patientName }}</h4>
                  <p class="time">{{ appointment.time }}</p>
                  <p class="type">{{ appointment.type }} Consultation</p>
                </div>
                <div class="appointment-actions">
                  <ion-chip [color]="getAppointmentStatusColor(appointment.status)">
                    {{ appointment.status }}
                  </ion-chip>
                  <div class="action-buttons" *ngIf="appointment.status === 'Pending'">
                    <ion-button size="small" fill="outline" color="success" (click)="approveAppointment(appointment.id)">
                      Approve
                    </ion-button>
                    <ion-button size="small" fill="outline" color="danger" (click)="rejectAppointment(appointment.id)">
                      Reject
                    </ion-button>
                  </div>
                  <div class="action-buttons" *ngIf="appointment.status === 'Confirmed'">
                    <ion-button 
                      *ngIf="appointment.type === 'Video'" 
                      size="small" 
                      fill="solid" 
                      color="primary" 
                      (click)="startVideoCall(appointment.id)">
                      <ion-icon name="videocam-outline" slot="start"></ion-icon>
                      Start Video Call
                    </ion-button>
                    <ion-button 
                      *ngIf="appointment.type === 'Clinic'" 
                      size="small" 
                      fill="outline" 
                      color="medium" 
                      (click)="markPatientPresent(appointment.id)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Mark Present
                    </ion-button>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Revenue Trend -->
        <div class="revenue-section">
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="trending-up-outline" color="success"></ion-icon>
                Revenue Overview
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="revenue-stats">
                <div class="revenue-item">
                  <p>This Week</p>
                  <h4>₹{{ weeklyRevenue }}</h4>
                </div>
                <div class="revenue-item">
                  <p>This Month</p>
                  <h4>₹{{ monthlyRevenue }}</h4>
                </div>
                <div class="revenue-item">
                  <p>Total Consultations</p>
                  <h4>{{ totalConsultations }}</h4>
                </div>
              </div>
              <ion-button expand="block" fill="outline" (click)="viewDetailedAnalytics()">
                View Detailed Analytics
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Verification Alert -->
        <ion-card class="alert-card" *ngIf="!isVerified()">
          <ion-card-content>
            <div class="alert-info">
              <ion-icon name="warning-outline" color="warning" size="large"></ion-icon>
              <div class="alert-text">
                <h3>Complete Your Verification</h3>
                <p>Upload your medical credentials to unlock all features and start accepting patients.</p>
              </div>
            </div>
            <ion-button expand="block" (click)="completeKYC()">
              Complete KYC Verification
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .dashboard-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .welcome-section {
      margin-bottom: 2rem;
    }
    .doctor-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .doctor-details h2 {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0 0 0.25rem 0;
    }
    .doctor-details p {
      margin: 0 0 0.5rem 0;
      opacity: 0.8;
    }
    .verification-status {
      margin-top: 0.5rem;
    }
    .stats-section {
      margin-bottom: 2rem;
    }
    .stat-card {
      margin: 0;
      height: 100%;
    }
    .stat-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-info ion-icon {
      font-size: 2rem;
    }
    .stat-details h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
      font-weight: bold;
    }
    .stat-details p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    .actions-section {
      margin-bottom: 2rem;
    }
    .actions-section h3 {
      margin: 0 0 1rem 0;
      font-weight: bold;
    }
    .action-card {
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
      margin: 0.25rem;
      height: 100%;
    }
    .action-card:hover {
      transform: translateY(-2px);
    }
    .action-card ion-card-content {
      padding: 1rem;
    }
    .action-card ion-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .action-card p {
      margin: 0;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .appointments-section {
      margin-bottom: 2rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-header h3 {
      margin: 0;
      font-weight: bold;
    }
    .appointment-card {
      margin-bottom: 0.5rem;
    }
    .appointment-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .appointment-details h4 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
    }
    .appointment-details p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }
    .time {
      color: var(--ion-color-primary);
      font-weight: 500;
    }
    .type {
      opacity: 0.7;
    }
    .appointment-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .revenue-section {
      margin-bottom: 2rem;
    }
    .revenue-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .revenue-item {
      text-align: center;
    }
    .revenue-item p {
      margin: 0 0 0.25rem 0;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    .revenue-item h4 {
      margin: 0;
      font-weight: bold;
      color: var(--ion-color-success);
    }
    .alert-card {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFECB3 100%);
      border-left: 4px solid var(--ion-color-warning);
    }
    .alert-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .alert-text h3 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
    }
    .alert-text p {
      margin: 0;
      opacity: 0.8;
    }
    @media (max-width: 768px) {
      .doctor-info {
        flex-direction: column;
        text-align: center;
      }
      .appointment-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .appointment-actions {
        align-items: flex-start;
        width: 100%;
      }
      .action-buttons {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonGrid,
    IonRow, IonCol, IonChip, IonLabel, IonBadge, IonItem, IonAvatar, IonButtons
  ],
  standalone: true
})
export class DoctorDashboardPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private authSub?: Subscription;
  private userSub?: Subscription;
  private apptSub?: Subscription;
  private statsWeekSub?: Subscription;
  private statsMonthSub?: Subscription;
  
  // Dashboard stats
  todayAppointments = 0;
  totalPatients = 156; // TODO: wire to real metric if desired
  monthlyRevenue = 0;
  weeklyRevenue = 0;
  totalConsultations = 234; // TODO: wire to real metric if desired
  rating = 4.8;
  reviewCount = 89;
  notificationCount = 3;
doctorProfile: User | null = null;
  upcomingAppointments: { id: string; patientName: string; time: string; type: string; status: string }[] = [];

  private capitalize(status: string): string {
    if (!status) return status;
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private firebaseService: FirebaseService,
    private appointmentService: AppointmentService
  ) {
    addIcons({ 
      calendarOutline, peopleOutline, documentTextOutline, analyticsOutline,
      timeOutline, cashOutline, checkmarkCircleOutline, warningOutline,
      settingsOutline, notificationsOutline, starOutline, trendingUpOutline,
      ellipsisVerticalOutline, logOutOutline, videocamOutline
    });
    // Subscribe to current user data
    this.authService.currentUser$.subscribe(user => {
      if (user && user.role === 'doctor') {
        this.doctorProfile = user;
      }
    });
  }

  ngOnInit() {
    // Subscribe to auth stream so we initialize data streams when user becomes available
    this.authSub = this.authService.currentUser$.subscribe((user:any) => {
      this.currentUser = user;
      const uid = user?.uid;

      // Tear down previous user-specific subscriptions before creating new ones
      this.userSub?.unsubscribe();
      this.apptSub?.unsubscribe();
      this.statsWeekSub?.unsubscribe();
      this.statsMonthSub?.unsubscribe();

      if (!uid) {
        // Clear UI data when signed out or user not yet loaded
        this.upcomingAppointments = [];
        this.todayAppointments = 0;
        this.weeklyRevenue = 0;
        this.monthlyRevenue = 0;
        return;
      }

      // Real-time subscription to user profile for live verification status (kycStatus)
      this.userSub = this.firebaseService.getUserById(uid).subscribe((u: any) => {
        // Merge into currentUser so template updates
        this.currentUser = { ...(this.currentUser as any), ...(u || {}) } as any;
      });

      // Real-time appointments for today
      this.apptSub = this.firebaseService.getAppointmentsByDoctor(uid).subscribe((appointments: AppointmentData[]) => {
        const today = new Date();
        const todays = appointments.filter(a => new Date(a.date).toDateString() === today.toDateString());
        // Map to UI model expected by template
        this.upcomingAppointments = todays.map(a => ({
          id: a.id!,
          patientName: a.patientName,
          time: a.time,
          type: a.appointmentType === 'video' ? 'Video' : 'Clinic',
          status: this.capitalize(a.status)
        }));
        this.todayAppointments = todays.length;
      });

      // Live revenue subscriptions
      const now = new Date();
      // Start of week (Mon) calculation
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay(); // 0=Sun, 1=Mon
      const diffToMonday = (day === 0 ? -6 : 1 - day); // move back to Monday
      startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfRange = new Date(now); // now

      this.statsWeekSub = this.firebaseService
        .getAppointmentStats(uid, startOfWeek, endOfRange)
        .subscribe(stats => {
          this.weeklyRevenue = stats.totalRevenue || 0;
        });

      this.statsMonthSub = this.firebaseService
        .getAppointmentStats(uid, startOfMonth, endOfRange)
        .subscribe(stats => {
          this.monthlyRevenue = stats.totalRevenue || 0;
        });
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.apptSub?.unsubscribe();
    this.statsWeekSub?.unsubscribe();
    this.statsMonthSub?.unsubscribe();
  }

getDoctorSpecialization(): string {
    if (this.doctorProfile) {
      const specialization = (this.doctorProfile as any)?.specialization || 'Specialization not set';
      const experience = (this.doctorProfile as any)?.experience ? `${(this.doctorProfile as any).experience} years experience` : '';
      return `${specialization} • ${experience}`;
    }
    return 'Specialization not available';
  }

  private getEffectiveVerificationStatus(): 'approved' | 'rejected' | 'under_review' | 'pending' {
    const anyUser: any = this.currentUser || {};
    const kyc: string | undefined = anyUser.kycStatus;
    if (kyc === 'approved' || kyc === 'rejected' || kyc === 'under_review' || kyc === 'pending') return kyc as any;
    // fallback to older field if present
    return (anyUser.verificationStatus as any) || 'pending';
  }

  isVerified(): boolean {
    return this.getEffectiveVerificationStatus() === 'approved';
  }

  getVerificationColor(): string {
    switch (this.getEffectiveVerificationStatus()) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'under_review': return 'warning';
      default: return 'medium';
    }
  }

  getVerificationIcon(): string {
    switch (this.getEffectiveVerificationStatus()) {
      case 'approved': return 'checkmark-circle-outline';
      case 'rejected': return 'warning-outline';
      case 'under_review': return 'time-outline';
      default: return 'warning-outline';
    }
  }

  getVerificationText(): string {
    switch (this.getEffectiveVerificationStatus()) {
      case 'approved': return 'Verified Doctor';
      case 'rejected': return 'Verification Rejected';
      case 'under_review': return 'Under Review';
      default: return 'Verification Pending';
    }
  }

  getAppointmentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'completed': return 'medium';
      default: return 'primary';
    }
  }

  viewNotifications() {
    // Navigate to notifications page
    console.log('View notifications');
  }

  viewAppointments() {
    this.router.navigate(['/doctor/bookings']);
  }

  manageSchedule() {
    this.router.navigate(['/doctor/schedule']);
  }

  viewPrescriptions() {
    this.router.navigate(['/doctor/prescriptions']);
  }

  viewAnalytics() {
    this.router.navigate(['/doctor/analytics']);
  }

  updateProfile() {
    this.router.navigate(['/doctor/profile']);
  }

  completeKYC() {
    this.router.navigate(['/doctor/kyc-verification']);
  }

  viewAllAppointments() {
    this.router.navigate(['/doctor/bookings']);
  }

  viewDetailedAnalytics() {
    this.router.navigate(['/doctor/analytics']);
  }

  async approveAppointment(appointmentId: string) {
    try {
      await this.appointmentService.approveAppointment(appointmentId);
    } catch (err) {
      console.error('Approve appointment failed', err);
    }
  }

  async rejectAppointment(appointmentId: string) {
    try {
      // Ask for a simple reason using browser prompt alternative could be added later; using default reason for now
      await this.appointmentService.rejectAppointment(appointmentId, 'Rejected by doctor');
    } catch (err) {
      console.error('Reject appointment failed', err);
    }
  }

  startVideoCall(appointmentId: string) {
    // Navigate to video consultation page
    this.router.navigate(['/video-consultation', appointmentId]);
  }

  async markPatientPresent(appointmentId: string) {
    try {
      await this.appointmentService.checkInAppointment(appointmentId);
      // Could show a toast notification here
    } catch (err) {
      console.error('Mark patient present failed', err);
    }
  }

  async showUserMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Account Options',
      buttons: [
        {
          text: 'Profile Settings',
          icon: 'person-outline',
          handler: () => {
            this.updateProfile();
          }
        },
        {
          text: 'Schedule Management',
          icon: 'time-outline',
          handler: () => {
            this.manageSchedule();
          }
        },
        {
          text: 'Analytics',
          icon: 'analytics-outline',
          handler: () => {
            this.viewAnalytics();
          }
        },
        {
          text: 'Logout',
          icon: 'log-out-outline',
          role: 'destructive',
          handler: () => {
            this.confirmLogout();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: async () => {
            try {
              await this.authService.signOut();
              this.router.navigate(['/auth/login']);
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
