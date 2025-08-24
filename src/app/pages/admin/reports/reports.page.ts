import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-reports',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Reports</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="reports-container">
        <ion-card>
          <ion-card-content>
            <div class="reports-info">
              <ion-icon name="document-text-outline" size="large" color="primary"></ion-icon>
              <h2>System Reports</h2>
              <p>Generate and view system reports</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .reports-container {
      padding: 1rem;
    }
    .reports-info {
      text-align: center;
      padding: 2rem;
    }
    .reports-info h2 {
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
export class AdminReportsPage implements OnInit {
  constructor() {
    addIcons({ documentTextOutline });
  }

  ngOnInit() {}
}
