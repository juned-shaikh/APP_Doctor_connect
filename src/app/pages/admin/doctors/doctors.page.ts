import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-doctors',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Manage Doctors</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="doctors-container">
        <ion-card>
          <ion-card-content>
            <div class="doctors-info">
              <ion-icon name="people-outline" size="large" color="primary"></ion-icon>
              <h2>Doctor Management</h2>
              <p>Manage doctor accounts and verification</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .doctors-container {
      padding: 1rem;
    }
    .doctors-info {
      text-align: center;
      padding: 2rem;
    }
    .doctors-info h2 {
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
export class AdminDoctorsPage implements OnInit {
  constructor() {
    addIcons({ peopleOutline });
  }

  ngOnInit() {}
}
