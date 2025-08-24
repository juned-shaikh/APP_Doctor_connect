import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-settings',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Settings</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="settings-container">
        <ion-card>
          <ion-card-content>
            <div class="settings-info">
              <ion-icon name="settings-outline" size="large" color="primary"></ion-icon>
              <h2>System Settings</h2>
              <p>Configure system settings and preferences</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .settings-container {
      padding: 1rem;
    }
    .settings-info {
      text-align: center;
      padding: 2rem;
    }
    .settings-info h2 {
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
export class AdminSettingsPage implements OnInit {
  constructor() {
    addIcons({ settingsOutline });
  }

  ngOnInit() {}
}
