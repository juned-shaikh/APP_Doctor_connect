import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-patients',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Manage Patients</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="patients-container">
        <ion-card>
          <ion-card-content>
            <div class="patients-info">
              <ion-icon name="people-outline" size="large" color="primary"></ion-icon>
              <h2>Patient Management</h2>
              <p>Manage patient accounts</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .patients-container {
      padding: 1rem;
    }
    .patients-info {
      text-align: center;
      padding: 2rem;
    }
    .patients-info h2 {
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
export class AdminPatientsPage implements OnInit {
  constructor() {
    addIcons({ peopleOutline });
  }

  ngOnInit() {}
}
