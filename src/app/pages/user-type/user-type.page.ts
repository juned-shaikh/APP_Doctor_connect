import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { medicalOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-user-type',
  template: `
    <ion-content class="ion-padding">
      <div class="user-type-container">
        <div class="header-section">
          <div class="app-icon">🏥</div>
          <ion-text color="primary">
            <h1 class="welcome-title">Welcome to MyDoctor Connect</h1>
            <p class="welcome-subtitle">Choose your role to get started</p>
          </ion-text>
        </div>
        
        <div class="cards-container">
          <ion-card class="user-type-card doctor-card" (click)="selectUserType('doctor')">
            <div class="card-icon">
              <ion-icon name="medical-outline" size="large"></ion-icon>
            </div>
            <ion-card-header>
              <ion-card-title>I'm a Doctor</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>Join as a healthcare professional</p>
              <ul>
                <li>Manage patient appointments</li>
                <li>Build your practice online</li>
              </ul>
            </ion-card-content>
          </ion-card>

          <ion-card class="user-type-card patient-card" (click)="selectUserType('patient')">
            <div class="card-icon">
              <ion-icon name="person-outline" size="large"></ion-icon>
            </div>
            <ion-card-header>
              <ion-card-title>I'm a Patient</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>Find and book healthcare services</p>
              <ul>
                <li>Search verified doctors</li>
                <li>Book appointments instantly</li>
              </ul>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .user-type-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%);
    }
    .header-section {
      text-align: center;
      margin-bottom: 3rem;
    }
    .app-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .welcome-title {
      font-size: 2rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
    }
    .welcome-subtitle {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.8;
    }
    .cards-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      max-width: 400px;
    }
    .user-type-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }
    .user-type-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .doctor-card {
      background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
      color: white;
    }
    .patient-card {
      background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%);
      color: white;
    }
    .card-icon {
      text-align: center;
      padding: 1rem 0;
      font-size: 3rem;
    }
    .card-icon ion-icon {
      color: rgba(255,255,255,0.9);
    }
    ion-card-header {
      text-align: center;
      padding-bottom: 0;
    }
    ion-card-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
    }
    ion-card-content {
      text-align: center;
      padding-top: 0;
    }
    ion-card-content p {
      font-size: 1rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    }
    ion-card-content ul {
      text-align: left;
      padding-left: 1rem;
      margin: 0;
    }
    ion-card-content li {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      opacity: 0.8;
    }
  `],
  imports: [IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText],
  standalone: true
})
export class UserTypePage {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ medicalOutline, personOutline });
  }

  selectUserType(type: 'doctor' | 'patient') {
    this.authService.setInitialUserType(type);
    this.router.navigate(['/auth/register'], { queryParams: { type } });
  }
}