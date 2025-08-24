import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, ToastController
} from '@ionic/angular/standalone';
import { AuthService, UserRole, AuthMethod } from '../../../services/auth.service';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, phonePortraitOutline, mailOutline, lockClosedOutline, logoGoogle } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  template: `
    <ion-content [fullscreen]="true" class="login-content">
      <div class="login-wrapper">
        <div class="bg-decor" aria-hidden="true"></div>
        <div class="login-container">
          
          <!-- Header Section -->
          <div class="header-section">
            <div class="hero-card">
              <div class="hero-icon">🏥</div>
              <div class="hero-text">
                <h1>DocBuddy</h1>
                <p>Your Health, Our Priority</p>
              </div>
            </div>

            <!-- Role Segment -->
          <!--   <ion-segment 
              [(ngModel)]="userType"
              (ionChange)="onUserTypeChange($event)"
              class="role-segment">
              <ion-segment-button value="patient" class="role-btn">
                <ion-label>Patient</ion-label>
              </ion-segment-button>
              <ion-segment-button value="doctor" class="role-btn">
                <ion-label>Doctor</ion-label>
              </ion-segment-button>
              <ion-segment-button value="admin" class="role-btn">
                <ion-label>Admin</ion-label>
              </ion-segment-button>
            </ion-segment> -->

            <div class="welcome-text">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>
          </div>

          <!-- Authentication Method Selection -->
          <ion-segment 
            [(ngModel)]="selectedAuthMethod" 
            (ionChange)="onAuthMethodChange($event)"
            class="auth-segment">
            <ion-segment-button value="password" class="segment-btn">
              <ion-icon name="mail-outline"></ion-icon>
              <ion-label>Email</ion-label>
            </ion-segment-button>
            <!-- OTP temporarily disabled - requires paid Firebase plan -->
            <!-- <ion-segment-button value="otp" class="segment-btn">
              <ion-icon name="phone-portrait-outline"></ion-icon>
              <ion-label>Phone OTP</ion-label>
            </ion-segment-button> -->
            <ion-segment-button value="google" class="segment-btn">
              <ion-icon name="logo-google"></ion-icon>
              <ion-label>Google</ion-label>
            </ion-segment-button>
          </ion-segment>

          <!-- Login Form Card -->
          <ion-card class="login-card fade-up">
            <ion-card-content class="card-content">
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                
                <!-- Email/Password Login -->
                <div *ngIf="selectedAuthMethod === 'password'" class="form-section">
                  <div class="input-field" [class.input-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                    <div class="icon-chip">
                      <ion-icon name="mail-outline"></ion-icon>
                    </div>
                    <ion-input 
                      formControlName="email" 
                      placeholder="Email"
                      type="email"
                      class="custom-input">
                    </ion-input>
                  </div>
                  <ion-text color="danger" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                    <small class="validation-text">Please enter a valid email.</small>
                  </ion-text>

                  <div class="input-field" [class.input-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                    <div class="icon-chip">
                      <ion-icon name="lock-closed-outline"></ion-icon>
                    </div>
                    <ion-input 
                      formControlName="password" 
                      [type]="showPassword ? 'text' : 'password'"
                      placeholder="Password"
                      class="custom-input">
                    </ion-input>
                    <button type="button" class="eye-btn" (click)="togglePasswordVisibility()">
                      <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                    </button>
                  </div>
                  <ion-text color="danger" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                    <small class="validation-text">Password is required.</small>
                  </ion-text>

                  <div class="forgot-password">
                    <ion-button fill="clear" size="small" (click)="goToForgotPassword()" class="forgot-btn">
                      Forgot Password?
                    </ion-button>
                  </div>
                </div>

                <!-- Phone OTP Login - Temporarily Disabled (Requires Paid Firebase Plan) -->
                <!-- <div *ngIf="selectedAuthMethod === 'otp'" class="form-section">
                  <div class="input-field">
                    <div class="icon-chip">
                      <ion-icon name="phone-portrait-outline"></ion-icon>
                    </div>
                    <ion-input placeholder="Phone" type="tel" class="custom-input"></ion-input>
                  </div>
                </div> -->

                <!-- Google Login Info -->
                <div *ngIf="selectedAuthMethod === 'google'" class="form-section google-info">
                  <div class="google-message">
                    <ion-icon name="logo-google" color="danger"></ion-icon>
                    <p>Continue with your Google account</p>
                  </div>
                </div>

                <!-- Submit Button -->
                <ion-button 
                  expand="block" 
                  type="submit" 
                  size="large"
                  [disabled]="(selectedAuthMethod !== 'google' && loginForm.invalid) || isLoading"
                  class="submit-button">
                  <ion-spinner *ngIf="isLoading" name="crescent" color="light"></ion-spinner>
                  <span *ngIf="!isLoading">
                    {{ selectedAuthMethod === 'google' ? 'Continue with Google' : 'Sign In' }}
                  </span>
                </ion-button>

              </form>
            </ion-card-content>
          </ion-card>

          <!-- Register Link -->
          <div class="register-section">
            <p>Don't have an account?</p>
            <ion-button fill="clear" (click)="goToRegister()" class="register-btn">
              Create Account
            </ion-button>
          </div>

          <!-- Admin Setup Link -->
          <div class="admin-setup-section" *ngIf="userType === 'admin'">
            <ion-button fill="outline" size="small" (click)="goToAdminSetup()" class="setup-btn">
              <ion-icon name="settings-outline" slot="start"></ion-icon>
              Setup Admin Account
            </ion-button>
          </div>

          <!-- reCAPTCHA container (disabled) -->
          <!-- <div id="recaptcha-container" class="recaptcha-container"></div> -->
          
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: linear-gradient(135deg, #28a745, #20c997);
      --color: white;
    }

    .login-wrapper {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .login-container {
      width: 100%;
      max-width: 420px;
      margin: 0 auto;
    }

    .bg-decor {
      position: absolute;
      inset: -20% -10% auto -10%;
      height: 140%;
      background:
        radial-gradient(120px 120px at 10% 20%, rgba(255,255,255,0.25), transparent 60%),
        radial-gradient(160px 160px at 90% 10%, rgba(255,255,255,0.18), transparent 60%),
        radial-gradient(200px 200px at 80% 80%, rgba(255,255,255,0.12), transparent 60%);
      pointer-events: none;
      filter: blur(2px);
    }

    .header-section { text-align: center; margin-bottom: 20px; }

    .hero-card {
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 22px;
      padding: 28px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      margin-bottom: 18px;
    }

    .hero-icon {
      font-size: 3rem;
      background: #ffffff;
      color: #28a745;
      width: 72px; height: 72px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
    }

    .hero-text h1 {
      margin: 8px 0 2px 0;
      color: #fff; font-weight: 700; font-size: 1.6rem;
    }

    .hero-text p { margin: 0; color: rgba(255,255,255,0.9); font-size: 0.95rem; }

    .role-segment {
      margin: 12px auto 8px auto;
      max-width: 360px;
      --background: rgba(255,255,255,0.10);
      border-radius: 14px; padding: 4px;
    }

    .role-btn {
      --color: rgba(255,255,255,0.92);
      --color-checked: #1f7a36;
      --background-checked: #ffffff;
      --indicator-color: transparent;
      --border-radius: 12px;
      min-height: 40px; font-weight: 700;
    }

    /* Auth segment pill styling */
    .auth-segment {
      --background: rgba(255,255,255,0.10);
      border-radius: 16px;
      padding: 6px;
      margin-bottom: 14px;
    }

    .segment-btn {
      --background: transparent;
      --background-checked: linear-gradient(135deg, rgba(40,167,69,0.95), rgba(32,201,151,0.95));
      --color: rgba(255,255,255,0.6);
      --color-checked: #ffffff;
      --indicator-color: transparent;
      border-radius: 12px;
      min-height: 56px;
      position: relative;
      transition: opacity .2s ease, transform .2s ease;
      opacity: 0.6;
    }

    .segment-btn.segment-button-checked {
      opacity: 1;
      box-shadow: 0 10px 24px rgba(40,167,69,0.25);
    }

    .segment-btn.segment-button-checked::after {
      content: '';
      position: absolute;
      left: 16px;
      right: 16px;
      bottom: 8px;
      height: 2px;
      background: #ffffff;
      border-radius: 2px;
      opacity: 0.95;
    }

    .app-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .logo-icon {
      font-size: 3.5rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .logo-text h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0;
      color: white;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .logo-text p {
      font-size: 0.9rem;
      margin: 5px 0 0 0;
      color: rgba(255,255,255,0.9);
      font-weight: 400;
    }

    .welcome-text h2 {
      font-size: 1.6rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    .welcome-text p {
      font-size: 1rem;
      margin: 0;
      color: rgba(255,255,255,0.85);
      font-weight: 400;
    }

    .auth-segment {
      margin-bottom: 20px;
      --background: rgba(255,255,255,0.10);
      border-radius: 12px;
      padding: 4px;
    }

    .segment-btn {
      --color: rgba(255,255,255,0.92);
      --color-checked: #1f7a36;
      --background-checked: #ffffff;
      --indicator-color: transparent;
      font-size: 0.88rem;
      font-weight: 600;
      --border-radius: 10px;
      min-height: 40px;
    }

    .login-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border: 1px solid rgba(16,24,40,0.06);
      margin-bottom: 16px;
    }

    .card-content { padding: 24px 20px; }

    .form-section {
      margin-bottom: 20px;
    }

    .form-item {
      --background: #ffffff;
      --border-radius: 10px;
      --padding-start: 0;
      --inner-padding-end: 0;
      --min-height: 56px;
      margin-bottom: 12px;
      border: 1px solid #DFE5EA;
      border-radius: 10px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-item:focus-within {
      border-color: #28a745;
      box-shadow: 0 0 0 2px rgba(40,167,69,0.14);
    }

    .form-item ion-label {
      font-weight: 600;
      font-size: 0.78rem;
      margin-bottom: 4px;
      color: #111827;
    }

    /* New rounded input style */
    .input-field {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1px solid #DFE5EA;
      border-radius: 16px;
      padding: 10px 12px;
      min-height: 56px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.04);
      transition: border-color .2s ease, box-shadow .2s ease;
      margin-bottom: 12px;
    }

    .input-field:focus-within {
      border-color: #28a745;
      box-shadow: 0 0 0 2px rgba(40,167,69,0.12);
    }

    .icon-chip {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(40,167,69,0.12);
      color: #1f7a36;
      flex: 0 0 auto;
    }

    .eye-btn {
      border: 1px solid #DFE5EA;
      background: #F8FAFB;
      border-radius: 10px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 6px;
    }

    .input-field .custom-input {
      --padding-start: 0;
      --padding-end: 0;
      --padding-top: 6px;
      --padding-bottom: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      color: #111827;
      width: 100%;
    }

    .input-invalid { border-color: #dc3545 !important; }

    .custom-input {
      --padding-start: 12px;
      --padding-end: 12px;
      --padding-top: 10px;
      --padding-bottom: 10px;
      font-size: 0.92rem;
      font-weight: 500;
      color: #111827;
    }

    .password-toggle {
      --color: #1f2937;
      margin-right: 8px;
      height: 30px;
      width: 34px;
      --padding-start: 0;
      --padding-end: 0;
      border: 1px solid #DFE5EA;
      border-radius: 8px;
      --background: #F8FAFB;
    }

    .forgot-password {
      text-align: right;
      margin-top: 10px;
    }

    .forgot-btn {
      --background: transparent;
      --box-shadow: none;
      --border-color: transparent;
      --color: #198754;
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }

    .google-info {
      text-align: center;
      padding: 30px 20px;
    }

    .google-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    .google-message ion-icon {
      font-size: 2.5rem;
    }

    .google-message p {
      font-size: 1rem;
      color: #666;
      margin: 0;
      font-weight: 500;
    }

    .submit-button {
      --background: linear-gradient(135deg, #28a745, #20c997);
      --color: white;
      --border-radius: 12px;
      --padding-top: 16px;
      --padding-bottom: 16px;
      font-weight: 600;
      font-size: 1rem;
      margin-top: 12px;
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.25);
      transition: all 0.3s ease;
    }

    .submit-button:not([disabled]):hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
    }

    .submit-button[disabled] {
      opacity: 0.7;
      filter: grayscale(10%);
    }

    .register-section {
      text-align: center;
      margin-top: 25px;
    }

    .register-section p {
      color: rgba(255,255,255,0.9);
      margin: 0 0 10px 0;
      font-size: 0.95rem;
    }

    .register-btn {
      --color: white;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: underline;
    }

    .admin-setup-section {
      text-align: center;
      margin-top: 20px;
    }

    /* removed change-type-link in favor of role segment */

    .setup-btn {
      --color: rgba(255,255,255,0.9);
      --border-color: rgba(255,255,255,0.3);
      font-size: 0.85rem;
      font-weight: 500;
    }

    .recaptcha-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }

    .ion-invalid {
      border-color: #dc3545 !important;
    }

    .validation-text {
      margin-left: 6px;
      opacity: 0.95;
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .login-wrapper {
        padding: 15px;
      }
      
      .login-container {
        max-width: 100%;
      }
      
      .app-logo {
        flex-direction: column;
        gap: 10px;
      }
      
      .logo-icon {
        font-size: 3rem;
      }
      
      .card-content {
        padding: 25px 20px;
      }
      
      .auth-segment {
        font-size: 0.8rem;
      }
    }

    /* Simple entrance animation */
    .fade-up { animation: fadeUp 420ms ease-out both; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .login-card {
        background: rgba(30, 30, 30, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
      }
      
      .form-item {
        border-color: #444;
      }
      
      .form-item ion-label {
        --color: #e0e0e0;
      }
    }
  `],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon, IonSpinner,
    IonSegment, IonSegmentButton
  ],
  standalone: true
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  userType: UserRole = 'patient';
  selectedAuthMethod: AuthMethod = 'password'; // Default to password since OTP and Google are disabled
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {
    addIcons({
      eyeOutline, eyeOffOutline, phonePortraitOutline, mailOutline,
      lockClosedOutline, logoGoogle
    });
  }

  ngOnInit() {
    // Get user type from query params
    this.route.queryParams.subscribe((params: any) => {
      if (params['type']) {
        this.userType = params['type'] as UserRole;
      }
    });

    this.initializeForm();
  }

  initializeForm() {
    this.loginForm = this.fb.group({
      phone: [''],
      email: [''],
      password: ['']
    });

    this.updateValidators();
  }

  onAuthMethodChange(event: any) {
    this.selectedAuthMethod = event.detail.value;
    this.updateValidators();
  }

  onUserTypeChange(event: any) {
    this.userType = event.detail.value as UserRole;
    // No validator changes needed for role switch, but keep hook for future
  }

  updateValidators() {
    const phoneControl = this.loginForm.get('phone');
    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    // Clear existing validators
    phoneControl?.clearValidators();
    emailControl?.clearValidators();
    passwordControl?.clearValidators();

    // OTP temporarily disabled
    if (this.selectedAuthMethod === 'password') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      passwordControl?.setValidators([Validators.required]);
    }

    // Update form validity
    phoneControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formData = this.loginForm.value;

      if (this.selectedAuthMethod === 'google') {
        await this.authService.signInWithGoogle();
        this.handleSuccessfulLogin();
      } else if (this.selectedAuthMethod === 'password') {
        // Check if admin email - override user type
        if (formData.email === 'admin@doctorapp.com') {
          console.log('Admin login detected, setting user type to admin');
          this.userType = 'admin';
        }
        await this.authService.signInWithPassword(formData.email, formData.password);
        this.handleSuccessfulLogin();
      }

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle Google Sign-In specific errors
      if (error.message?.includes('missing initial state') || error.message?.includes('not available on this device')) {
        this.showToast('Google Sign-In is not available. Please use email login instead.', 'warning');
        // Automatically switch to email method
        this.selectedAuthMethod = 'password';
        this.updateValidators();
      } else {
        this.showToast(error.message || 'Login failed. Please try again.', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  private handleSuccessfulLogin() {
    this.showToast('Login successful!', 'success');

    const user = this.authService.getCurrentUser();
    if (user) {
      // Check if this is admin user - override any user type selection
      if (user.email === 'admin@doctorapp.com' || user.role === 'admin' || user.userType === 'admin') {
        console.log('Admin user detected, redirecting to admin dashboard');
        this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
        return;
      }

      // Regular user routing
      if (user.userType === 'doctor') {
        if (user.verificationStatus === 'pending') {
          this.router.navigate(['/doctor/kyc-verification'], { replaceUrl: true });
        } else {
          this.router.navigate(['/doctor/dashboard'], { replaceUrl: true });
        }
      } else if (user.userType === 'patient') {
        this.router.navigate(['/patient/dashboard'], { replaceUrl: true });
      }
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
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

  goToRegister() {
    this.router.navigate(['/auth/register'], { queryParams: { type: this.userType } });
  }

  goToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }

  goToAdminSetup() {
    this.router.navigate(['/admin-setup']);
  }

  goToUserTypeSelection() {
    this.router.navigate(['/user-type']);
  }
}
