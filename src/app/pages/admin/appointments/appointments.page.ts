import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-appointments',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Manage Appointments</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="appointments-container">
        <ion-card>
          <ion-card-content>
            <div class="appointments-info">
              <ion-icon name="calendar-outline" size="large" color="primary"></ion-icon>
              <h2>Appointment Management</h2>
              <p>Monitor and manage all appointments</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .appointments-container {
      padding: 1rem;
    }
    .appointments-info {
      text-align: center;
      padding: 2rem;
    }
    .appointments-info h2 {
      margin: 1rem 0 0.5rem 0;
    }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonBackButton, IonButtons
  ],
  standalone: true
})
export class AdminAppointmentsPage implements OnInit {
  constructor() {
    addIcons({ calendarOutline });
  }

  ngOnInit() {}
}
