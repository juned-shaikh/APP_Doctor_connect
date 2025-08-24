import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-payments',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Manage Payments</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="payments-container">
        <ion-card>
          <ion-card-content>
            <div class="payments-info">
              <ion-icon name="card-outline" size="large" color="primary"></ion-icon>
              <h2>Payment Management</h2>
              <p>Monitor payment transactions</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .payments-container {
      padding: 1rem;
    }
    .payments-info {
      text-align: center;
      padding: 2rem;
    }
    .payments-info h2 {
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
export class AdminPaymentsPage implements OnInit {
  constructor() {
    addIcons({ cardOutline });
  }

  ngOnInit() {}
}
