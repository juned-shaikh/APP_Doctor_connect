import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonGrid,
  IonRow, IonCol, IonSearchbar, IonChip, IonLabel, IonAvatar, IonButtons,
  IonModal, IonSpinner,
  ActionSheetController, AlertController
} from '@ionic/angular/standalone';
import { AuthService, User } from '../../../services/auth.service';
import { FirebaseService, UserData } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  searchOutline, heartOutline, calendarOutline, peopleOutline, 
  medicalOutline, eyeOutline, personOutline, bodyOutline,
  womanOutline, pulseOutline, happyOutline, locationOutline, starOutline,
  ellipsisVerticalOutline, logOutOutline, settingsOutline, briefcaseOutline,
  pricetagOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

// Ensure dashboard doctors have a definite id
interface DashboardDoctor {
  id: string;
  name: string;
  specialization?: string;
  rating?: number;
  reviewCount?: number;
  consultationFee?: number;
  feeType?: 'clinic' | 'video';
  avatar?: string;
  isFeatured?: boolean;
  experience?: number;
  location?: string;
}

@Component({
  selector: 'app-patient-dashboard',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Doctor Connect</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="showUserMenu()">
            <ion-icon name="ellipsis-vertical-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true">
      <div class="dashboard-container">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <ion-text color="primary">
            <h2>
              Welcome back
            </h2>
            <p>Find the right doctor for your health needs</p>
          </ion-text>
        </div>

        <!-- Search Section -->
        <div class="search-section">
          <ion-searchbar 
            placeholder="Search doctors, specializations..."
            (ionInput)="onSearch($event)"
            class="custom-searchbar">
          </ion-searchbar>
        </div>

        <!-- Quick Actions (simplified) -->
        <!-- <div class="quick-actions">
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-card class="action-card" (click)="viewAppointments()">
                  <ion-card-content>
                    <ion-icon name="calendar-outline" color="success"></ion-icon>
                    <p>My Appointments</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6">
                <ion-card class="action-card" (click)="viewProfile()">
                  <ion-card-content>
                    <ion-icon name="person-outline" color="warning"></ion-icon>
                    <p>My Profile</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>-->

        <!-- Browse by Specialization -->
      <!--   <div class="specializations-section">
          <ion-text color="dark">
            <h3>Browse by Specialization</h3>
          </ion-text>
          <div class="specialization-chips">
            <ion-chip 
              (click)="selectSpecialization('all')"
              [outline]="selectedSpecialization !== 'all'"
              class="specialization-chip">
              <ion-icon name="medical-outline" color="primary"></ion-icon>
              <ion-label>All</ion-label>
            </ion-chip>
            <ion-chip 
              *ngFor="let spec of specializations" 
              (click)="selectSpecialization(spec.value)"
              [outline]="selectedSpecialization !== spec.value"
              class="specialization-chip">
              <ion-icon [name]="spec.icon" color="primary"></ion-icon>
              <ion-label>{{ spec.name }}</ion-label>
            </ion-chip>
          </div>
        </div>-->

        <!-- Doctors List (live, filtered, featured on top) -->
        <div class="featured-doctors">
          <div class="doctors-scroll">
            <ion-card 
              *ngFor="let doctor of visibleDoctors" 
              class="doctor-card"
             >
              <ion-card-content>
                <div class="doctor-card-row">
                  <div class="avatar-container">
                    <img 
                      *ngIf="doctor.avatar" 
                      [src]="doctor.avatar" 
                      [alt]="doctor.name"
                      class="avatar-image"
                      (error)="onImageError($event, doctor)">
                    <div 
                      *ngIf="!doctor.avatar" 
                      class="avatar-initials" 
                      [style.background]="getAvatarColor(doctor.name)">
                      {{ getInitials(doctor.name) }}
                    </div>
                  </div>
                  <div class="doctor-main">
                    <div class="doctor-title-line">
                      <div class="title-left">
                        <div class="name">{{ doctor.name }}</div>
                        <ion-chip class="pill" color="primary" [outline]="false" *ngIf="doctor.specialization">
                          <ion-label>{{ doctor.specialization }}</ion-label>
                        </ion-chip>
                        <ion-chip *ngIf="doctor.isFeatured" color="warning" size="small" class="featured-pill">Featured</ion-chip>
                      </div>
                      <div class="rating-badge" *ngIf="(doctor.rating || 0) > 0">
                        <ion-icon name="star" color="light"></ion-icon>
                        <span>{{ (doctor.rating || 0) | number:'1.1-1' }}</span>
                      </div>
                    </div>
                    <div style="display: flex; ">
                    <div class="sub-line">
                      <ion-icon name="location-outline"></ion-icon>
                      <span class="truncate">{{ getDoctorLocation(doctor) }}</span>
                    </div>
                  <!--  // <div class="sub-line">
                    //   <ion-icon name="briefcase-outline"></ion-icon>
                    //   <span>{{ getExperienceYears(doctor) }}</span>
                    // </div>-->
                    <div class="sub-line" style="margin-left: 10px;">
                      <ion-icon name="pricetag-outline"></ion-icon>
                      <span>{{ getConsultationFeeText(doctor) }}</span>
                    </div>
                    </div>
                    
                  </div>
                </div>
                <div class="card-actions">
                  <ion-button 
                    fill="solid" 
                    color="medium"
                    size="small"
                    (click)="openProfile(doctor.id); $event.stopPropagation()">
                    View Profile
                  </ion-button>
                  <ion-button 
                    fill="outline" 
                    size="small" 
                    (click)="bookAppointment(doctor.id); $event.stopPropagation()">
                    Book Appointment
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <!-- Profile Modal (mobile-friendly sheet) -->
        <ion-modal 
          [isOpen]="isProfileOpen" 
          (didDismiss)="onProfileDidDismiss()"
          [breakpoints]="[0.5, 0.9]"
          [initialBreakpoint]="0.9"
          backdropDismiss="true"
          cssClass="profile-sheet"
        >
          <ng-template>
            <ion-header>
              <ion-toolbar>
                <ion-title>Doctor Profile</ion-title>
                <ion-buttons slot="end">
                  <ion-button fill="clear" (click)="closeProfile()">
                    <ion-icon name="close-outline"></ion-icon>
                  </ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content class="profile-modal-content">
              <div *ngIf="isProfileLoading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Loading profile...</p>
              </div>

              <div *ngIf="!isProfileLoading && selectedDoctorProfile" class="profile-body">
                <div class="profile-top">
                  <div class="avatar-container lg">
                    <img 
                      *ngIf="selectedDoctorProfile?.avatar" 
                      [src]="selectedDoctorProfile?.avatar" 
                      [alt]="selectedDoctorProfile?.name || 'Doctor'"
                      class="avatar-image lg"
                      (error)="onProfileImageError($event)">
                    <div 
                      *ngIf="!selectedDoctorProfile?.avatar" 
                      class="avatar-initials lg" 
                      [style.background]="getAvatarColor(selectedDoctorProfile?.name || '')">
                      {{ getInitials(selectedDoctorProfile?.name || '') }}
                    </div>
                  </div>
                  <div class="title-block">
                    <h3 class="name">{{ selectedDoctorProfile?.name }}</h3>
                    <div class="meta-row" *ngIf="selectedDoctorProfile?.specialization">
                      <ion-icon name="medical-outline"></ion-icon>
                      <span>{{ selectedDoctorProfile?.specialization }}</span>
                    </div>
                    <div class="meta-row" *ngIf="selectedDoctorProfile?.experience">
                      <ion-icon name="briefcase-outline"></ion-icon>
                      <span>{{ selectedDoctorProfile?.experience }} year{{ (selectedDoctorProfile?.experience || 0) > 1 ? 's' : '' }} exp.</span>
                    </div>
                  </div>
                </div>

                <div class="section" *ngIf="selectedDoctorProfile?.bio">
                  <div class="section-title">About</div>
                  <div class="section-text">{{ selectedDoctorProfile?.bio }}</div>
                </div>

                <div class="section">
                  <div class="section-title">Clinic</div>
                  <div class="kv" *ngIf="selectedDoctorProfile.clinicDetails?.name">
                    <ion-icon name="business-outline"></ion-icon>
                    <div>
                      <div class="k">Name</div>
                      <div class="v">{{ selectedDoctorProfile?.clinicDetails?.name }}</div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="selectedDoctorProfile.clinicDetails?.address?.line">
                    <ion-icon name="home-outline"></ion-icon>
                    <div>
                      <div class="k">Address</div>
                      <div class="v">{{ selectedDoctorProfile?.clinicDetails?.address?.line }}</div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="selectedDoctorProfile?.clinicDetails?.address?.city || selectedDoctorProfile?.clinicDetails?.address?.state || selectedDoctorProfile?.clinicDetails?.address?.pincode">
                    <ion-icon name="location-outline"></ion-icon>
                    <div>
                      <div class="k">Location</div>
                      <div class="v">
                        {{ selectedDoctorProfile?.clinicDetails?.address?.city }}
                        <span *ngIf="selectedDoctorProfile?.clinicDetails?.address?.state">, {{ selectedDoctorProfile?.clinicDetails?.address?.state }}</span>
                        <span *ngIf="selectedDoctorProfile?.clinicDetails?.address?.pincode"> - {{ selectedDoctorProfile?.clinicDetails?.address?.pincode }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="selectedDoctorProfile?.clinicDetails?.mapsUrl">
                    <ion-icon name="map-outline"></ion-icon>
                    <div>
                      <div class="k">Map</div>
                      <div class="v"><a [href]="selectedDoctorProfile?.clinicDetails?.mapsUrl" target="_blank">Open in Maps</a></div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">Consultation</div>
                  <div class="kv" *ngIf="selectedDoctorProfile.consultation?.clinicEnabled && selectedDoctorProfile.consultation?.clinicFee !== undefined">
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <div>
                      <div class="k">Clinic Fee</div>
                      <div class="v">₹{{ selectedDoctorProfile.consultation?.clinicFee }}</div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="selectedDoctorProfile.consultation?.videoEnabled && selectedDoctorProfile.consultation?.videoFee !== undefined">
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <div>
                      <div class="k">Video Fee</div>
                      <div class="v">₹{{ selectedDoctorProfile.consultation?.videoFee }}</div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="!selectedDoctorProfile.consultation?.clinicEnabled && !selectedDoctorProfile.consultation?.videoEnabled && selectedDoctorProfile.consultationFee">
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <div>
                      <div class="k">Consultation Fee</div>
                      <div class="v">₹{{ selectedDoctorProfile.consultationFee }}</div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">Contact</div>
                  <div class="kv" *ngIf="selectedDoctorProfile.showPhone !== false && selectedDoctorProfile.phone">
                    <ion-icon name="call-outline"></ion-icon>
                    <div>
                      <div class="k">Phone</div>
                      <div class="v">{{ selectedDoctorProfile.phone }}</div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="selectedDoctorProfile.languages?.length">
                    <ion-icon name="chatbubbles-outline"></ion-icon>
                    <div>
                      <div class="k">Languages</div>
                      <div class="v">{{ selectedDoctorProfile.languages?.join(', ') }}</div>
                    </div>
                  </div>
                  <div class="kv" *ngIf="selectedDoctorProfile.regNumber">
                    <ion-icon name="barcode-outline"></ion-icon>
                    <div>
                      <div class="k">Reg. No</div>
                      <div class="v">{{ selectedDoctorProfile.regNumber }}</div>
                    </div>
                  </div>
                </div>

                <div class="cta">
                  <ion-button expand="block" size="large" (click)="onBookFromProfile(selectedDoctorProfile.id!)">Book Appointment</ion-button>
                </div>
              </div>
            </ion-content>
          </ng-template>
        </ion-modal>

        <!-- Recent Activity -->
        <div class="recent-activity" *ngIf="recentAppointments.length > 0">
          <ion-text color="dark">
            <h3>Recent Appointments</h3>
          </ion-text>
          <ion-card *ngFor="let appointment of recentAppointments" class="appointment-card">
            <ion-card-content>
              <div class="appointment-info">
                <div class="appointment-details">
                  <h4>{{ appointment.doctorName }}</h4>
                  <p>{{ appointment.specialization }}</p>
                  <p class="date">{{ appointment.date | date:'medium' }}</p>
                </div>
                <ion-chip [color]="getStatusColor(appointment.status)">
                  {{ appointment.status }}
                </ion-chip>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100%;
      padding: 0;
      margin: 0;
    }
    
    ion-content {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 16px;
      /* Leave space for fixed patient tabs (60px) + device safe area */
      --padding-bottom: calc(76px + var(--ion-safe-area-bottom, 0px));
      --background: #f5f5f5;
      --offset-top: 0px;
      --offset-bottom: 0px;
      --overflow: auto;
      --overflow-y: auto;
      --overflow-x: hidden;
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      contain: layout size style;
    }
    
    .dashboard-container {
      width: 100%;
      min-height: 100%;
      /* Keep a small bottom padding; main spacing handled by ion-content */
      padding-bottom: 16px;
    }
    .welcome-section {
      margin-bottom: 2rem;
      text-align: center;
    }
    .welcome-section h2 {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
    }
    .welcome-section p {
      opacity: 0.8;
      margin: 0;
    }
    .search-section {
      margin-bottom: 2rem;
    }
    .custom-searchbar {
      --background: #f8f9fa;
      --border-radius: 12px;
      --box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .quick-actions {
      margin-bottom: 2rem;
    }
    .quick-actions h3 {
      margin: 0 0 1rem 0;
      font-weight: bold;
    }
    .action-card {
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
      margin: 0.25rem;
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
    }
    .specializations-section {
      margin-bottom: 2rem;
    }
    .specializations-section h3 {
      margin: 0 0 1rem 0;
      font-weight: bold;
    }
    .specialization-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .specialization-chip {
      cursor: pointer;
      transition: transform 0.2s;
    }
    .specialization-chip:hover {
      transform: scale(1.05);
    }
    .featured-doctors {
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
    .doctors-scroll {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .doctor-card {
     width: 100%;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .doctor-card:hover {
      transform: translateY(-2px);
    }
    .doctor-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    /* New card layout */
    .doctor-card-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .avatar-container {
      width: 48px;
      height: 48px;
      min-width: 48px;
      position: relative;
    }
    .avatar-image {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .avatar-initials {
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .doctor-main {
      flex: 1;
    }
    .doctor-title-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      // margin-bottom: 6px;
    }
    .title-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .name {
      font-weight: 700;
      font-size: 1rem;
    }
    .pill {
      height: 22px;
      --padding-start: 8px;
      --padding-end: 8px;
      border-radius: 999px;
    }
    .featured-pill {
      height: 22px;
      --padding-start: 8px;
      --padding-end: 8px;
      border-radius: 999px;
    }
    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #20c997;
      color: #fff;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(32,201,151,0.35);
      font-size: 0.85rem;
    }
    .sub-line {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 0.9rem;
      margin-top: 2px;
    }
    .truncate {
      display: inline-block;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .doctor-details h4 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
    }
    .doctor-details p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }
    .specialization {
      color: var(--ion-color-primary);
      font-weight: 500;
    }
    .rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .rating span {
      font-size: 0.85rem;
      opacity: 0.8;
    }
    .fee {
      font-weight: bold;
      color: var(--ion-color-success);
    }
    .recent-activity {
      margin-bottom: 2rem;
    }
    .recent-activity h3 {
      margin: 0 0 1rem 0;
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
    .date {
      opacity: 0.7;
    }
    /* Modal styles */
    ion-modal.profile-sheet {
      --border-radius: 16px;
      --max-width: 640px;
      --width: 100%;
      --backdrop-opacity: 0.4;
    }
    .profile-modal-content {
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 24px;
    }
    .profile-body { padding-bottom: 16px; }
    .profile-top {
      display: flex;
      gap: 12px;
      align-items: center;
      margin: 8px 0 12px 0;
    }
    .avatar-container.lg {
      width: 56px;
      height: 56px;
      min-width: 56px;
    }
    .avatar-image.lg {
      width: 56px;
      height: 56px;
      border-radius: 14px;
    }
    .avatar-initials.lg {
      width: 56px;
      height: 56px;
      min-width: 56px;
      border-radius: 14px;
      font-size: 1.1rem;
    }
    .title-block .name { margin: 0 0 4px 0; font-weight: 700; }
    .meta-row { display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.95rem; }
    .section { background: #fff; border-radius: 12px; padding: 12px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .section-title { font-weight: 700; margin-bottom: 8px; }
    .section-text { color: #374151; line-height: 1.4; }
    .kv { display: flex; gap: 12px; padding: 8px 0; align-items: flex-start; }
    .kv ion-icon { color: #6b7280; font-size: 18px; margin-top: 2px; }
    .kv .k { color: #6b7280; font-size: 0.9rem; }
    .kv .v { color: #111827; }
    .cta { margin-top: 12px; }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonGrid,
    IonRow, IonCol, IonSearchbar, IonChip, IonLabel, IonAvatar, IonButtons,
    IonModal, IonSpinner
  ],
  standalone: true
})
export class PatientDashboardPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  
  specializations = [
    { name: 'General Medicine', value: 'general-medicine', icon: 'medical-outline' },
    { name: 'Cardiology', value: 'cardiology', icon: 'heart-outline' },
    { name: 'Dermatology', value: 'dermatology', icon: 'eye-outline' },
    { name: 'Pediatrics', value: 'pediatrics', icon: 'baby-outline' },
    { name: 'Orthopedics', value: 'orthopedics', icon: 'boneto-outline' },
    { name: 'Gynecology', value: 'gynecology', icon: 'woman-outline' },
    { name: 'Neurology', value: 'neurology', icon: 'brain-outline' },
    { name: 'Psychiatry', value: 'psychiatry', icon: 'happy-outline' }
  ];

  // Profile modal state
  isProfileOpen = false;
  isProfileLoading = false;
  selectedDoctorProfile: UserData | null = null;
  private profileSub?: Subscription;
  private doctorsSub?: Subscription;

  // Source and visible lists
  allDoctors: DashboardDoctor[] = [];
  visibleDoctors: DashboardDoctor[] = [];

  // UI filter state
  selectedSpecialization: string = 'all';

  recentAppointments = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      specialization: 'Cardiologist',
      date: new Date('2024-01-15T10:00:00'),
      status: 'Completed'
    },
    {
      id: '2',
      doctorName: 'Dr. Michael Chen',
      specialization: 'Dermatologist',
      date: new Date('2024-01-20T14:30:00'),
      status: 'Upcoming'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private firebaseService: FirebaseService
  ) {
    addIcons({ 
      searchOutline, calendarOutline, peopleOutline, personOutline,
      medicalOutline, heartOutline, eyeOutline, bodyOutline, pulseOutline,
      womanOutline, happyOutline, locationOutline, starOutline,
      ellipsisVerticalOutline, logOutOutline, settingsOutline, briefcaseOutline,
      pricetagOutline
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    // Load live registered doctors (active) for patient view
    this.doctorsSub = this.firebaseService.getUsersByRole('doctor').subscribe((doctors) => {
      // Map to enforce id and only needed fields
      const mapped = doctors
        .map(d => {
          const anyD: any = d as any;
          // Flags
          const clinicEnabled = !!(anyD.clinicVisit || anyD.consultation?.clinicEnabled || anyD.consultation?.clinic?.enabled);
          const videoEnabled = !!(anyD.videoConsultation || anyD.consultation?.videoEnabled || anyD.consultation?.video?.enabled);
          // Fees
          const clinicRaw = anyD.clinicFee ?? anyD.consultation?.clinicFee ?? anyD.consultation?.clinic?.fee;
          const videoRaw = anyD.videoFee ?? anyD.consultation?.videoFee ?? anyD.consultation?.video?.fee;
          const clinicNum = clinicRaw === undefined || clinicRaw === null || clinicRaw === '' ? NaN : Number(clinicRaw);
          const videoNum = videoRaw === undefined || videoRaw === null || videoRaw === '' ? NaN : Number(videoRaw);
          // Generic fallbacks
          const genericRaw = anyD.consultationFee ?? anyD.fee ?? anyD.consultation_price ?? anyD.consultationPrice;
          const genericNum = genericRaw === undefined || genericRaw === null || genericRaw === '' ? NaN : Number(genericRaw);
          // Prefer clinic fee when enabled, else video, else generic
          let fee: number | undefined;
          let feeType: 'clinic' | 'video' | undefined;
          if (clinicEnabled && !isNaN(clinicNum)) { fee = clinicNum; feeType = 'clinic'; }
          else if (videoEnabled && !isNaN(videoNum)) { fee = videoNum; feeType = 'video'; }
          else if (!isNaN(genericNum)) { fee = genericNum; }

          return {
            id: (d.id || d.uid),
            name: d.name,
            specialization: d.specialization,
            rating: d.rating,
            reviewCount: d.reviewCount,
            consultationFee: fee,
            feeType: feeType,
            avatar: d.avatar,
            // Admin can mark doctors as featured; stored as boolean field 'isFeatured'
            isFeatured: !!(anyD.isFeatured),
            experience: (anyD.experience),
            location: (anyD.clinicDetails?.address?.city) || (anyD.clinicAddress) || ''
          } as DashboardDoctor;
        });
      // Use mapped list directly; Firestore stream already returns only active doctors
      this.allDoctors = mapped;
      this.applyFilters();
    });
  }

  private applyFilters() {
    const spec = this.selectedSpecialization;
    const filtered = spec === 'all' 
      ? this.allDoctors
      : this.allDoctors.filter(d => (d.specialization || '').toLowerCase() === spec.toLowerCase());
    this.visibleDoctors = this.sortDoctors(filtered);
  }

  private sortDoctors(list: DashboardDoctor[]): DashboardDoctor[] {
    // Featured first, then higher rating, then name
    return [...list].sort((a, b) => {
      const fa = a.isFeatured ? 1 : 0;
      const fb = b.isFeatured ? 1 : 0;
      if (fb - fa !== 0) return fb - fa;
      const ra = a.rating || 0;
      const rb = b.rating || 0;
      if (rb - ra !== 0) return rb - ra;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  selectSpecialization(value: string) {
    this.selectedSpecialization = value;
    this.applyFilters();
  }

  // UI helpers for redesigned doctor card
  getInitials(name: string): string {
    if (!name) return 'DR';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]).join('').toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#6C63FF', '#FF6584', '#36B37E', '#00B8D9', '#FFAB00'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }

  getDoctorLocation(doctor: DashboardDoctor): string {
    return doctor.location || '—';
  }

  getExperienceYears(doctor: DashboardDoctor): string {
    const yrs = doctor.experience ?? 0;
    if (!yrs || yrs <= 0) return 'Experience not set';
    return `${yrs} year${yrs > 1 ? 's' : ''} exp.`;
  }

  getConsultationFeeText(doctor: DashboardDoctor): string {
    const fee: any = doctor.consultationFee;
    if (fee === undefined || fee === null || fee === '') return 'Fee not set';
    const num = Number(fee);
    if (isNaN(num)) return 'Fee not set';
    if (num <= 0) return 'Free consultation';
    return `₹${num}`;
  }

  onSearch(event: any) {
    const query = event.target.value;
    if (query && query.trim() !== '') {
      this.router.navigate(['/patient/search-doctors'], { 
        queryParams: { q: query } 
      });
    }
  }

  searchDoctors() {
    this.router.navigate(['/patient/search-doctors']);
  }

  viewAppointments() {
    this.router.navigate(['/patient/appointments']);
  }

  viewPrescriptions() {
    this.router.navigate(['/patient/prescriptions']);
  }

  viewProfile() {
    this.router.navigate(['/patient/profile']);
  }

  searchBySpecialization(specialization: string) {
    this.router.navigate(['/patient/search-doctors'], { 
      queryParams: { specialization } 
    });
  }

  viewAllDoctors() {
    this.router.navigate(['/patient/search-doctors']);
  }

  viewDoctorDetails(doctorId: string) {
    this.router.navigate(['/patient/doctor-details', doctorId]);
  }

  // Open profile modal and load doctor's full profile
  openProfile(doctorId: string) {
    this.isProfileOpen = true;
    this.isProfileLoading = true;
    this.selectedDoctorProfile = null;
    this.profileSub?.unsubscribe();
    this.profileSub = this.firebaseService.getUserById(doctorId).subscribe((doc) => {
      this.selectedDoctorProfile = doc;
      this.isProfileLoading = false;
    });
  }

  closeProfile() {
    this.isProfileOpen = false;
    this.isProfileLoading = false;
    this.profileSub?.unsubscribe();
    this.profileSub = undefined;
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
    this.doctorsSub?.unsubscribe();
  }

  // Handle booking from profile modal: close first, then navigate after dismiss
  pendingBookDoctorId?: string;

  onBookFromProfile(doctorId: string) {
    this.pendingBookDoctorId = doctorId;
    this.closeProfile();
  }

  onProfileDidDismiss() {
    if (this.pendingBookDoctorId) {
      const id = this.pendingBookDoctorId;
      this.pendingBookDoctorId = undefined;
      this.bookAppointment(id);
    }
  }

  bookAppointment(doctorId: string) {
    this.router.navigate(['/patient/book-appointment', doctorId]);
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'upcoming': return 'primary';
      case 'cancelled': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium';
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
            this.viewProfile();
          }
        },
        {
          text: 'App Settings',
          icon: 'settings-outline',
          handler: () => {
            this.router.navigate(['/patient/settings']);
          }
        },
        {
          text: 'Notification Test',
          icon: 'notifications-outline',
          handler: () => {
            this.router.navigate(['/patient/simple-notification-test']);
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

  // Handle image loading errors
  onImageError(event: any, doctor: DashboardDoctor) {
    // Hide the broken image and show initials instead
    doctor.avatar = undefined;
  }

  onProfileImageError(event: any) {
    // Hide the broken image in profile modal
    if (this.selectedDoctorProfile) {
      this.selectedDoctorProfile.avatar = undefined;
    }
  }

}
