import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-verification',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Doctor Verification</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="verification-container">
        <ion-card>
          <ion-card-content>
            <div class="verification-info">
              <ion-icon name="checkmark-circle-outline" size="large" color="primary"></ion-icon>
              <h2>Doctor Verification</h2>
              <p>Review and approve doctor KYC documents</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .verification-container {
      padding: 1rem;
    }
    .verification-info {
      text-align: center;
      padding: 2rem;
    }
    .verification-info h2 {
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
export class AdminVerificationPage implements OnInit {
  constructor() {
    addIcons({ checkmarkCircleOutline });
  }

  ngOnInit() {}
}
