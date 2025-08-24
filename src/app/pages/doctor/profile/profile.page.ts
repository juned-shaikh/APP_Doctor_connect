import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonItem, IonLabel, IonInput, IonBackButton,
  IonButtons, IonList, IonTextarea, IonToggle, IonSelect, IonSelectOption,
  IonAvatar, IonImg, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, settingsOutline, cameraOutline, saveOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseService, UserData } from '../../../services/firebase.service';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-doctor-profile',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/doctor/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile Settings</ion-title>
        <ion-buttons slot="end">
          <ion-button [disabled]="saving || form.invalid" (click)="save()">
            <ion-icon name="save-outline"></ion-icon>
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
                      <ion-img [src]="avatarUrl || 'assets/avatar-placeholder.png'"></ion-img>
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
                <ion-item>
                  <ion-label>Video Consultation</ion-label>
                  <ion-toggle slot="end" formControlName="videoEnabled"></ion-toggle>
                </ion-item>
                <ion-item>
                  <ion-label position="stacked">Video Fee</ion-label>
                  <ion-input type="number" formControlName="videoFee" [disabled]="!form.get('videoEnabled')?.value"></ion-input>
                </ion-item>
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
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonItem, IonLabel, IonInput, IonBackButton,
    IonButtons, IonList, IonTextarea, IonToggle, IonSelect, IonSelectOption,
    IonAvatar, IonImg, IonGrid, IonRow, IonCol,
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
  private sub?: any;

  constructor(
    private fb: FormBuilder,
    private firebase: FirebaseService,
    private auth: AuthService
  ) {
    addIcons({ personOutline, settingsOutline, cameraOutline, saveOutline });
  }

  ngOnInit() {
    this.buildForm();
    this.currentUser = this.auth.getCurrentUser();
    const uid = this.currentUser?.uid;
    if (!uid) return;
    this.sub = this.firebase.getUserById(uid).subscribe((u: UserData | null) => {
      if (!u) return;
      this.avatarUrl = u.avatar || null;
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
        videoEnabled: u.consultation?.videoEnabled ?? false,
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
        videoEnabled: !!v.videoEnabled,
        clinicEnabled: !!v.clinicEnabled,
        videoFee: v.videoEnabled ? Number(v.videoFee) || 0 : 0,
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
}
