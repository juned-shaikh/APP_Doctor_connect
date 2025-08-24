import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon, IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService, UserRegistration } from '../../../services/auth.service';
import { addIcons } from 'ionicons';
import { keypadOutline, timeOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  template: `
    <ion-content class="ion-padding">
      <div class="otp-container">
        <div class="header-section">
          <div class="app-icon">📱</div>
          <ion-text color="primary">
            <h1>Verify OTP</h1>
            <p>Enter the 6-digit code sent to</p>
            <p class="phone-number">{{ phoneNumber }}</p>
          </ion-text>
        </div>

        <ion-card class="otp-card">
          <ion-card-header>
            <ion-card-title>Enter Verification Code</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <form [formGroup]="otpForm" (ngSubmit)="onSubmit()">
              
              <div class="otp-input-container">
                <ion-input 
                  #otp1
                  formControlName="digit1"
                  type="number"
                  maxlength="1"
                  class="otp-input"
                  (ionInput)="onOtpInput($event, 1)"
                  (keydown)="onKeyDown($event, 1)">
                </ion-input>
                <ion-input 
                  #otp2
                  formControlName="digit2"
                  type="number"
                  maxlength="1"
                  class="otp-input"
                  (ionInput)="onOtpInput($event, 2)"
                  (keydown)="onKeyDown($event, 2)">
                </ion-input>
                <ion-input 
                  #otp3
                  formControlName="digit3"
                  type="number"
                  maxlength="1"
                  class="otp-input"
                  (ionInput)="onOtpInput($event, 3)"
                  (keydown)="onKeyDown($event, 3)">
                </ion-input>
                <ion-input 
                  #otp4
                  formControlName="digit4"
                  type="number"
                  maxlength="1"
                  class="otp-input"
                  (ionInput)="onOtpInput($event, 4)"
                  (keydown)="onKeyDown($event, 4)">
                </ion-input>
                <ion-input 
                  #otp5
                  formControlName="digit5"
                  type="number"
                  maxlength="1"
                  class="otp-input"
                  (ionInput)="onOtpInput($event, 5)"
                  (keydown)="onKeyDown($event, 5)">
                </ion-input>
                <ion-input 
                  #otp6
                  formControlName="digit6"
                  type="number"
                  maxlength="1"
                  class="otp-input"
                  (ionInput)="onOtpInput($event, 6)"
                  (keydown)="onKeyDown($event, 6)">
                </ion-input>
              </div>

              <ion-button 
                expand="block" 
                type="submit" 
                [disabled]="otpForm.invalid || isLoading"
                class="verify-button">
                <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
                <span *ngIf="!isLoading">Verify OTP</span>
              </ion-button>

              <!-- Resend OTP -->
              <div class="resend-section">
                <ion-text *ngIf="countdown > 0">
                  <p>Resend OTP in {{ countdown }} seconds</p>
                </ion-text>
                <ion-button 
                  *ngIf="countdown === 0"
                  fill="clear" 
                  (click)="resendOTP()"
                  [disabled]="isResending">
                  <ion-spinner *ngIf="isResending" name="crescent" size="small"></ion-spinner>
                  <span *ngIf="!isResending">Resend OTP</span>
                </ion-button>
              </div>

              <!-- Back to login -->
              <div class="back-link">
                <ion-text>
                  <a (click)="goBack()" class="link">← Back to Login</a>
                </ion-text>
              </div>

            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .otp-container {
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
      margin: 0.25rem 0;
      opacity: 0.8;
    }
    .phone-number {
      font-weight: bold;
      color: var(--ion-color-primary);
    }
    .otp-card {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 12px;
    }
    .otp-input-container {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin: 2rem 0;
    }
    .otp-input {
      width: 50px;
      height: 50px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      border: 2px solid var(--ion-color-light);
      border-radius: 8px;
      --padding: 0;
    }
    .otp-input.ion-focused {
      border-color: var(--ion-color-primary);
    }
    .verify-button {
      margin-top: 1rem;
      --background: #4CAF50;
      --background-hover: #45a049;
      --color: white;
      font-weight: bold;
    }
    .resend-section {
      text-align: center;
      margin-top: 1rem;
    }
    .resend-section p {
      margin: 0.5rem 0;
      opacity: 0.7;
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
    }
    .link:hover {
      text-decoration: underline;
    }
  `],
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon, IonSpinner
  ],
  standalone: true
})
export class VerifyOtpPage implements OnInit {
  otpForm!: FormGroup;
  verificationId = '';
  phoneNumber = '';
  userData: UserRegistration | null = null;
  isLogin = false;
  isLoading = false;
  isResending = false;
  countdown = 60;
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {
    addIcons({ keypadOutline, timeOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.verificationId = params['verificationId'] || '';
      this.phoneNumber = params['phone'] || '';
      this.isLogin = params['isLogin'] === 'true';
      
      if (params['userData']) {
        try {
          this.userData = JSON.parse(params['userData']);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    });

    this.initializeForm();
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  initializeForm() {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
    });
  }

  onOtpInput(event: any, position: number) {
    const value = event.target.value;
    
    if (value && position < 6) {
      // Move to next input
      const nextInput = document.querySelector(`ion-input:nth-child(${position + 1}) input`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, position: number) {
    if (event.key === 'Backspace' && position > 1) {
      const currentInput = event.target as HTMLInputElement;
      if (!currentInput.value) {
        // Move to previous input
        const prevInput = document.querySelector(`ion-input:nth-child(${position - 1}) input`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  }

  async onSubmit() {
    if (this.otpForm.invalid) {
      this.showToast('Please enter all 6 digits', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const otp = Object.values(this.otpForm.value).join('');
      console.log('Submitting OTP:', otp, 'isLogin:', this.isLogin, 'verificationId:', this.verificationId);

      if (this.isLogin) {
        // Handle OTP login with Firebase
        console.log('Attempting login with OTP...');
        const user = await this.authService.signInWithOTP(this.verificationId, otp);
        this.showToast('Login successful!', 'success');

        // Route based on role and verification status
        if (user.userType === 'doctor') {
          if (user.verificationStatus && user.verificationStatus !== 'approved') {
            this.router.navigate(['/doctor/kyc-verification']);
          } else {
            this.router.navigate(['/doctor/dashboard']);
          }
        } else if (user.userType === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/patient/dashboard']);
        }
      } else if (this.userData) {
        // Handle OTP registration
        console.log('Attempting registration with OTP...');
        const user = await this.authService.verifyOTP(this.verificationId, otp, this.userData);
        this.showToast('Registration successful!', 'success');
        
        if (user.userType === 'doctor') {
          this.router.navigate(['/doctor/kyc-verification']);
        } else {
          this.router.navigate(['/patient/dashboard']);
        }
      }

    } catch (error: any) {
      console.error('OTP verification error:', error);
      this.showToast(error.message || 'Invalid OTP. Please try again.', 'danger');
      
      // Clear OTP inputs
      this.otpForm.reset();
      const firstInput = document.querySelector('ion-input:first-child input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    } finally {
      this.isLoading = false;
    }
  }

  async resendOTP() {
    if (this.countdown > 0) return;

    this.isResending = true;

    try {
      if (this.userData) {
        this.verificationId = await this.authService.signUpWithOTP(this.userData.userType, this.phoneNumber);
      } else {
        // For login, we need to determine user type - for now assume patient
        this.verificationId = await this.authService.signUpWithOTP('patient', this.phoneNumber);
      }

      this.showToast('OTP sent successfully!', 'success');
      this.startCountdown();
      
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      this.showToast(error.message || 'Failed to resend OTP', 'danger');
    } finally {
      this.isResending = false;
    }
  }

  startCountdown() {
    this.countdown = 60;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
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
