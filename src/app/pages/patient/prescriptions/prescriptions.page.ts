import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-prescriptions',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>My Prescriptions</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="prescriptions-container">
        <ion-card>
          <ion-card-content>
            <div class="prescriptions-info">
              <ion-icon name="document-text-outline" size="large" color="primary"></ion-icon>
              <h2>My Prescriptions</h2>
              <p>View your medical prescriptions</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .prescriptions-container {
      padding: 1rem;
    }
    .prescriptions-info {
      text-align: center;
      padding: 2rem;
    }
    .prescriptions-info h2 {
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
export class PatientPrescriptionsPage implements OnInit {
  constructor() {
    addIcons({ documentTextOutline });
  }

  ngOnInit() {}
}
