import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonSelect, IonSelectOption, IonCheckbox, IonText, IonIcon, IonSpinner,
  IonSegment, IonSegmentButton, LoadingController, AlertController, ToastController
} from '@ionic/angular/standalone';
import { AuthService, UserRole, AuthMethod, UserRegistration } from '../../../services/auth.service';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, phonePortraitOutline, mailOutline, lockClosedOutline, personOutline, logoGoogle } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  template: `
    <ion-content [fullscreen]="true" class="register-content">
      <div class="register-container">
        <div class="header-section">
          <div class="hero-card">
            <div class="hero-icon">🏥</div>
            <div class="hero-text">
              <h1>Create Account</h1>
              <p>Join as {{ userType === 'doctor' ? 'Doctor' : userType === 'admin' ? 'Admin' : 'Patient' }}</p>
            </div>
          </div>

          <!-- Role Segment -->
       <!--    <ion-segment 
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
          </ion-segment>-->
        </div>

        <!-- Authentication Method Selection -->
        <ion-segment [(ngModel)]="selectedAuthMethod" (ionChange)="onAuthMethodChange($event)" class="role-segment">
          <!-- OTP temporarily disabled - requires paid Firebase plan -->
          <!-- <ion-segment-button value="otp" class="role-btn">
            <ion-icon name="phone-portrait-outline"></ion-icon>
            <ion-label>Phone OTP</ion-label>
          </ion-segment-button> -->
          <ion-segment-button value="password" class="role-btn">
            <ion-icon name="mail-outline"></ion-icon>
            <ion-label>Email</ion-label>
          </ion-segment-button>
          <ion-segment-button value="google" class="role-btn">
            <ion-icon name="logo-google"></ion-icon>
            <ion-label>Google</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-card class="registration-card">
          <ion-card-header>
            <ion-card-title>Registration Details</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
              
              <!-- Google Sign-In Info -->
              <div *ngIf="selectedAuthMethod === 'google'" class="google-info">
                <div class="google-message">
                  <ion-icon name="logo-google" color="danger"></ion-icon>
                  <h3>Continue with Google</h3>
                  <p>Your name and email will be automatically filled from your Google account.</p>
                  <p *ngIf="userType === 'doctor'"><strong>Note:</strong> You'll need to provide additional professional details after Google authentication.</p>
                </div>
              </div>

              <!-- Manual Registration Fields (for email/password) -->
              <div *ngIf="selectedAuthMethod === 'password'">
                <div class="input-field" [class.input-invalid]="registrationForm.get('name')?.invalid && registrationForm.get('name')?.touched">
                  <div class="icon-chip">
                    <ion-icon name="person-outline"></ion-icon>
                  </div>
                  <ion-input 
                    formControlName="name" 
                    placeholder="Full Name"
                    class="custom-input">
                  </ion-input>
                </div>
                <ion-text color="danger" *ngIf="registrationForm.get('name')?.invalid && registrationForm.get('name')?.touched">
                  <small class="validation-text">Please enter your full name (min 2 characters).</small>
                </ion-text>

                <div class="input-field" [class.input-invalid]="registrationForm.get('phone')?.invalid && registrationForm.get('phone')?.touched">
                  <div class="icon-chip">
                    <ion-icon name="phone-portrait-outline"></ion-icon>
                  </div>
                  <ion-input 
                    formControlName="phone" 
                    placeholder="Phone"
                    type="tel"
                    class="custom-input">
                  </ion-input>
                </div>
                <ion-text color="danger" *ngIf="registrationForm.get('phone')?.invalid && registrationForm.get('phone')?.touched">
                  <small class="validation-text">Enter a valid phone (E.164 format, e.g. +919876543210).</small>
                </ion-text>

                <div class="input-field" [class.input-invalid]="registrationForm.get('email')?.invalid && registrationForm.get('email')?.touched">
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
                <ion-text color="danger" *ngIf="registrationForm.get('email')?.invalid && registrationForm.get('email')?.touched">
                  <small class="validation-text">Please enter a valid email address.</small>
                </ion-text>
              </div>

              <!-- Password Field (for password auth only) -->
              <div *ngIf="selectedAuthMethod === 'password'" class="input-field" [class.input-invalid]="registrationForm.get('password')?.invalid && registrationForm.get('password')?.touched">
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
              <ion-text color="danger" *ngIf="selectedAuthMethod === 'password' && registrationForm.get('password')?.invalid && registrationForm.get('password')?.touched">
                <small class="validation-text">Min 6 chars, include upper, lower and a number.</small>
              </ion-text>

              <div *ngIf="selectedAuthMethod === 'password'" class="input-field" [class.input-invalid]="registrationForm.get('confirmPassword')?.invalid && registrationForm.get('confirmPassword')?.touched">
                <div class="icon-chip">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                </div>
                <ion-input 
                  formControlName="confirmPassword" 
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Confirm Password"
                  class="custom-input">
                </ion-input>
                <button type="button" class="eye-btn" (click)="toggleConfirmPasswordVisibility()">
                  <ion-icon [name]="showConfirmPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                </button>
              </div>
              <ion-text color="danger" *ngIf="selectedAuthMethod === 'password' && registrationForm.get('confirmPassword')?.invalid && registrationForm.get('confirmPassword')?.touched">
                <small class="validation-text">Please confirm your password.</small>
              </ion-text>

              <!-- Doctor Specific Fields (only for email/password registration) -->
              <div *ngIf="userType === 'doctor' && selectedAuthMethod === 'password'">
                <ion-item>
                  <ion-label position="stacked">Medical Specialization *</ion-label>
                  <ion-select formControlName="specialization" placeholder="Select specialization">
                    <ion-select-option value="general-medicine">General Medicine</ion-select-option>
                    <ion-select-option value="cardiology">Cardiology</ion-select-option>
                    <ion-select-option value="dermatology">Dermatology</ion-select-option>
                    <ion-select-option value="pediatrics">Pediatrics</ion-select-option>
                    <ion-select-option value="orthopedics">Orthopedics</ion-select-option>
                    <ion-select-option value="gynecology">Gynecology</ion-select-option>
                    <ion-select-option value="neurology">Neurology</ion-select-option>
                    <ion-select-option value="psychiatry">Psychiatry</ion-select-option>
                    <ion-select-option value="other">Other</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-text color="danger" *ngIf="registrationForm.get('specialization')?.invalid && registrationForm.get('specialization')?.touched">
                  <small class="validation-text">Please select a specialization.</small>
                </ion-text>

                <ion-item>
                  <ion-label position="stacked">Years of Experience *</ion-label>
                  <ion-input 
                    formControlName="experience" 
                    placeholder="Enter years of experience"
                    type="number"
                    min="0"
                    max="50">
                  </ion-input>
                </ion-item>
                <ion-text color="danger" *ngIf="registrationForm.get('experience')?.invalid && registrationForm.get('experience')?.touched">
                  <small class="validation-text">Please enter your experience.</small>
                </ion-text>

                <ion-item>
                  <ion-label position="stacked">Clinic/Hospital Name</ion-label>
                  <ion-input 
                    formControlName="clinicName" 
                    placeholder="Enter clinic or hospital name">
                  </ion-input>
                </ion-item>
              </div>

              <!-- Google Doctor Registration Note -->
              <div *ngIf="userType === 'doctor' && selectedAuthMethod === 'google'" class="doctor-google-note">
                <ion-text color="medium">
                  <p><ion-icon name="information-circle-outline"></ion-icon> Professional details (specialization, experience, etc.) will be collected after Google authentication.</p>
                </ion-text>
              </div>

              <!-- Patient Specific Fields removed by request -->

              <!-- Terms and Conditions -->
              <ion-item>
                <ion-checkbox formControlName="acceptTerms" slot="start"></ion-checkbox>
                <ion-label class="ion-text-wrap">
                  I agree to the <a href="#" (click)="showTerms()">Terms & Conditions</a> and <a href="#" (click)="showPrivacy()">Privacy Policy</a>
                </ion-label>
              </ion-item>
              <ion-text color="danger" *ngIf="registrationForm.get('acceptTerms')?.invalid && registrationForm.get('acceptTerms')?.touched">
                <small class="validation-text">You must accept the terms to continue.</small>
              </ion-text>

              <!-- Submit Button -->
              <ion-button 
                expand="block" 
                type="submit" 
                [disabled]="registrationForm.invalid || isLoading"
                class="register-button">
                <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
                <span *ngIf="!isLoading">
                  {{ selectedAuthMethod === 'google' ? 'Continue with Google' : 'Create Account' }}
                </span>
              </ion-button>

              <!-- Already have account -->
              <div class="login-link">
                <ion-text>
                  Already have an account? 
                  <a (click)="goToLogin()" class="link">Sign In</a>
                </ion-text>
              </div>

            </form>
          </ion-card-content>
        </ion-card>

        <!-- reCAPTCHA container (disabled) -->
        <!-- <div id="recaptcha-container"></div> -->
      </div>
    </ion-content>
  `,
  styles: [`
    .register-content {
      --background: linear-gradient(135deg, #28a745, #20c997);
      --color: white;
    }
    .register-container {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px 16px;
    }
    .header-section {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .hero-card {
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 22px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      margin-bottom: 12px;
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
    .hero-text h1 { margin: 8px 0 2px 0; color: #fff; font-weight: 700; font-size: 1.6rem; }
    .hero-text p { margin: 0; color: rgba(255,255,255,0.9); font-size: 0.95rem; }
    ion-segment { margin-bottom: 1rem; }
    .role-segment {
      margin-bottom: 1rem;
      --background: rgba(255,255,255,0.10);
      border-radius: 12px;
      padding: 4px;
    }
    .role-btn {
      --color: rgba(255,255,255,0.92);
      --color-checked: #1f7a36;
      --background-checked: #ffffff;
      --indicator-color: transparent;
      --border-radius: 12px;
      min-height: 40px; font-weight: 700;
    }
    .registration-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border: 1px solid rgba(16,24,40,0.06);
    }
    /* Auth segment pill styling to match Login */
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
    .register-button {
      margin-top: 1.1rem;
      --background: linear-gradient(135deg, #28a745, #20c997);
      --color: white;
      font-weight: 600;
      --border-radius: 12px;
      --padding-top: 14px;
      --padding-bottom: 14px;
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.25);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .login-link {
      text-align: center;
      margin-top: 0.75rem;
    }
    .link {
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }
    .link:hover {
      text-decoration: underline;
    }
    ion-item {
      margin-bottom: 0.7rem;
      --background: #ffffff;
      --min-height: 56px;
      border: 1px solid #DFE5EA;
      border-radius: 10px;
    }
    .ion-invalid { --border-color: var(--ion-color-danger); }
    #recaptcha-container {
      margin-top: 1rem;
    }
    .validation-text { margin-left: 6px; opacity: 0.95; }

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

    .custom-input {
      --padding-start: 0;
      --padding-end: 0;
      --padding-top: 6px;
      --padding-bottom: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      color: #111827;
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .register-container { padding: 16px 12px; }
      .registration-card ion-card-content { padding: 20px 16px; }
    }

    .google-info {
      text-align: center;
      padding: 30px 20px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .google-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    .google-message ion-icon {
      font-size: 3rem;
    }

    .google-message h3 {
      margin: 0;
      color: #333;
      font-weight: 600;
    }

    .google-message p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .doctor-google-note {
      background: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .doctor-google-note p {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .registration-card { background: rgba(30,30,30,0.96); border: 1px solid rgba(255,255,255,0.1); }
      ion-item { border-color: #444; }
      .google-info { background: rgba(40,40,40,0.8); }
      .google-message h3 { color: #fff; }
      .google-message p { color: #ccc; }
    }
  `],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
    IonSelect, IonSelectOption, IonCheckbox, IonText, IonIcon, IonSpinner,
    IonSegment, IonSegmentButton
  ],
  standalone: true
})
export class RegisterPage implements OnInit {
  registrationForm!: FormGroup;
  userType: UserRole = 'patient';
  selectedAuthMethod: AuthMethod = 'password'; // Default to password since OTP is disabled
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      eyeOutline, eyeOffOutline, phonePortraitOutline, mailOutline,
      lockClosedOutline, personOutline, logoGoogle
    });
  }

  ngOnInit() {
    // Get user type from query params
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.userType = params['type'] as UserRole;
      }
    });

    this.initializeForm();
  }

  initializeForm() {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      email: [''],
      password: [''],
      confirmPassword: [''],
      acceptTerms: [false, Validators.requiredTrue],
      // Doctor specific fields
      specialization: [''],
      experience: [''],
      clinicName: ['']
    });

    this.updateValidators();
  }

  onAuthMethodChange(event: any) {
    this.selectedAuthMethod = event.detail.value;
    this.updateValidators();
  }

  onUserTypeChange(event: any) {
    this.userType = event.detail.value as UserRole;
    this.updateValidators();
  }

  updateValidators() {
    const nameControl = this.registrationForm.get('name');
    const phoneControl = this.registrationForm.get('phone');
    const emailControl = this.registrationForm.get('email');
    const passwordControl = this.registrationForm.get('password');
    const confirmPasswordControl = this.registrationForm.get('confirmPassword');
    const specializationControl = this.registrationForm.get('specialization');
    const experienceControl = this.registrationForm.get('experience');

    // Clear existing validators
    nameControl?.clearValidators();
    phoneControl?.clearValidators();
    emailControl?.clearValidators();
    passwordControl?.clearValidators();
    confirmPasswordControl?.clearValidators();
    specializationControl?.clearValidators();
    experienceControl?.clearValidators();

    if (this.selectedAuthMethod === 'password') {
      // For email/password registration, require all basic fields
      nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      phoneControl?.setValidators([Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]);
      confirmPasswordControl?.setValidators([Validators.required]);

      // Add doctor-specific validators for email/password registration
      if (this.userType === 'doctor') {
        specializationControl?.setValidators([Validators.required]);
        experienceControl?.setValidators([Validators.required, Validators.min(0)]);
      }
    } else if (this.selectedAuthMethod === 'google') {
      // For Google registration, only terms are required (Google provides name/email)
      // No additional fields required - Google will handle authentication
    }

    // Update form validity
    nameControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
    specializationControl?.updateValueAndValidity();
    experienceControl?.updateValueAndValidity();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async onSubmit() {
    // For Google Sign-In, only check terms acceptance
    if (this.selectedAuthMethod === 'google') {
      if (!this.registrationForm.get('acceptTerms')?.value) {
        this.showToast('Please accept the terms and conditions', 'danger');
        return;
      }
    } else {
      // For email/password, validate the entire form
      if (this.registrationForm.invalid) {
        this.markFormGroupTouched();
        return;
      }

      // Check password confirmation
      const password = this.registrationForm.get('password')?.value;
      const confirmPassword = this.registrationForm.get('confirmPassword')?.value;

      if (password !== confirmPassword) {
        this.showToast('Passwords do not match', 'danger');
        return;
      }
    }

    this.isLoading = true;

    try {
      if (this.selectedAuthMethod === 'google') {
        // For Google registration, let Google handle the authentication
        // No additional data needed - will be collected after authentication if needed
        await this.authService.signUpWithGoogle(this.userType);
        this.handleSuccessfulRegistration();
      } else {
        // Email/password registration
        const formData = this.registrationForm.value;

        // Check for duplicate contacts
        const isDuplicate = await this.authService.checkDuplicateContact(
          formData.phone,
          formData.email
        );

        if (isDuplicate) {
          this.showToast('Phone number or email already registered', 'danger');
          this.isLoading = false;
          return;
        }

        const userData: UserRegistration = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          userType: this.userType,
          authMethod: this.selectedAuthMethod,
          additionalData: this.userType === 'doctor' ? {
            specialization: formData.specialization,
            experience: formData.experience,
            clinicName: formData.clinicName
          } : {}
        };

        await this.authService.signUpWithPassword(this.userType, userData);
        this.handleSuccessfulRegistration();
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle Google Sign-In specific errors
      if (error.message?.includes('missing initial state') || error.message?.includes('not available on this device')) {
        this.showToast('Google Sign-In is not available. Please use email registration instead.', 'warning');
        // Automatically switch to email method
        this.selectedAuthMethod = 'password';
        this.updateValidators();
      } else {
        this.showToast(error.message || 'Registration failed. Please try again.', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  private handleSuccessfulRegistration() {
    this.showToast('Registration successful!', 'success');

    if (this.userType === 'doctor') {
      this.router.navigate(['/doctor/kyc-verification'], { replaceUrl: true });
    } else {
      this.router.navigate(['/patient/dashboard'], { replaceUrl: true });
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
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

  async showTerms() {
    const alert = await this.alertController.create({
      header: 'Terms & Conditions',
      message: 'Terms and conditions content will be displayed here.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async showPrivacy() {
    const alert = await this.alertController.create({
      header: 'Privacy Policy',
      message: 'Privacy policy content will be displayed here.',
      buttons: ['OK']
    });
    await alert.present();
  }

  goToLogin() {
    this.router.navigate(['/auth/login'], { queryParams: { type: this.userType } });
  }
}
