import { Component, OnDestroy, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { analyticsOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../services/firebase.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-analytics',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/doctor/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Analytics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <div class="analytics-container">
        <ion-card>
          <ion-card-content>
            <div class="analytics-info">
              <ion-icon name="analytics-outline" size="large" color="primary"></ion-icon>
              <h2>Last 30 Days</h2>
              <p>Practice analytics and insights</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
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
                  <div class="kpi">
                    <h3>Revenue</h3>
                    <div class="value">₹{{ stats?.totalRevenue ?? 0 }}</div>
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
            <div *ngIf="isLoading" class="loading">
              <ion-spinner name="crescent"></ion-spinner>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .analytics-container {
      padding: 1rem;
    }
    .analytics-info {
      text-align: center;
      padding: 2rem;
    }
    .analytics-info h2 {
      margin: 1rem 0 0.5rem 0;
    }
    .kpi { text-align: center; padding: .5rem 0; }
    .kpi .value { font-size: 1.5rem; font-weight: 700; }
    .loading { display:flex; justify-content:center; padding: .5rem; }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonGrid, IonRow, IonCol, IonSpinner
  ],
  standalone: true
})
export class DoctorAnalyticsPage implements OnInit, OnDestroy {
  stats: any = null;
  isLoading = false;
  private sub?: Subscription;

  constructor(private firebaseService: FirebaseService, private authService: AuthService) {
    addIcons({ analyticsOutline });
  }

  ngOnInit() {
    const user = this.authService.getCurrentUser?.();
    const doctorId = user?.uid;
    if (!doctorId) return;
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.isLoading = true;
    this.sub = this.firebaseService.getAppointmentStats(doctorId, start, end).subscribe({
      next: s => { this.stats = s; this.isLoading = false; },
      error: _ => { this.isLoading = false; }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
