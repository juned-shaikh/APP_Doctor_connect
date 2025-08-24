import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, 
  IonText, IonIcon, IonSpinner, IonProgressBar, IonAlert, IonToast,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { AuthService, User } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  documentOutline, cameraOutline, checkmarkCircleOutline, 
  warningOutline, cloudUploadOutline, idCardOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kyc-verification',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-title>KYC Verification</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="kyc-container">
        <!-- Progress Indicator -->
        <div class="progress-section">
          <ion-text color="primary">
            <h2>Complete Your Verification</h2>
            <p>Upload required documents to verify your medical credentials</p>
          </ion-text>
          <ion-progress-bar [value]="getProgressValue()" color="primary"></ion-progress-bar>
          <p class="progress-text">{{ getCompletedSteps() }}/{{ getTotalSteps() }} steps completed</p>
        </div>

        <!-- Verification Status -->
        <ion-card class="status-card" *ngIf="verificationStatus">
          <ion-card-content>
            <div class="status-info">
              <ion-icon 
                [name]="getStatusIcon()" 
                [color]="getStatusColor()"
                size="large">
              </ion-icon>
              <div class="status-text">
                <h3>{{ getStatusTitle() }}</h3>
                <p>{{ getStatusMessage() }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Document Upload Form -->
        <form [formGroup]="kycForm" (ngSubmit)="onSubmit()" *ngIf="verificationStatus !== 'approved'">
          
          <!-- Aadhaar Card -->
          <ion-card class="document-card">
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="id-card-outline"></ion-icon>
                Aadhaar Card
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="upload-section">
                <input 
                  type="file" 
                  #aadhaarInput 
                  accept="image/*,.pdf"
                  (change)="onFileSelect('aadhaar', $event)"
                  style="display: none">
                
                <div class="upload-area" (click)="aadhaarInput.click()" *ngIf="!documents.aadhaar">
                  <ion-icon name="cloud-upload-outline" size="large"></ion-icon>
                  <p>Click to upload Aadhaar Card</p>
                  <small>Supported formats: JPG, PNG, PDF (Max 5MB)</small>
                </div>

                <div class="uploaded-file" *ngIf="documents.aadhaar">
                  <ion-icon name="document-outline" color="success"></ion-icon>
                  <span>{{ documents.aadhaar.name }}</span>
                  <ion-button fill="clear" color="danger" (click)="removeFile('aadhaar')">
                    Remove
                  </ion-button>
                </div>
              </div>

              <ion-item *ngIf="documents.aadhaar">
                <ion-label position="stacked">Aadhaar Number</ion-label>
                <ion-input 
                  formControlName="aadhaarNumber"
                  placeholder="Enter 12-digit Aadhaar number"
                  maxlength="12">
                </ion-input>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Medical License -->
          <ion-card class="document-card">
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="document-outline"></ion-icon>
                Medical License *
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="upload-section">
                <input 
                  type="file" 
                  #licenseInput 
                  accept="image/*,.pdf"
                  (change)="onFileSelect('license', $event)"
                  style="display: none">
                
                <div class="upload-area" (click)="licenseInput.click()" *ngIf="!documents.license">
                  <ion-icon name="cloud-upload-outline" size="large"></ion-icon>
                  <p>Click to upload Medical License</p>
                  <small>Supported formats: JPG, PNG, PDF (Max 5MB)</small>
                </div>

                <div class="uploaded-file" *ngIf="documents.license">
                  <ion-icon name="document-outline" color="success"></ion-icon>
                  <span>{{ documents.license.name }}</span>
                  <ion-button fill="clear" color="danger" (click)="removeFile('license')">
                    Remove
                  </ion-button>
                </div>
              </div>

              <ion-item *ngIf="documents.license">
                <ion-label position="stacked">Medical License Number *</ion-label>
                <ion-input 
                  formControlName="licenseNumber"
                  placeholder="Enter license number">
                </ion-input>
              </ion-item>

              <ion-item *ngIf="documents.license">
                <ion-label position="stacked">Issuing Authority *</ion-label>
                <ion-input 
                  formControlName="issuingAuthority"
                  placeholder="e.g., Medical Council of India">
                </ion-input>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Hospital Affiliation (Optional) -->
          <ion-card class="document-card">
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="document-outline"></ion-icon>
                Hospital Affiliation (Optional)
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="upload-section">
                <input 
                  type="file" 
                  #affiliationInput 
                  accept="image/*,.pdf"
                  (change)="onFileSelect('affiliation', $event)"
                  style="display: none">
                
                <div class="upload-area" (click)="affiliationInput.click()" *ngIf="!documents.affiliation">
                  <ion-icon name="cloud-upload-outline" size="large"></ion-icon>
                  <p>Click to upload Hospital Affiliation Certificate</p>
                  <small>Supported formats: JPG, PNG, PDF (Max 5MB)</small>
                </div>

                <div class="uploaded-file" *ngIf="documents.affiliation">
                  <ion-icon name="document-outline" color="success"></ion-icon>
                  <span>{{ documents.affiliation.name }}</span>
                  <ion-button fill="clear" color="danger" (click)="removeFile('affiliation')">
                    Remove
                  </ion-button>
                </div>
              </div>

              <ion-item *ngIf="documents.affiliation">
                <ion-label position="stacked">Hospital/Clinic Name</ion-label>
                <ion-input 
                  formControlName="hospitalName"
                  placeholder="Enter hospital or clinic name">
                </ion-input>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Submit Button -->
          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="!canSubmit() || isLoading"
            class="submit-button">
            <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            <span *ngIf="!isLoading">Submit for Verification</span>
          </ion-button>

          <!-- Skip for now (temporary) -->
          <ion-button 
            expand="block" 
            fill="outline" 
            (click)="skipVerification()"
            class="skip-button">
            Skip for Now (Limited Access)
          </ion-button>

        </form>

        <!-- Already Submitted -->
        <div class="submitted-section" *ngIf="verificationStatus === 'pending' || verificationStatus === 'under_review'">
          <ion-card>
            <ion-card-content>
              <div class="submitted-info">
                <ion-icon name="checkmark-circle-outline" color="success" size="large"></ion-icon>
                <h3>Documents Submitted Successfully!</h3>
                <p>Your documents are under review. We'll notify you once the verification is complete.</p>
                <p><strong>Estimated Review Time:</strong> 24-48 hours</p>
              </div>
              <ion-button expand="block" (click)="goToDashboard()">
                Continue to Dashboard
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Approved -->
        <div class="approved-section" *ngIf="verificationStatus === 'approved'">
          <ion-card>
            <ion-card-content>
              <div class="approved-info">
                <ion-icon name="checkmark-circle-outline" color="success" size="large"></ion-icon>
                <h3>Verification Complete!</h3>
                <p>Congratulations! Your medical credentials have been verified successfully.</p>
                <p>You now have full access to all doctor features.</p>
              </div>
              <ion-button expand="block" (click)="goToDashboard()">
                Go to Dashboard
              </ion-button>
            </ion-card-content>
          </ion-card>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .kyc-container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .progress-section {
      text-align: center;
      margin-bottom: 2rem;
    }
    .progress-section h2 {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
    }
    .progress-section p {
      margin: 0 0 1rem 0;
      opacity: 0.8;
    }
    .progress-text {
      font-size: 0.9rem;
      margin-top: 0.5rem;
      opacity: 0.7;
    }
    .status-card {
      margin-bottom: 2rem;
    }
    .status-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .status-text h3 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
    }
    .status-text p {
      margin: 0;
      opacity: 0.8;
    }
    .document-card {
      margin-bottom: 1.5rem;
    }
    .document-card ion-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .upload-section {
      margin-bottom: 1rem;
    }
    .upload-area {
      border: 2px dashed var(--ion-color-light);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .upload-area:hover {
      border-color: var(--ion-color-primary);
      background-color: var(--ion-color-primary-tint);
    }
    .upload-area ion-icon {
      opacity: 0.5;
      margin-bottom: 1rem;
    }
    .upload-area p {
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }
    .upload-area small {
      opacity: 0.7;
    }
    .uploaded-file {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background-color: var(--ion-color-light);
      border-radius: 8px;
    }
    .uploaded-file span {
      flex: 1;
      font-weight: 500;
    }
    .submit-button {
      margin: 2rem 0 1rem 0;
      --background: #4CAF50;
      --background-hover: #45a049;
      --color: white;
      font-weight: bold;
    }
    .skip-button {
      margin-bottom: 2rem;
    }
    .submitted-section, .approved-section {
      text-align: center;
    }
    .submitted-info, .approved-info {
      text-align: center;
      margin-bottom: 2rem;
    }
    .submitted-info h3, .approved-info h3 {
      margin: 1rem 0 0.5rem 0;
      font-weight: bold;
    }
    .submitted-info p, .approved-info p {
      margin: 0.5rem 0;
      opacity: 0.8;
    }
  `],
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, 
    IonText, IonIcon, IonSpinner, IonProgressBar, IonAlert, IonToast
  ],
  standalone: true
})
export class KycVerificationPage implements OnInit {
  kycForm!: FormGroup;
  currentUser: User | null = null;
  verificationStatus: string = 'pending';
  isLoading = false;
  
  documents: {
    aadhaar?: File;
    license?: File;
    affiliation?: File;
  } = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ 
      documentOutline, cameraOutline, checkmarkCircleOutline, 
      warningOutline, cloudUploadOutline, idCardOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
    // Subscribe to auth state so current user is available when page loads
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user || null;
      this.verificationStatus = user?.verificationStatus || 'pending';
    });
  }

  initializeForm() {
    this.kycForm = this.fb.group({
      aadhaarNumber: ['', [Validators.pattern(/^\d{12}$/)]],
      licenseNumber: ['', [Validators.required]],
      issuingAuthority: ['', [Validators.required]],
      hospitalName: ['']
    });
  }

  onFileSelect(type: 'aadhaar' | 'license' | 'affiliation', event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File size must be less than 5MB', 'danger');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.showToast('Please upload JPG, PNG, or PDF files only', 'danger');
        return;
      }

      this.documents[type] = file;
      
      // Update form validators based on uploaded documents
      this.updateFormValidators();
    }
  }

  removeFile(type: 'aadhaar' | 'license' | 'affiliation') {
    delete this.documents[type];
    this.updateFormValidators();
  }

  updateFormValidators() {
    const licenseNumberControl = this.kycForm.get('licenseNumber');
    const issuingAuthorityControl = this.kycForm.get('issuingAuthority');

    if (this.documents.license) {
      licenseNumberControl?.setValidators([Validators.required]);
      issuingAuthorityControl?.setValidators([Validators.required]);
    } else {
      licenseNumberControl?.clearValidators();
      issuingAuthorityControl?.clearValidators();
    }

    licenseNumberControl?.updateValueAndValidity();
    issuingAuthorityControl?.updateValueAndValidity();
  }

  canSubmit(): boolean {
    return !!this.documents.license && this.kycForm.valid;
  }

  getProgressValue(): number {
    const steps = this.getCompletedSteps();
    const total = this.getTotalSteps();
    return steps / total;
  }

  getCompletedSteps(): number {
    let completed = 0;
    if (this.documents.aadhaar) completed++;
    if (this.documents.license) completed++;
    if (this.documents.affiliation) completed++;
    return completed;
  }

  getTotalSteps(): number {
    return 3; // Aadhaar, License, Affiliation
  }

  getStatusIcon(): string {
    switch (this.verificationStatus) {
      case 'approved': return 'checkmark-circle-outline';
      case 'rejected': return 'warning-outline';
      case 'under_review': return 'document-outline';
      default: return 'document-outline';
    }
  }

  getStatusColor(): string {
    switch (this.verificationStatus) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'under_review': return 'warning';
      default: return 'medium';
    }
  }

  getStatusTitle(): string {
    switch (this.verificationStatus) {
      case 'approved': return 'Verification Complete';
      case 'rejected': return 'Verification Rejected';
      case 'under_review': return 'Under Review';
      default: return 'Verification Required';
    }
  }

  getStatusMessage(): string {
    switch (this.verificationStatus) {
      case 'approved': return 'Your medical credentials have been verified successfully.';
      case 'rejected': return 'Please resubmit your documents with the required corrections.';
      case 'under_review': return 'Your documents are being reviewed by our team.';
      default: return 'Please upload your medical credentials for verification.';
    }
  }

  async onSubmit() {
    if (!this.canSubmit()) {
      this.showToast('Please upload medical license and fill required fields', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      if (!this.currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      // Upload documents to Firebase Storage
      const documentUrls: any = {};
      
      if (this.documents.aadhaar) {
        documentUrls.aadhaarUrl = await this.firebaseService.uploadFile(
          this.documents.aadhaar, 
          `kyc/${this.currentUser.uid}/aadhaar`
        );
      }
      
      if (this.documents.license) {
        documentUrls.licenseUrl = await this.firebaseService.uploadFile(
          this.documents.license, 
          `kyc/${this.currentUser.uid}/license`
        );
      }
      
      if (this.documents.affiliation) {
        documentUrls.affiliationUrl = await this.firebaseService.uploadFile(
          this.documents.affiliation, 
          `kyc/${this.currentUser.uid}/affiliation`
        );
      }

      // Prepare KYC data
      const kycData = {
        ...this.kycForm.value,
        ...documentUrls,
        kycStatus: 'pending',
        verificationStatus: 'under_review',
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      // Update user profile with KYC data
      await this.firebaseService.updateUserProfile(this.currentUser.uid, kycData);
      
      // Update verification status
      this.verificationStatus = 'under_review';
      
      this.showToast('Documents submitted successfully for verification!', 'success');
      
    } catch (error: any) {
      console.error('KYC submission error:', error);
      this.showToast(error.message || 'Failed to submit documents. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async skipVerification() {
    const alert = await this.alertController.create({
      header: 'Skip Verification',
      message: 'You will have limited access until verification is complete. You can complete verification later from your profile.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Continue',
          handler: () => {
            this.goToDashboard();
          }
        }
      ]
    });

    await alert.present();
  }

  goToDashboard() {
    this.router.navigate(['/doctor/dashboard']);
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
}
