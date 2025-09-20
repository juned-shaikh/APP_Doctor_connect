import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, UserData, AppointmentData as FirebaseAppointmentData } from '../../../services/firebase.service';
import { ScheduleService, DoctorSchedule } from '../../../services/schedule.service';
import { AppointmentService } from '../../../services/appointment.service';
import { NotificationService } from '../../../services/notification.service';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonItem,
  IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonRadio,
  IonRadioGroup, IonCheckbox, IonBackButton, IonButtons, IonNote, IonSpinner,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendar, personCircle, star, arrowBack, calendarOutline, timeOutline, 
  cashOutline, personOutline, documentTextOutline, cardOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';

interface TimeSlot {
  time: string;
  booked?: boolean;
}

interface DateOption {
  day: string;
  date: string;
  value: string;
}

interface Doctor {
  id?: string;
  name?: string;
  specialization?: string;
  consultationFee?: number;
  rating?: number;
  reviewCount?: number;
  experience?: number;
}

interface BookingFormData {
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  symptoms: string;
  paymentMethod: string;
}

@Component({
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.page.html',
  styleUrls: ['./book-appointment.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, 
    IonText, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, 
    IonRadio, IonRadioGroup, IonCheckbox, IonBackButton, IonButtons, IonNote, IonSpinner
  ]
})
export class BookAppointmentPage implements OnInit {
  selectedDoctor: Doctor | null = null;
  selectedDate: string = '';
  selectedTime: TimeSlot | null = null;
  bookingForm!: FormGroup;
  isLoading = false;
  private schedule: DoctorSchedule | null = null;
  private doctorAppointments: any[] = [];
  
  appointmentData: BookingFormData = {
    patientName: '',
    age: 0,
    gender: '',
    phone: '',
    symptoms: '',
    paymentMethod: ''
  };

  availableDates: DateOption[] = [];
  timeSlots: TimeSlot[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private appointmentService: AppointmentService,
    private notificationService: NotificationService,
    private toastController: ToastController,
    private alertController: AlertController,
    private scheduleService: ScheduleService
  ) {
    addIcons({ 
      calendar, personCircle, star, arrowBack, calendarOutline, timeOutline,
      cashOutline, personOutline, documentTextOutline, cardOutline
    });
  }

  private getDayKey(d: Date): string {
    const keys = ['sun','mon','tue','wed','thu','fri','sat'];
    return keys[d.getDay()];
  }

  private to12h(d: Date): string {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const mm = minutes < 10 ? '0' + minutes : minutes.toString();
    const hh = hours < 10 ? (hours).toString() : hours.toString();
    return `${hh}:${mm} ${ampm}`;
  }

  // Live availability helpers for template
  get slotDurationMinutes(): number {
    return this.schedule?.slotMinutes || 10;
  }

  get dayWindow(): { start: string; end: string; enabled: boolean } | null {
    if (!this.selectedDate) return null;
    const dayKey = this.getDayKey(new Date(this.selectedDate));
    let start = '10:00', end = '14:00';
    let enabled = true;
    if (this.schedule?.weekly && (this.schedule.weekly as any)[dayKey]) {
      const d = (this.schedule.weekly as any)[dayKey];
      enabled = d.enabled !== false;
      start = d.start || start;
      end = d.end || end;
    }
    const ex = this.schedule?.exceptions?.find(e => e.date === this.selectedDate);
    if (ex) {
      if (ex.closed) enabled = false;
      else {
        start = ex.start || start;
        end = ex.end || end;
      }
    }
    return { start, end, enabled };
  }

  get bookedCountForSelectedDate(): number {
    if (!this.selectedDate) return 0;
    const selectedISO = this.selectedDate;
    return this.doctorAppointments.filter(a => new Date(a.date).toISOString().split('T')[0] === selectedISO && a.status !== 'cancelled').length;
  }

  get maxPatientsForSelectedDate(): number | null {
    if (!this.selectedDate) return null;
    const dayKey = this.getDayKey(new Date(this.selectedDate));
    const d = this.schedule?.weekly && (this.schedule.weekly as any)[dayKey];
    return d?.maxPatients ?? null;
  }

  get remainingCapacityForSelectedDate(): number | null {
    const max = this.maxPatientsForSelectedDate;
    if (max == null) return null;
    return Math.max(0, max - this.bookedCountForSelectedDate);
  }

  ngOnInit() {
    this.initializeForm();
    this.loadDoctorDetails();
    this.generateAvailableDates();
    this.generateTimeSlots();
  }

  initializeForm() {
    this.bookingForm = this.fb.group({
      patientName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      appointmentType: ['clinic', Validators.required],
      // Gender and symptoms removed as per requirements
      // Keep paymentMethod but default to 'cash'
      paymentMethod: ['cash', Validators.required]
    });
    
    // Add form value changes listener for debugging
    this.bookingForm.valueChanges.subscribe(values => {
      console.log('Form values changed:', values);
      console.log('Form valid:', this.bookingForm.valid);
    });
  }

  async loadDoctorDetails() {
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    
    if (doctorId) {
      try {
        // Fetch doctor details from Firebase
        this.firebaseService.getUserById(doctorId).subscribe({
          next: (doctor) => {
            if (doctor && doctor.role === 'doctor') {
              this.selectedDoctor = {
                id: doctor.uid,
                name: doctor.name,
                specialization: doctor.specialization || 'General Medicine',
                consultationFee: doctor.consultationFee || 500,
                rating: doctor.rating || 4.5,
                reviewCount: doctor.reviewCount || 0,
                experience: doctor.experience || 5
              };

              // Subscribe to doctor's schedule
              this.scheduleService.getSchedule(doctorId).subscribe(s => {
                this.schedule = s;
                // Regenerate slots when schedule arrives/changes
                if (this.selectedDate) {
                  this.generateTimeSlots();
                }
              });

              // Subscribe to doctor's appointments to mark booked slots
              this.firebaseService.getAppointmentsByDoctor(doctorId).subscribe(apps => {
                this.doctorAppointments = apps;
                if (this.selectedDate) {
                  this.generateTimeSlots();
                }
              });
            } else {
              // Fallback to mock data if doctor not found
              this.setMockDoctorData(doctorId);
            }
          },
          error: (error) => {
            console.error('Error loading doctor details:', error);
            this.setMockDoctorData(doctorId);
          }
        });
      } catch (error) {
        console.error('Error loading doctor details:', error);
        this.setMockDoctorData(doctorId);
      }
    }
  }

  private setMockDoctorData(doctorId: string) {
    this.selectedDoctor = {
      id: doctorId,
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiologist',
      consultationFee: 500,
      rating: 4.8,
      reviewCount: 156,
      experience: 10
    };
  }

  generateAvailableDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      dates.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate().toString(),
        value: date.toISOString().split('T')[0]
      });
    }
    
    this.availableDates = dates;
  }

  generateTimeSlots() {
    // If no date or doctor, clear
    if (!this.selectedDate || !this.selectedDoctor) {
      this.timeSlots = [];
      return;
    }

    // Determine day schedule (defaults 10:00–14:00 if none)
    const dayKey = this.getDayKey(new Date(this.selectedDate));
    let start = '10:00';
    let end = '14:00';
    let enabled = true;
    let slotMinutes = this.schedule?.slotMinutes || 10;

    if (this.schedule?.weekly && (this.schedule.weekly as any)[dayKey]) {
      const d = (this.schedule.weekly as any)[dayKey];
      enabled = d.enabled !== false;
      start = d.start || start;
      end = d.end || end;
    }

    // Apply exception for exact date
    const ex = this.schedule?.exceptions?.find(e => e.date === this.selectedDate);
    if (ex) {
      if (ex.closed) {
        enabled = false;
      } else {
        start = ex.start || start;
        end = ex.end || end;
      }
    }

    if (!enabled) {
      this.timeSlots = [];
      return;
    }

    // Build slots at slotMinutes increments
    const slots: TimeSlot[] = [];
    const [sH, sM] = start.split(':').map(n => parseInt(n, 10));
    const [eH, eM] = end.split(':').map(n => parseInt(n, 10));
    const base = new Date(this.selectedDate + 'T00:00:00');
    const startDate = new Date(base);
    startDate.setHours(sH, sM, 0, 0);
    const endDate = new Date(base);
    endDate.setHours(eH, eM, 0, 0);

    for (let t = new Date(startDate); t < endDate; t = new Date(t.getTime() + slotMinutes * 60000)) {
      const label = this.to12h(t);
      slots.push({ time: label, booked: false });
    }

    // Mark booked slots for selected date
    const selectedISO = this.selectedDate;
    const bookedTimes = new Set(
      this.doctorAppointments
        .filter(a => new Date(a.date).toISOString().split('T')[0] === selectedISO && a.status !== 'cancelled')
        .map(a => a.time)
    );

    // Apply capacity limits if configured
    let max = undefined as number | undefined;
    if (this.schedule?.weekly && (this.schedule.weekly as any)[dayKey]) {
      const d = (this.schedule.weekly as any)[dayKey];
      max = d.maxPatients;
    }

    let result = slots.map(s => ({ ...s, booked: bookedTimes.has(s.time) }));
    if (typeof max === 'number' && max > 0) {
      const alreadyBookedCount = result.filter(r => r.booked).length;
      const remaining = Math.max(0, max - alreadyBookedCount);
      if (remaining <= 0) {
        // All capacity consumed; mark all as booked
        result = result.map(r => ({ ...r, booked: true }));
      } else {
        // Allow only first `remaining` unbooked slots; mark the rest as booked
        let allowed = 0;
        result = result.map(r => {
          if (r.booked) return r;
          if (allowed < remaining) {
            allowed++;
            return r;
          }
          return { ...r, booked: true };
        });
      }
    }
    this.timeSlots = result;
  }

  selectDate(date: string) {
    this.selectedDate = date;
    this.selectedTime = null; // Reset time selection
    this.generateTimeSlots();
  }

  selectTime(slot: TimeSlot) {
    if (!slot.booked) {
      this.selectedTime = slot;
    }
  }

  get window(): string {
    if (!this.schedule) return '';
    const dayKey = this.getDayKey(new Date(this.selectedDate));
    const start = this.schedule.weekly && (this.schedule.weekly as any)[dayKey] ? (this.schedule.weekly as any)[dayKey].start : '10:00';
    const end = this.schedule.weekly && (this.schedule.weekly as any)[dayKey] ? (this.schedule.weekly as any)[dayKey].end : '14:00';
    return `${start}–${end}`;
  }

  get slotMinutes(): number {
    return this.schedule?.slotMinutes || 10;
  }

  get bookedCount(): number {
    return this.timeSlots.filter(slot => slot.booked).length;
  }

  get remainingCount(): number {
    const max = this.schedule?.weekly && (this.schedule.weekly as any)[this.getDayKey(new Date(this.selectedDate))] ? (this.schedule.weekly as any)[this.getDayKey(new Date(this.selectedDate))].maxPatients : undefined;
    if (typeof max === 'number' && max > 0) {
      return Math.max(0, max - this.bookedCount);
    }
    return this.timeSlots.length - this.bookedCount;
  }

  canBookAppointment(): boolean {
    if (!this.bookingForm) return false;
    return this.bookingForm.valid && !!this.selectedDate && !!this.selectedTime;
  }
  
  getFormErrors(): any {
    if (!this.bookingForm) return {};
    
    const errors: any = {};
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  async bookAppointment() {
    if (!this.canBookAppointment()) {
      const toast = await this.toastController.create({
        message: 'Please fill in all required fields',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Appointment',
      message: `Book appointment with ${this.selectedDoctor?.name} on ${this.getFormattedDate(this.selectedDate)} at ${this.selectedTime?.time}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.confirmBooking();
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmBooking() {
    this.isLoading = true;
    
    try {
      const formData = this.bookingForm.value;
      
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Create appointment data
      const appointmentData = {
        doctorId: this.selectedDoctor?.id || '',
        doctorName: this.selectedDoctor?.name || '',
        patientId: currentUser.uid,
        patientName: formData.patientName,
        age: formData.age,
        phone: formData.phone,
        appointmentType: formData.appointmentType,
        paymentMethod: formData.paymentMethod,
        date: new Date(this.selectedDate),
        time: this.selectedTime?.time || '',
        fee: this.selectedDoctor?.consultationFee || 0,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Saving appointment:', appointmentData);
      
      // Save to Firebase
      await this.appointmentService.bookAppointment(appointmentData);
      
      const toast = await this.toastController.create({
        message: 'Appointment booked successfully!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      
      await toast.present();
      
      // Wait for toast to be dismissed before navigating
      setTimeout(() => {
        this.router.navigate(['/patient/dashboard'], { 
          replaceUrl: true 
        }).catch(err => {
          console.error('Navigation error:', err);
          // Fallback to root if navigation fails
          this.router.navigate(['/']);
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      const errorMessage = error.message || 'Failed to book appointment. Please try again.';
      
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  // Online payment removed; default is Pay at Clinic (cash)
}
