import { Component, OnDestroy, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { analyticsOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../../services/firebase.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-analytics',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button (click)="goBack()"></ion-back-button>
        </ion-buttons>
        <ion-title>Analytics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="analytics-container">
        <!-- Period Filter -->
        <div class="period-filter">
          <ion-segment 
            [(ngModel)]="selectedPeriod" 
            (ionChange)="onPeriodChange($event)"
            class="period-segment">
            <ion-segment-button value="week">
              <ion-label>This Week</ion-label>
            </ion-segment-button>
            <ion-segment-button value="month">
              <ion-label>This Month</ion-label>
            </ion-segment-button>
            <ion-segment-button value="year">
              <ion-label>This Year</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <ion-card>
          <ion-card-content>
            <div class="analytics-info">
              <ion-icon name="analytics-outline" size="large" color="primary"></ion-icon>
              <h2>{{ getPeriodTitle() }}</h2>
              <p>Practice analytics and insights</p>
            </div>
          </ion-card-content>
        </ion-card>

        <div *ngIf="isLoading" class="loading">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Loading analytics...</p>
        </div>

        <div *ngIf="!isLoading">
          <ion-card>
            <ion-card-content class="stats-grid">
              <ion-grid>
                <ion-row>
                  <ion-col size="6">
                    <div class="kpi">
                      <h3>Completed</h3>
                      <div class="value">{{ stats?.completedAppointments ?? 0 }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="kpi">
                      <h3>Pending</h3>
                      <div class="value">{{ stats?.pendingAppointments ?? 0 }}</div>
                    </div>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="6">
                    <div class="kpi">
                      <h3>Cancelled</h3>
                      <div class="value">{{ stats?.cancelledAppointments ?? 0 }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="kpi revenue">
                      <h3>Revenue</h3>
                      <div class="value">₹{{ stats?.totalRevenue ?? 0 | number:'1.0-0' }}</div>
                    </div>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="6">
                    <div class="kpi">
                      <h3>Video</h3>
                      <div class="value">{{ stats?.videoConsultations ?? 0 }}</div>
                    </div>
                  </ion-col>
                  <ion-col size="6">
                    <div class="kpi">
                      <h3>Clinic</h3>
                      <div class="value">{{ stats?.clinicVisits ?? 0 }}</div>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .analytics-container {
      padding: 0.5rem;
      padding-bottom: 2rem;
    }
    .period-filter {
      margin: 0.5rem 0 1rem 0;
      padding: 0 0.5rem;
    }
    .period-segment {
      --background: var(--ion-color-light);
      --color-checked: var(--ion-color-primary-contrast);
      --background-checked: var(--ion-color-primary);
      border-radius: 8px;
    }
    .analytics-info {
      text-align: center;
      padding: 1.5rem 1rem;
    }
    .analytics-info ion-icon {
      margin-bottom: 0.5rem;
    }
    .analytics-info h2 {
      margin: 0.5rem 0 0.25rem 0;
      font-size: 1.3rem;
      font-weight: 600;
    }
    .analytics-info p {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }
    .stats-grid {
      padding: 0;
    }
    .kpi { 
      text-align: center; 
      padding: 1rem 0.5rem;
      border-radius: 8px;
      background: var(--ion-color-light);
      margin: 0.25rem;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .kpi h3 { 
      margin: 0 0 0.5rem 0;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi .value { 
      font-size: 1.8rem; 
      font-weight: 700;
      color: var(--ion-color-primary);
      margin: 0;
      line-height: 1.2;
    }
    .kpi.revenue .value {
      color: var(--ion-color-success);
      font-size: 1.6rem;
    }
    .loading { 
      display: flex; 
      justify-content: center; 
      padding: 2rem;
      flex-direction: column;
      align-items: center;
    }
    .loading p {
      margin-top: 1rem;
      color: var(--ion-color-medium);
    }
    ion-card {
      margin: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    ion-card-content {
      padding: 1rem;
    }
  `],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonSpinner,
    IonSegment, IonSegmentButton, IonLabel
  ],
  standalone: true
})
export class DoctorAnalyticsPage implements OnInit, OnDestroy {
  stats: any = null;
  isLoading = false;
  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  private sub?: Subscription;

  constructor(
    private firebaseService: FirebaseService, 
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ analyticsOutline });
  }

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    const user = this.authService.getCurrentUser?.();
    const doctorId = user?.uid;
    if (!doctorId) return;
    
    const { start, end } = this.getDateRange();
    this.isLoading = true;
    
    this.sub?.unsubscribe(); // Unsubscribe from previous subscription
    this.sub = this.firebaseService.getAppointmentStats(doctorId, start, end).subscribe({
      next: s => { 
        this.stats = s; 
        this.isLoading = false; 
      },
      error: _ => { 
        this.isLoading = false; 
      }
    });
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadAnalytics();
  }

  getDateRange(): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date();
    let start: Date;

    switch (this.selectedPeriod) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  }

  getPeriodTitle(): string {
    switch (this.selectedPeriod) {
      case 'week':
        return 'Last 7 Days';
      case 'year':
        return 'This Year';
      default:
        return 'This Month';
    }
  }

  goBack() {
    this.router.navigate(['/doctor/dashboard']);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
