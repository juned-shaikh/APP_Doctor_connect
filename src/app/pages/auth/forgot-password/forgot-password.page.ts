import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon, IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <ion-content class="ion-padding">
      <div class="forgot-password-container">
        <div class="header-section">
          <div class="app-icon">🔑</div>
          <ion-text color="primary">
            <h1>Reset Password</h1>
            <p>Enter your email address and we'll send you a link to reset your password</p>
          </ion-text>
        </div>

        <ion-card class="forgot-password-card">
          <ion-card-header>
            <ion-card-title>Forgot Password</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              
              <ion-item>
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <ion-label position="stacked">Email Address</ion-label>
                <ion-input 
                  formControlName="email" 
                  placeholder="Enter your email address"
                  type="email"
                  [class.ion-invalid]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched">
                </ion-input>
              </ion-item>

              <ion-button 
                expand="block" 
                type="submit" 
                [disabled]="forgotPasswordForm.invalid || isLoading"
                class="reset-button">
                <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
                <span *ngIf="!isLoading">Send Reset Link</span>
              </ion-button>

              <!-- Back to login -->
              <div class="back-link">
                <ion-text>
                  <a (click)="goBack()" class="link">
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Back to Login
                  </a>
                </ion-text>
              </div>

            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .forgot-password-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 1rem;
    }
    .header-section {
      text-align: center;
      margin-bottom: 2rem;
    }
    .app-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .header-section h1 {
      font-size: 2rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
    }
    .header-section p {
      font-size: 1rem;
      margin: 0;
      opacity: 0.8;
      line-height: 1.4;
    }
    .forgot-password-card {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 12px;
    }
    .reset-button {
      margin-top: 2rem;
      --background: #4CAF50;
      --background-hover: #45a049;
      --color: white;
      font-weight: bold;
    }
    .back-link {
      text-align: center;
      margin-top: 1rem;
    }
    .link {
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .link:hover {
      text-decoration: underline;
    }
    ion-item {
      margin-bottom: 1rem;
    }
    .ion-invalid {
      --border-color: var(--ion-color-danger);
    }
  `],
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon, IonSpinner
  ],
  standalone: true
})
export class ForgotPasswordPage implements OnInit {
  forgotPasswordForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService
  ) {
    addIcons({ mailOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.get('email')?.markAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const email = this.forgotPasswordForm.get('email')?.value;
      
      // Call the auth service to send password reset email
      await this.authService.forgotPassword(email);
      
      this.showToast('Password reset link sent to your email! Please check your inbox.', 'success');
      this.router.navigate(['/auth/login']);

    } catch (error: any) {
      console.error('Password reset error:', error);
      this.showToast(error.message || 'Failed to send reset link. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
