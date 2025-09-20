import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption, IonAvatar, IonChip,
  IonGrid, IonRow, IonCol, IonSpinner, IonRefresher, IonRefresherContent,
  IonModal, IonList, IonToggle, IonBadge, IonNote,
  AlertController, ToastController, ActionSheetController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, createOutline, saveOutline, cameraOutline, callOutline,
  mailOutline, locationOutline, calendarOutline, medicalOutline,
  heartOutline, statsChartOutline, documentTextOutline, settingsOutline,
  logOutOutline, shieldCheckmarkOutline, timeOutline, checkmarkCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, UserData, AppointmentData } from '../../../services/firebase.service';

@Component({
  selector: 'app-patient-profile',
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goToDashboard()">
            <ion-icon name="arrow-back-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>My Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="toggleEditMode()">
            <ion-icon [name]="isEditing ? 'save-outline' : 'create-outline'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="refreshProfile($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Loading profile...</p>
      </div>

      <!-- Profile Content -->
      <div *ngIf="!isLoading" class="profile-container">
        
        <!-- Profile Header Card -->
        <ion-card class="profile-header-card">
          <ion-card-content>
            <div class="profile-header">
             
              
              <div class="profile-info">
                <h1 *ngIf="!isEditing">{{ patientData?.name || 'Patient' }}</h1>
                <ion-input 
                  *ngIf="isEditing" 
                  [(ngModel)]="editData.name" 
                  placeholder="Full Name"
                  class="edit-name-input">
                </ion-input>
                
                <div class="profile-meta">
                  <ion-chip color="primary">
                    <ion-icon name="person-outline"></ion-icon>
                    <ion-label>Patient</ion-label>
                  </ion-chip>
                  <ion-chip *ngIf="patientData?.isActive" color="success">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <ion-label>Active</ion-label>
                  </ion-chip>
                </div>
                
                <div class="quick-stats">
                  <div class="stat-item">
                    <span class="stat-number">{{ appointmentStats.total }}</span>
                    <span class="stat-label">Appointments</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ appointmentStats.completed }}</span>
                    <span class="stat-label">Completed</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ prescriptionCount }}</span>
                    <span class="stat-label">Prescriptions</span>
                  </div>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Personal Information Card -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Personal Information</h2>
              <ion-icon name="person-outline" color="primary"></ion-icon>
            </div>
            
            <ion-list lines="none">
              <ion-item>
                <ion-icon name="call-outline" slot="start" color="primary"></ion-icon>
                <ion-label position="stacked">Phone Number</ion-label>
                <ion-input 
                  *ngIf="!isEditing" 
                  [value]="patientData?.phone" 
                  readonly>
                </ion-input>
                <ion-input 
                  *ngIf="isEditing" 
                  [(ngModel)]="editData.phone" 
                  type="tel"
                  placeholder="Phone Number">
                </ion-input>
              </ion-item>

              <ion-item>
                <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
                <ion-label position="stacked">Email Address</ion-label>
                <ion-input 
                  *ngIf="!isEditing" 
                  [value]="patientData?.email" 
                  readonly>
                </ion-input>
                <ion-input 
                  *ngIf="isEditing" 
                  [(ngModel)]="editData.email" 
                  type="email"
                  placeholder="Email Address">
                </ion-input>
              </ion-item>

              <ion-item>
                <ion-icon name="calendar-outline" slot="start" color="primary"></ion-icon>
                <ion-label position="stacked">Age</ion-label>
                <ion-input 
                  *ngIf="!isEditing" 
                  [value]="patientData?.age || 'Not specified'" 
                  readonly>
                </ion-input>
                <ion-input 
                  *ngIf="isEditing" 
                  [(ngModel)]="editData.age" 
                  type="number"
                  placeholder="Age">
                </ion-input>
              </ion-item>

              <ion-item>
                <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
                <ion-label position="stacked">Gender</ion-label>
                <ion-input 
                  *ngIf="!isEditing" 
                  [value]="patientData?.gender || 'Not specified'" 
                  readonly>
                </ion-input>
                <ion-select 
                  *ngIf="isEditing" 
                  [(ngModel)]="editData.gender" 
                  placeholder="Select Gender">
                  <ion-select-option value="male">Male</ion-select-option>
                  <ion-select-option value="female">Female</ion-select-option>
                  <ion-select-option value="other">Other</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-icon name="heart-outline" slot="start" color="primary"></ion-icon>
                <ion-label position="stacked">Blood Group</ion-label>
                <ion-input 
                  *ngIf="!isEditing" 
                  [value]="patientData?.bloodGroup || 'Not specified'" 
                  readonly>
                </ion-input>
                <ion-select 
                  *ngIf="isEditing" 
                  [(ngModel)]="editData.bloodGroup" 
                  placeholder="Select Blood Group">
                  <ion-select-option value="A+">A+</ion-select-option>
                  <ion-select-option value="A-">A-</ion-select-option>
                  <ion-select-option value="B+">B+</ion-select-option>
                  <ion-select-option value="B-">B-</ion-select-option>
                  <ion-select-option value="AB+">AB+</ion-select-option>
                  <ion-select-option value="AB-">AB-</ion-select-option>
                  <ion-select-option value="O+">O+</ion-select-option>
                  <ion-select-option value="O-">O-</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Medical History Card -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Medical History</h2>
              <ion-icon name="medical-outline" color="primary"></ion-icon>
            </div>
            
            <ion-item>
              <ion-label position="stacked">Medical Conditions & Allergies</ion-label>
              <ion-textarea 
                *ngIf="!isEditing"
                [value]="getMedicalHistoryText()" 
                readonly
                rows="3">
              </ion-textarea>
              <ion-textarea 
                *ngIf="isEditing"
                [(ngModel)]="editData.medicalHistoryText" 
                placeholder="Enter medical conditions, allergies, medications, etc."
                rows="4">
              </ion-textarea>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Health Statistics Card -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Health Statistics</h2>
              <ion-icon name="stats-chart-outline" color="primary"></ion-icon>
            </div>
            
            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <div class="health-stat">
                    <div class="stat-value">{{ appointmentStats.total }}</div>
                    <div class="stat-label">Total Visits</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="health-stat">
                    <div class="stat-value">{{ appointmentStats.completed }}</div>
                    <div class="stat-label">Completed</div>
                  </div>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="6">
                  <div class="health-stat">
                    <div class="stat-value">{{ prescriptionCount }}</div>
                    <div class="stat-label">Prescriptions</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="health-stat">
                    <div class="stat-value">{{ getLastVisitText() }}</div>
                    <div class="stat-label">Last Visit</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Recent Activity Card -->
        <ion-card *ngIf="recentAppointments.length > 0">
          <ion-card-content>
            <div class="card-header">
              <h2>Recent Appointments</h2>
              <ion-icon name="time-outline" color="primary"></ion-icon>
            </div>
            
            <div class="recent-appointments">
              <div *ngFor="let appointment of recentAppointments.slice(0, 3)" class="appointment-item">
                <div class="appointment-info">
                  <h4>{{ appointment.doctorName }}</h4>
                  <p>{{ formatDate(appointment.date) }}</p>
                </div>
                <ion-chip [color]="getStatusColor(appointment.status)">
                  <ion-label>{{ appointment.status }}</ion-label>
                </ion-chip>
              </div>
            </div>
            
            <ion-button  expand="block" (click)="viewAllAppointments()">
              View All Appointments
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Account Settings Card -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Account Settings</h2>
              <ion-icon name="settings-outline" color="primary"></ion-icon>
            </div>
            
            <ion-list lines="none">
              <ion-item button (click)="changePassword()">
                <ion-icon name="shield-checkmark-outline" slot="start" color="primary"></ion-icon>
                <ion-label>Change Password</ion-label>
              </ion-item>
              
              <ion-item button (click)="viewPrescriptions()">
                <ion-icon name="document-text-outline" slot="start" color="primary"></ion-icon>
                <ion-label>My Prescriptions</ion-label>
                <ion-badge slot="end" color="primary">{{ prescriptionCount }}</ion-badge>
              </ion-item>
              
              <ion-item button (click)="logout()">
                <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
                <ion-label color="danger">Logout</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Account Info Card -->
        <ion-card class="account-info-card">
          <ion-card-content>
            <div class="account-info">
              <p><strong>Member Since:</strong> {{ formatDate(patientData?.createdAt) }}</p>
              <p><strong>Last Updated:</strong> {{ formatDate(patientData?.updatedAt) }}</p>
              <p><strong>Patient ID:</strong> {{ patientData?.uid?.substring(0, 8) }}...</p>
            </div>
          </ion-card-content>
        </ion-card>
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
    
    .profile-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .loading-container {
      text-align: center;
      padding: 3rem 1rem;
    }
    
    .loading-container p {
      margin-top: 1rem;
      opacity: 0.7;
    }
    
    .profile-header-card {
      margin-bottom: 1rem;
      background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(32, 201, 151, 0.1));
    }
    
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .avatar-section {
      position: relative;
    }
    
    .profile-avatar {
      width: 80px;
      height: 80px;
      border: 3px solid var(--ion-color-primary);
    }
    
    .camera-btn {
      position: absolute;
      bottom: -5px;
      right: -5px;
      --background: var(--ion-color-primary);
      --color: white;
      --border-radius: 50%;
      width: 32px;
      height: 32px;
    }
    
    .profile-info {
      flex: 1;
    }
    
    .profile-info h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .edit-name-input {
      --background: white;
      --border-radius: 8px;
      --padding-start: 12px;
      --padding-end: 12px;
      border: 1px solid var(--ion-color-light);
      margin-bottom: 0.5rem;
    }
    
    .profile-meta {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    
    .quick-stats {
      display: flex;
      gap: 1rem;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-number {
      display: block;
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--ion-color-primary);
    }
    
    .stat-label {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .card-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .health-stat {
      text-align: center;
      padding: 1rem;
      background: rgba(40, 167, 69, 0.1);
      border-radius: 8px;
    }
    
    .health-stat .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--ion-color-primary);
      display: block;
    }
    
    .health-stat .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 0.25rem;
    }
    
    .recent-appointments {
      margin-bottom: 1rem;
    }
    
    .appointment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--ion-color-light);
    }
    
    .appointment-item:last-child {
      border-bottom: none;
    }
    
    .appointment-info h4 {
      margin: 0 0 0.25rem 0;
      font-weight: 600;
    }
    
    .appointment-info p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    
    .account-info-card {
      margin-top: 1rem;
      background: rgba(0, 0, 0, 0.02);
    }
    
    .account-info p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    @media (max-width: 768px) {
      .profile-container {
        padding: 0.5rem;
      }
      
      .profile-header {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }
      
      .quick-stats {
        justify-content: center;
      }
      
      .stat-item {
        min-width: 60px;
      }
    }
    
    @media (max-width: 480px) {
      .profile-avatar {
        width: 60px;
        height: 60px;
      }
      
      .profile-info h1 {
        font-size: 1.3rem;
      }
      
      .quick-stats {
        gap: 0.5rem;
      }
      
      .stat-number {
        font-size: 1rem;
      }
      
      .stat-label {
        font-size: 0.7rem;
      }
    }
  `],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption, IonAvatar, IonChip,
    IonGrid, IonRow, IonCol, IonSpinner, IonRefresher, IonRefresherContent,
    IonModal, IonList, IonToggle, IonBadge, IonNote
  ],
  standalone: true
})
export class PatientProfilePage implements OnInit, OnDestroy {
  patientData: UserData | null = null;
  recentAppointments: AppointmentData[] = [];
  prescriptionCount = 0;
  appointmentStats = {
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  };

  isLoading = true;
  isEditing = false;

  editData: any = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router,
    private platform: Platform,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController
  ) {
    addIcons({
      personOutline, createOutline, saveOutline, cameraOutline, callOutline,
      mailOutline, locationOutline, calendarOutline, medicalOutline,
      heartOutline, statsChartOutline, documentTextOutline, settingsOutline,
      logOutOutline, shieldCheckmarkOutline, timeOutline, checkmarkCircleOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    this.loadPatientProfile();
    this.setupBackButtonHandler();
  }

  private setupBackButtonHandler() {
    // Handle hardware back button on mobile devices
    this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
      // Prevent default back button behavior
      processNextHandler();
      // Navigate to dashboard
      this.goToDashboard();
    });
  }

  goToDashboard() {
    this.router.navigate(['/patient/dashboard'], { replaceUrl: true });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadPatientProfile() {
    this.isLoading = true;

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Load patient data
      const userSub = this.firebaseService.getUserById(currentUser.uid).subscribe({
        next: (userData) => {
          this.patientData = userData;
          this.initializeEditData();
        },
        error: (error) => {
          console.error('Error loading patient data:', error);
          this.showToast('Failed to load profile data', 'danger');
        }
      });
      this.subscriptions.push(userSub);

      // Load appointments
      const appointmentsSub = this.firebaseService.getAppointmentsByPatient(currentUser.uid).subscribe({
        next: (appointments) => {
          this.recentAppointments = appointments;
          this.calculateAppointmentStats(appointments);
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
        }
      });
      this.subscriptions.push(appointmentsSub);

      // Load prescriptions
      const prescriptionsSub = this.firebaseService.getPrescriptionsByPatient(currentUser.uid).subscribe({
        next: (prescriptions) => {
          this.prescriptionCount = prescriptions.length;
        },
        error: (error) => {
          console.error('Error loading prescriptions:', error);
        }
      });
      this.subscriptions.push(prescriptionsSub);

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading patient profile:', error);
      this.showToast('Failed to load profile', 'danger');
      this.isLoading = false;
    }
  }

  initializeEditData() {
    if (this.patientData) {
      this.editData = {
        name: this.patientData.name || '',
        phone: this.patientData.phone || '',
        email: this.patientData.email || '',
        age: this.patientData.age || '',
        gender: this.patientData.gender || '',
        bloodGroup: this.patientData.bloodGroup || '',
        medicalHistoryText: this.getMedicalHistoryText()
      };
    }
  }

  calculateAppointmentStats(appointments: AppointmentData[]) {
    this.appointmentStats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length
    };
  }

  getMedicalHistoryText(): string {
    if (!this.patientData?.medicalHistory || this.patientData.medicalHistory.length === 0) {
      return 'No medical history recorded';
    }
    return this.patientData.medicalHistory.join(', ');
  }

  getLastVisitText(): string {
    const completedAppointments = this.recentAppointments.filter(a => a.status === 'completed');
    if (completedAppointments.length === 0) {
      return 'None';
    }

    const lastVisit = completedAppointments.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const daysDiff = Math.floor((new Date().getTime() - new Date(lastVisit.date).getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return '1 day ago';
    if (daysDiff < 30) return `${daysDiff} days ago`;
    if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
    return `${Math.floor(daysDiff / 365)} years ago`;
  }

  async toggleEditMode() {
    if (this.isEditing) {
      await this.saveProfile();
    } else {
      this.isEditing = true;
      this.initializeEditData();
    }
  }

  async saveProfile() {
    const loading = await this.loadingController.create({
      message: 'Saving profile...'
    });
    await loading.present();

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Prepare medical history array
      const medicalHistory = this.editData.medicalHistoryText
        ? this.editData.medicalHistoryText.split(',').map((item: string) => item.trim()).filter((item: string) => item)
        : [];

      const updateData: Partial<UserData> = {
        name: this.editData.name || '',
        phone: this.editData.phone || '',
        email: this.editData.email || '',
        age: this.editData.age ? Number(this.editData.age) : undefined,
        gender: this.editData.gender || '',
        bloodGroup: this.editData.bloodGroup || '',
        medicalHistory: medicalHistory,
        updatedAt: new Date()
      };

      console.log('Updating profile with data:', updateData);
      
      await this.firebaseService.updateUserProfile(currentUser.uid, updateData);
      
      // Refresh the patient data
      await this.loadPatientProfile();
      
      this.isEditing = false;
      await this.showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      await this.showToast('Failed to save profile: ' + (error as Error).message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: 'Change Password',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Current Password',
          attributes: {
            required: true
          }
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'New Password',
          attributes: {
            minLength: 6,
            required: true
          }
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirm New Password',
          attributes: {
            minLength: 6,
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: async (data) => {
            if (data.newPassword !== data.confirmPassword) {
              await this.showToast('New passwords do not match', 'warning');
              return false;
            }

            if (data.newPassword.length < 6) {
              await this.showToast('Password must be at least 6 characters long', 'warning');
              return false;
            }

            const loading = await this.loadingController.create({
              message: 'Updating password...',
            });
            await loading.present();

            try {
              const currentUser = this.authService.getCurrentUser();
              if (!currentUser?.email) {
                throw new Error('User not authenticated');
              }

              // Re-authenticate user
              const isAuthenticated = await this.authService.reauthenticateUser(
                currentUser.email,
                data.currentPassword
              );

              if (!isAuthenticated) {
                throw new Error('Current password is incorrect');
              }

              // Update password
              await this.authService.updatePassword(data.newPassword);
              await this.showToast('Password updated successfully', 'success');
              return true;
            } catch (error) {
              console.error('Error changing password:', error);
              const errorMessage = (error as Error).message || 'Failed to update password';
              await this.showToast(errorMessage, 'danger');
              return false;
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }
  
  // Show toast notification
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async changeAvatar() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Change Profile Picture',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          handler: () => {
            this.showToast('Camera feature coming soon', 'success');
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'image-outline',
          handler: () => {
            this.showToast('Gallery feature coming soon', 'success');
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

  async refreshProfile(event: any) {
    await this.loadPatientProfile();
    event.target.complete();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'confirmed': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  viewAllAppointments() {
    this.router.navigate(['/patient/appointments']);
  }

  viewPrescriptions() {
    this.router.navigate(['/patient/prescriptions']);
  }

  async logout() {
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
              console.error('Error logging out:', error);
              await this.showToast('Failed to logout', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
