import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons,
  IonList, IonItem, IonToggle, IonInput, IonLabel, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScheduleService, DoctorSchedule } from '../../../services/schedule.service';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-doctor-schedule',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/doctor/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Schedule</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <div class="schedule-container">
        <ion-card>
          <ion-card-content>
            <div class="schedule-info">
              <ion-icon name="time-outline" size="large" color="primary"></ion-icon>
              <h2>Schedule Management</h2>
              <p>Manage your availability and time slots</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <form [formGroup]="form">
              <ion-list>
                <ion-item>
                  <ion-label position="stacked">Slot Duration (minutes)</ion-label>
                  <ion-input type="number" formControlName="slotMinutes" placeholder="10"></ion-input>
                </ion-item>
              </ion-list>
              <h3>Weekly Availability</h3>
              <ion-list>
                <ng-container *ngFor="let day of weekdays">
                  <ion-item lines="full">
                    <ion-label>{{ day.label }}</ion-label>
                    <ion-toggle slot="end" [formControl]="enabledCtrl(day.key)"></ion-toggle>
                  </ion-item>
                  <div class="time-row" [class.disabled]="!enabledCtrl(day.key).value">
                    <ion-grid>
                      <ion-row>
                        <ion-col size="6">
                          <ion-item>
                            <ion-label position="stacked">Start</ion-label>
                            <ion-input type="time" [formControl]="startCtrl(day.key)" [disabled]="!enabledCtrl(day.key).value"></ion-input>
                          </ion-item>
                        </ion-col>
                        <ion-col size="6">
                          <ion-item>
                            <ion-label position="stacked">End</ion-label>
                            <ion-input type="time" [formControl]="endCtrl(day.key)" [disabled]="!enabledCtrl(day.key).value"></ion-input>
                          </ion-item>
                        </ion-col>
                      </ion-row>
                      <ion-row>
                        <ion-col size="12" sizeMd="6">
                          <ion-item>
                            <ion-label position="stacked">Max Patients (10:00–14:00)</ion-label>
                            <ion-input type="number" [formControl]="capacityCtrl(day.key)" [disabled]="!enabledCtrl(day.key).value" placeholder="e.g. 20"></ion-input>
                          </ion-item>
                        </ion-col>
                      </ion-row>
                    </ion-grid>
                  </div>
                </ng-container>
              </ion-list>

              <h3 style="margin-top:16px">Exceptions</h3>
              <ion-list>
                <div class="exception-header">
                  <ion-button size="small" (click)="addException()">Add Exception</ion-button>
                </div>
                <ng-container formArrayName="exceptions">
                  <div *ngFor="let ex of exceptions.controls; let i = index" [formGroupName]="i" class="exception-item">
                    <ion-grid>
                      <ion-row>
                        <ion-col size="12" sizeMd="3">
                          <ion-item>
                            <ion-label position="stacked">Date</ion-label>
                            <ion-input type="date" formControlName="date"></ion-input>
                          </ion-item>
                        </ion-col>
                        <ion-col size="12" sizeMd="3">
                          <ion-item>
                            <ion-label position="stacked">Closed</ion-label>
                            <ion-toggle formControlName="closed"></ion-toggle>
                          </ion-item>
                        </ion-col>
                        <ion-col size="12" sizeMd="3">
                          <ion-item>
                            <ion-label position="stacked">Start</ion-label>
                            <ion-input type="time" formControlName="start" [disabled]="ex.get('closed')?.value"></ion-input>
                          </ion-item>
                        </ion-col>
                        <ion-col size="12" sizeMd="3">
                          <ion-item>
                            <ion-label position="stacked">End</ion-label>
                            <ion-input type="time" formControlName="end" [disabled]="ex.get('closed')?.value"></ion-input>
                          </ion-item>
                        </ion-col>
                      </ion-row>
                      <ion-row>
                        <ion-col size="12">
                          <ion-button color="danger" fill="clear" size="small" (click)="removeException(i)">Remove</ion-button>
                        </ion-col>
                      </ion-row>
                    </ion-grid>
                  </div>
                </ng-container>
              </ion-list>

              <div class="actions">
                <ion-button expand="block" fill="outline" color="medium" (click)="initializeDefaults()" [disabled]="saving">Initialize Default Schedule</ion-button>
                <ion-button expand="block" color="primary" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Schedule' }}</ion-button>
              </div>
            </form>
          </ion-card-content>
        </ion-card>

      </div>
    </ion-content>
  `,
  styles: [`
    .schedule-container {
      padding: 1rem;
    }
    .schedule-info {
      text-align: center;
      padding: 2rem;
    }
    .schedule-info h2 {
      margin: 1rem 0 0.5rem 0;
    }
    .time-row.disabled { opacity: 0.6; }
    .exception-item { border: 1px solid #eee; border-radius: 8px; padding: 8px; margin: 8px 0; }
    .exception-header { display: flex; justify-content: flex-end; margin-bottom: 8px; }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonBackButton, IonButtons,
    IonList, IonItem, IonToggle, IonInput, IonLabel, IonGrid, IonRow, IonCol,
    ReactiveFormsModule
  ],
  standalone: true
})
export class DoctorSchedulePage implements OnInit {
  form: FormGroup;
  saving = false;
  currentUser: User | null = null;

  weekdays = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' }
  ];

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private authService: AuthService
  ) {
    addIcons({ timeOutline });
    this.form = this.fb.group({
      slotMinutes: [10],
      weekly: this.fb.group({
        mon: this.dayGroup(),
        tue: this.dayGroup(),
        wed: this.dayGroup(),
        thu: this.dayGroup(),
        fri: this.dayGroup(),
        sat: this.dayGroup(),
        sun: this.dayGroup()
      }),
      exceptions: this.fb.array([])
    });
  }

  ngOnInit() {
    // Keep currentUser in sync with auth state
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      const uid = user?.uid;
      if (!uid) return;
      // Subscribe to schedule once user is available
      this.scheduleService.getSchedule(uid).subscribe(s => {
        if (s) {
          this.patchForm(s);
        }
      });
    });
  }

  weeklyCtrl(key: string): FormGroup {
    return this.form.get('weekly.' + key) as FormGroup;
  }

  enabledCtrl(key: string): FormControl<any> {
    return this.weeklyCtrl(key).get('enabled') as FormControl<any>;
  }

  startCtrl(key: string): FormControl<any> {
    return this.weeklyCtrl(key).get('start') as FormControl<any>;
  }

  endCtrl(key: string): FormControl<any> {
    return this.weeklyCtrl(key).get('end') as FormControl<any>;
  }

  capacityCtrl(key: string): FormControl<any> {
    return this.weeklyCtrl(key).get('maxPatients') as FormControl<any>;
  }

  get exceptions(): FormArray {
    return this.form.get('exceptions') as FormArray;
  }

  addException() {
    this.exceptions.push(this.fb.group({
      date: ['', Validators.required],
      closed: [false],
      start: ['10:00'],
      end: ['14:00']
    }));
  }

  removeException(index: number) {
    this.exceptions.removeAt(index);
  }

  async save() {
    if (!this.currentUser?.uid) return;
    this.saving = true;
    const value = this.form.value as DoctorSchedule;
    try {
      await this.scheduleService.saveSchedule(this.currentUser.uid, value);
    } finally {
      this.saving = false;
    }
  }

  async initializeDefaults() {
    if (!this.currentUser?.uid) return;
    const defaultSchedule: DoctorSchedule = {
      slotMinutes: 10,
      weekly: {
        mon: { enabled: true, start: '10:00', end: '14:00', maxPatients: 20 },
        tue: { enabled: true, start: '10:00', end: '14:00', maxPatients: 20 },
        wed: { enabled: true, start: '10:00', end: '14:00', maxPatients: 20 },
        thu: { enabled: true, start: '10:00', end: '14:00', maxPatients: 20 },
        fri: { enabled: true, start: '10:00', end: '14:00', maxPatients: 20 },
        sat: { enabled: true, start: '10:00', end: '14:00', maxPatients: 20 },
        sun: { enabled: false, start: '10:00', end: '14:00', maxPatients: 20 }
      },
      exceptions: []
    } as DoctorSchedule;

    this.saving = true;
    try {
      await this.scheduleService.saveSchedule(this.currentUser.uid, defaultSchedule);
      // Patch the form so UI reflects the saved defaults
      this.patchForm(defaultSchedule);
    } finally {
      this.saving = false;
    }
  }

  private dayGroup(): FormGroup {
    return this.fb.group({
      enabled: [false],
      start: ['10:00'],
      end: ['14:00'],
      maxPatients: [20]
    });
  }

  private patchForm(s: DoctorSchedule) {
    // Ensure weekly keys exist
    const weekly = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null } as any;
    for (const key of Object.keys(weekly)) {
      const d = (s.weekly as any)[key];
      if (d) {
        this.weeklyCtrl(key).patchValue(d);
      }
    }
    if (s.slotMinutes) {
      this.form.patchValue({ slotMinutes: s.slotMinutes });
    }
    this.exceptions.clear();
    (s.exceptions || []).forEach(ex => {
      this.exceptions.push(this.fb.group({
        date: [ex.date, Validators.required],
        closed: [ex.closed],
        start: [ex.start || '10:00'],
        end: [ex.end || '14:00']
      }));
    });
  }
}
