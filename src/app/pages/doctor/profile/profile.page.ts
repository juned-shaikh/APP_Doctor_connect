import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonItem, IonLabel, IonInput, IonBackButton,
  IonButtons, IonList, IonTextarea, IonToggle, IonSelect, IonSelectOption,
  IonAvatar, IonImg, IonGrid, IonRow, IonCol, IonAlert, AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, settingsOutline, cameraOutline, saveOutline, logOutOutline, videocamOffOutline, mailOutline, arrowBackOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService, UserData } from '../../../services/firebase.service';
import { AuthService, User } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-doctor-profile',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="goBack()" class="back-button">
            <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Profile Settings</ion-title>
        <ion-buttons slot="end">
          <ion-button [disabled]="saving || form.invalid" (click)="save()">
            <ion-icon name="save-outline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" (click)="logout()">
            <ion-icon name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <div class="profile-container">
        <ion-card>
          <ion-card-content>
            <ion-grid>
              <ion-row class="ion-align-items-center">
                <ion-col size="3" sizeMd="2">
                  <div class="avatar-wrap">
                    <ion-avatar class="avatar">
                      <ion-img [src]="avatarUrl || 'assets/avatar-placeholder.svg'"></ion-img>
                    </ion-avatar>
                    <ion-button class="avatar-btn" size="small" fill="solid" (click)="triggerFile()">
                      <ion-icon name="camera-outline"></ion-icon>
                    </ion-button>
                    <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)">
                  </div>
                </ion-col>
                <ion-col size="9" sizeMd="10">
                  <h2>{{ form.get('name')?.value || 'Doctor Profile' }}</h2>
                  <p>Manage your profile information</p>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <form [formGroup]="form">
          <ion-card>
            <ion-card-content>
              <ion-list lines="full">
                <ion-item>
                  <ion-label position="stacked">Full Name</ion-label>
                  <ion-input formControlName="name"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Specialization</ion-label>
                  <ion-input formControlName="specialization"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Years of Experience</ion-label>
                  <ion-input type="number" formControlName="experience"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Medical Registration Number</ion-label>
                  <ion-input formControlName="regNumber"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Bio</ion-label>
                  <ion-textarea autoGrow="true" formControlName="bio" maxlength="500"></ion-textarea>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Languages (comma separated)</ion-label>
                  <ion-input formControlName="languagesText" placeholder="English, Hindi"></ion-input>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-content>
              <h3>Contact & Clinic</h3>
              <ion-list lines="full">
                <ion-item>
                  <ion-label position="stacked">Phone</ion-label>
                  <ion-input formControlName="phone" placeholder="+91xxxxxxxxxx"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Email</ion-label>
                  <ion-input type="email" formControlName="email"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Clinic Name</ion-label>
                  <ion-input formControlName="clinicName"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Address Line</ion-label>
                  <ion-input formControlName="addressLine"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">City</ion-label>
                  <ion-input formControlName="city"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">State</ion-label>
                  <ion-input formControlName="state"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Pincode</ion-label>
                  <ion-input formControlName="pincode"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Maps URL</ion-label>
                  <ion-input type="url" formControlName="mapsUrl"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label>Show phone on profile</ion-label>
                  <ion-toggle slot="end" formControlName="showPhone"></ion-toggle>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-content>
              <h3>Consultation & Fees</h3>
              <ion-list lines="full">
                <!-- Video Consultation - Only show if access is granted -->
                <div *ngIf="hasVideoConsultationAccess">
                  <ion-item>
                    <ion-label>Video Consultation</ion-label>
                    <ion-toggle slot="end" formControlName="videoEnabled"></ion-toggle>
                  </ion-item>
                  <ion-item>
                    <ion-label position="stacked">Video Fee</ion-label>
                    <ion-input type="number" formControlName="videoFee" [disabled]="!form.get('videoEnabled')?.value"></ion-input>
                  </ion-item>
                </div>

                <!-- Video Consultation Access Denied Message -->
                <div *ngIf="!hasVideoConsultationAccess" class="video-access-denied">
                  <ion-item lines="none" class="subscription-message">
                    <ion-icon name="videocam-off-outline" slot="start" color="medium"></ion-icon>
                    <ion-label>
                      <h3>Video Consultation Unavailable</h3>
                      <p>Contact admin to enable video consultation access or upgrade to a paid subscription to unlock this feature.</p>
                    </ion-label>
                  </ion-item>
                  <ion-button expand="block" fill="outline" color="primary" class="subscription-btn" (click)="contactAdmin()">
                    <ion-icon name="mail-outline" slot="start"></ion-icon>
                    Contact Admin
                  </ion-button>
                </div>

                <ion-item>
                  <ion-label>Clinic Visit</ion-label>
                  <ion-toggle slot="end" formControlName="clinicEnabled"></ion-toggle>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Clinic Fee</ion-label>
                  <ion-input type="number" formControlName="clinicFee" [disabled]="!form.get('clinicEnabled')?.value"></ion-input>
                </ion-item>
                <ion-item>
                  <ion-label>Accept Online Payments</ion-label>
                  <ion-toggle slot="end" formControlName="acceptOnline"></ion-toggle>
                </ion-item>
                <ion-item>
                  <ion-label>Accept Cash</ion-label>
                  <ion-toggle slot="end" formControlName="acceptCash"></ion-toggle>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </form>

        <div class="actions">
          <ion-button expand="block" color="primary" (click)="save()" [disabled]="saving || form.invalid">{{ saving ? 'Saving...' : 'Save Profile' }}</ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .profile-container { padding: 1rem; }
    .avatar-wrap { position: relative; width: 96px; height: 96px; }
    .avatar { width: 96px; height: 96px; }
    .avatar-btn { position: absolute; bottom: -6px; right: -6px; z-index: 2; }
    h3 { margin: 8px 0 12px 0; }
    
    .video-access-denied {
      background-color: var(--ion-color-light-tint);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid var(--ion-color-warning);
    }
    
    .subscription-message {
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
      margin-bottom: 12px;
    }
    
    .subscription-message h3 {
      color: var(--ion-color-warning);
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    
    .subscription-message p {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0;
    }
    
    .subscription-btn {
      margin-top: 8px;
      --border-radius: 8px;
    }
    
    /* Back button styling */
    .back-button {
      --color: var(--ion-color-primary);
      --padding-start: 8px;
      --padding-end: 8px;
    }
    
    .back-button ion-icon {
      font-size: 24px;
    }
    
    /* Ensure toolbar buttons are visible */
    ion-buttons[slot="start"] {
      display: flex;
      align-items: center;
    }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonItem, IonLabel, IonInput, IonBackButton,
    IonButtons, IonList, IonTextarea, IonToggle, IonSelect, IonSelectOption,
    IonAvatar, IonImg, IonGrid, IonRow, IonCol, IonAlert,
    ReactiveFormsModule
  ],
  standalone: true
})
export class DoctorProfilePage implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  saving = false;
  avatarUrl: string | null = null;
  currentUser: User | null = null;
  hasVideoConsultationAccess = false;
  private sub?: any;

  constructor(
    private fb: FormBuilder,
    private firebase: FirebaseService,
    private auth: AuthService,
    public router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ personOutline, settingsOutline, cameraOutline, saveOutline, logOutOutline, videocamOffOutline, mailOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.buildForm();
    this.currentUser = this.auth.getCurrentUser();
    const uid = this.currentUser?.uid;
    if (!uid) return;
    this.sub = this.firebase.getUserById(uid).subscribe((u: UserData | null) => {
      if (!u) return;
      this.avatarUrl = u.avatar || null;
      this.hasVideoConsultationAccess = u.videoConsultationAccess || false;
      
      this.form.patchValue({
        name: u.name || '',
        specialization: u.specialization || '',
        experience: u.experience ?? '',
        regNumber: u.regNumber || '',
        bio: u.bio || '',
        languagesText: (u.languages || []).join(', '),
        phone: u.phone || '',
        email: u.email || '',
        clinicName: u.clinicDetails?.name || '',
        addressLine: u.clinicDetails?.address?.line || '',
        city: u.clinicDetails?.address?.city || '',
        state: u.clinicDetails?.address?.state || '',
        pincode: u.clinicDetails?.address?.pincode || '',
        mapsUrl: u.clinicDetails?.mapsUrl || '',
        showPhone: u.showPhone ?? true,
        videoEnabled: this.hasVideoConsultationAccess ? (u.consultation?.videoEnabled ?? false) : false,
        clinicEnabled: u.consultation?.clinicEnabled ?? true,
        videoFee: u.consultation?.videoFee ?? '',
        clinicFee: u.consultation?.clinicFee ?? '',
        acceptOnline: (u.consultation?.paymentMethods || []).includes('online'),
        acceptCash: (u.consultation?.paymentMethods || []).includes('cash'),
      });
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe?.();
  }

  goBack() {
  this.router.navigate(['/doctor/dashboard']);
}

  private buildForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      specialization: ['', Validators.required],
      experience: ['', [Validators.required, Validators.min(0)]],
      regNumber: ['', Validators.required],
      bio: ['',[Validators.maxLength(500)]],
      languagesText: [''],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      clinicName: [''],
      addressLine: [''],
      city: [''],
      state: [''],
      pincode: [''],
      mapsUrl: [''],
      showPhone: [true],
      videoEnabled: [false],
      clinicEnabled: [true],
      videoFee: [''],
      clinicFee: [''],
      acceptOnline: [true],
      acceptCash: [true]
    });
  }

  triggerFile() {
    this.fileInput?.nativeElement?.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.currentUser?.uid) return;
    // Basic size check (<= 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Please select an image under 2MB.');
      input.value = '';
      return;
    }
    this.saving = true;
    try {
      const url = await this.firebase.uploadFile(file, `avatars/${this.currentUser.uid}.jpg`);
      this.avatarUrl = url;
      await this.firebase.updateUserProfile(this.currentUser.uid, { avatar: url });
    } catch (e) {
      console.error(e);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      this.saving = false;
    }
  }

  private parseLanguages(text: string | null | undefined): string[] {
    return (text || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  async save() {
    if (this.form.invalid || !this.currentUser?.uid) return;
    this.saving = true;
    const v = this.form.value;
    const paymentMethods: ('online' | 'cash')[] = [
      v.acceptOnline ? 'online' : null,
      v.acceptCash ? 'cash' : null
    ].filter(Boolean) as any;

    const data: Partial<UserData> = {
      name: v.name,
      specialization: v.specialization,
      experience: Number(v.experience) || 0,
      regNumber: v.regNumber,
      bio: v.bio,
      languages: this.parseLanguages(v.languagesText),
      phone: v.phone,
      email: v.email,
      showPhone: !!v.showPhone,
      clinicDetails: {
        name: v.clinicName,
        address: {
          line: v.addressLine,
          city: v.city,
          state: v.state,
          pincode: v.pincode
        },
        mapsUrl: v.mapsUrl
      },
      consultation: {
        videoEnabled: this.hasVideoConsultationAccess ? !!v.videoEnabled : false,
        clinicEnabled: !!v.clinicEnabled,
        videoFee: (this.hasVideoConsultationAccess && v.videoEnabled) ? Number(v.videoFee) || 0 : 0,
        clinicFee: v.clinicEnabled ? Number(v.clinicFee) || 0 : 0,
        paymentMethods
      },
      updatedAt: new Date()
    } as Partial<UserData>;

    try {
      await this.firebase.updateUserProfile(this.currentUser.uid, data);
      alert('Profile saved');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile. Please try again.');
    } finally {
      this.saving = false;
    }
  }

  async contactAdmin() {
    const alert = await this.alertController.create({
      header: 'Contact Admin',
      message: 'Choose how you would like to contact the admin for video consultation access:',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send Email',
          handler: () => {
            this.sendEmailToAdmin();
          }
        },
        {
          text: 'Copy Request Text',
          handler: () => {
            this.copyRequestText();
          }
        },
        {
          text: 'Call Admin',
          handler: () => {
            this.callAdmin();
          }
        }
      ]
    });

    await alert.present();
  }

  private sendEmailToAdmin() {
    const subject = encodeURIComponent('Request for Video Consultation Access');
    const body = encodeURIComponent(`Dear Admin,

I would like to request access to video consultation features for my doctor profile.

Doctor Details:
- Name: ${this.form.get('name')?.value || 'Not provided'}
- Email: ${this.form.get('email')?.value || 'Not provided'}
- Specialization: ${this.form.get('specialization')?.value || 'Not provided'}
- Registration Number: ${this.form.get('regNumber')?.value || 'Not provided'}

Please enable video consultation access for my account so I can offer online consultations to my patients.

Thank you for your consideration.

Best regards,
Dr. ${this.form.get('name')?.value}`);
    
    // Try multiple email methods
    const emailUrl = `mailto:admin@yourapp.com?subject=${subject}&body=${body}`;
    
    try {
      // For mobile devices, try to open email app
      if (window.navigator && (window.navigator as any).share) {
        (window.navigator as any).share({
          title: 'Request for Video Consultation Access',
          text: decodeURIComponent(body),
          url: 'mailto:admin@yourapp.com'
        });
      } else {
        // Fallback to mailto link
        window.location.href = emailUrl;
      }
    } catch (error) {
      console.error('Error opening email:', error);
      this.showToast('Unable to open email app. Please copy the request text and send manually.', 'warning');
    }
  }

  private async copyRequestText() {
    const requestText = `Dear Admin,

I would like to request access to video consultation features for my doctor profile.

Doctor Details:
- Name: ${this.form.get('name')?.value || 'Not provided'}
- Email: ${this.form.get('email')?.value || 'Not provided'}
- Specialization: ${this.form.get('specialization')?.value || 'Not provided'}
- Registration Number: ${this.form.get('regNumber')?.value || 'Not provided'}

Please enable video consultation access for my account so I can offer online consultations to my patients.

Admin Email: admin@yourapp.com

Thank you for your consideration.

Best regards,
Dr. ${this.form.get('name')?.value}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(requestText);
        this.showToast('Request text copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = requestText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showToast('Request text copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error copying text:', error);
      this.showToast('Unable to copy text. Please manually copy the request details.', 'danger');
    }
  }

  private callAdmin() {
    // Replace with actual admin phone number
    const adminPhone = '+91-XXXXXXXXXX'; // Update this with actual admin number
    const phoneUrl = `tel:${adminPhone}`;
    
    try {
      window.location.href = phoneUrl;
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      this.showToast(`Please call admin at: ${adminPhone}`, 'primary');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout. Please try again.');
    }
  }
}
