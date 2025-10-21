import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { ScheduleService, DoctorSchedule } from '../../../services/schedule.service';
import { AppointmentService } from '../../../services/appointment.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonItem,
  IonLabel, IonTextarea, IonBackButton, IonButtons, IonNote, IonSpinner,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar, arrowBack, calendarOutline, timeOutline,
  personOutline, documentTextOutline
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

@Component({
  selector: 'app-reschedule-appointment',
  templateUrl: './reschedule-appointment.page.html',
  styleUrls: ['./reschedule-appointment.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
    IonText, IonItem, IonLabel, IonTextarea, IonBackButton, IonButtons, IonNote, IonSpinner
  ]
})
export class RescheduleAppointmentPage implements OnInit {
  appointment: any = null;
  selectedDate: string = '';
  selectedTime: TimeSlot | null = null;
  rescheduleForm!: FormGroup;
  isLoading = false;
  isLoadingSchedule = true;
  private schedule: DoctorSchedule | null = null;
  private doctorAppointments: any[] = [];

  availableDates: DateOption[] = [];
  timeSlots: TimeSlot[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private appointmentService: AppointmentService,
    private toastController: ToastController,
    private alertController: AlertController,
    private scheduleService: ScheduleService
  ) {
    addIcons({
      calendar, arrowBack, calendarOutline, timeOutline,
      personOutline, documentTextOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.loadAppointmentDetails();
  }

  initializeForm() {
    this.rescheduleForm = this.fb.group({
      reason: ['', [Validators.maxLength(500)]]
    });
  }

  async loadAppointmentDetails() {
    const appointmentId = this.route.snapshot.paramMap.get('appointmentId');

    if (appointmentId) {
      try {
        // Get appointment details
        this.firebaseService.getAppointmentById(appointmentId).subscribe({
          next: (appointment) => {
            if (appointment) {
              this.appointment = appointment;
              this.loadDoctorSchedule();
            } else {
              this.showToast('Appointment not found', 'danger');
              this.router.navigate(['/patient/appointments']);
            }
          },
          error: (error) => {
            console.error('Error loading appointment:', error);
            this.showToast('Failed to load appointment details', 'danger');
            this.router.navigate(['/patient/appointments']);
          }
        });
      } catch (error) {
        console.error('Error loading appointment:', error);
        this.showToast('Failed to load appointment details', 'danger');
        this.router.navigate(['/patient/appointments']);
      }
    }
  }

  async loadDoctorSchedule() {
    if (!this.appointment?.doctorId) return;

    try {
      // Subscribe to doctor's schedule
      this.scheduleService.getSchedule(this.appointment.doctorId).subscribe(s => {
        this.schedule = s;
        this.isLoadingSchedule = false;
        this.generateAvailableDates();
      });

      // Subscribe to doctor's appointments to mark booked slots
      this.firebaseService.getAppointmentsByDoctor(this.appointment.doctorId).subscribe(apps => {
        this.doctorAppointments = apps;
        if (this.selectedDate) {
          this.generateTimeSlots();
        }
      });
    } catch (error) {
      console.error('Error loading doctor schedule:', error);
      this.isLoadingSchedule = false;
    }
  }

  private getDayKey(d: Date): string {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
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

  generateAvailableDates() {
    const dates = [];
    const today = new Date();
    
    // Start from tomorrow (can't reschedule for today)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Look ahead for up to 30 days to find available dates
    for (let i = 0; i < 30; i++) {
      const date = new Date(tomorrow);
      date.setDate(tomorrow.getDate() + i);

      const dayKey = this.getDayKey(date);
      const dateString = date.toISOString().split('T')[0];

      // Skip the current appointment date
      if (this.appointment && dateString === new Date(this.appointment.date).toISOString().split('T')[0]) {
        continue;
      }

      // Check if this day is enabled in the doctor's schedule
      let isEnabled = false;

      if (this.schedule?.weekly && (this.schedule.weekly as any)[dayKey]) {
        isEnabled = (this.schedule.weekly as any)[dayKey].enabled === true;
      }

      // Check for exceptions on this specific date
      const exception = this.schedule?.exceptions?.find(ex => ex.date === dateString);
      if (exception) {
        isEnabled = !exception.closed;
      }

      // Only add dates that are enabled
      if (isEnabled) {
        dates.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate().toString(),
          value: dateString
        });

        // Stop after finding 7 available dates
        if (dates.length >= 7) break;
      }
    }

    this.availableDates = dates;
  }

  generateTimeSlots() {
    if (!this.selectedDate || !this.appointment) {
      this.timeSlots = [];
      return;
    }

    // Determine day schedule
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

    // Mark booked slots for selected date (excluding current appointment)
    const selectedISO = this.selectedDate;
    const bookedTimes = new Set(
      this.doctorAppointments
        .filter(a => 
          new Date(a.date).toISOString().split('T')[0] === selectedISO && 
          a.status !== 'cancelled' &&
          a.id !== this.appointment.id // Exclude current appointment
        )
        .map(a => a.time)
    );

    this.timeSlots = slots.map(s => ({ ...s, booked: bookedTimes.has(s.time) }));
  }

  selectDate(date: string) {
    this.selectedDate = date;
    this.selectedTime = null;
    this.generateTimeSlots();
  }

  selectTime(slot: TimeSlot) {
    if (!slot.booked) {
      this.selectedTime = slot;
    }
  }

  canReschedule(): boolean {
    return !!this.selectedDate && !!this.selectedTime && this.rescheduleForm.valid;
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

  async rescheduleAppointment() {
    if (!this.canReschedule()) {
      const toast = await this.toastController.create({
        message: 'Please select a new date and time',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Reschedule',
      message: `Reschedule appointment to ${this.getFormattedDate(this.selectedDate)} at ${this.selectedTime?.time}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            this.confirmReschedule();
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmReschedule() {
    this.isLoading = true;

    try {
      const formData = this.rescheduleForm.value;

      await this.appointmentService.rescheduleAppointment({
        appointmentId: this.appointment.id,
        newDate: new Date(this.selectedDate),
        newTime: this.selectedTime?.time || '',
        reason: formData.reason || 'Patient requested reschedule'
      });

      const toast = await this.toastController.create({
        message: 'Appointment rescheduled successfully! Waiting for doctor approval.',
        duration: 3000,
        color: 'success',
        position: 'top'
      });

      await toast.present();

      // Navigate back to appointments
      setTimeout(() => {
        this.router.navigate(['/patient/appointments'], {
          replaceUrl: true
        });
      }, 2000);

    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      const errorMessage = error.message || 'Failed to reschedule appointment. Please try again.';

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

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/patient/appointments']);
  }
}