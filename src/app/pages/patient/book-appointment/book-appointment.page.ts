import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { ScheduleService, DoctorSchedule } from '../../../services/schedule.service';
import { AppointmentService } from '../../../services/appointment.service';
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
  booked: boolean;
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
  videoConsultationFee?: number;
  videoConsultationEnabled?: boolean;
  videoConsultationAccess?: boolean;
  rating?: number;
  reviewCount?: number;
  experience?: number;
  avatar?: string;
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
  // Core data
  selectedDoctor: Doctor | null = null;
  schedule: DoctorSchedule | null = null;
  appointments: any[] = [];
  
  // UI state
  selectedDate: string = '';
  selectedTime: TimeSlot | null = null;
  availableDates: DateOption[] = [];
  timeSlots: TimeSlot[] = [];
  bookingForm!: FormGroup;
  isLoading = false;
  isLoadingSchedule = true;

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
      calendar, personCircle, star, arrowBack, calendarOutline, timeOutline,
      cashOutline, personOutline, documentTextOutline, cardOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.loadDoctorData();
  }

  private initializeForm() {
    this.bookingForm = this.fb.group({
      patientName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      appointmentType: ['clinic', Validators.required],
      paymentMethod: ['cash', Validators.required]
    });
  }

  private async loadDoctorData() {
    const doctorId = this.route.snapshot.paramMap.get('doctorId');
    if (!doctorId) {
      this.showToast('Doctor not found', 'danger');
      return;
    }

    try {
      // Load doctor details
      this.firebaseService.getUserById(doctorId).subscribe(doctor => {
        if (doctor && doctor.role === 'doctor') {
          this.selectedDoctor = {
            id: doctor.uid,
            name: doctor.name,
            specialization: doctor.specialization || 'General Medicine',
            consultationFee: doctor.consultationFee || 500,
            videoConsultationFee: doctor.consultation?.videoFee || 0,
            videoConsultationEnabled: doctor.consultation?.videoEnabled || false,
            videoConsultationAccess: doctor.videoConsultationAccess || false,
            rating: doctor.rating || 4.5,
            reviewCount: doctor.reviewCount || 0,
            experience: doctor.experience || 5,
            avatar: doctor.avatar
          };
        }
      });

      // Load doctor's schedule
      this.scheduleService.getSchedule(doctorId).subscribe(schedule => {
        this.schedule = schedule;
        this.isLoadingSchedule = false;
        this.generateAvailableDates();
      });

      // Load doctor's appointments
      this.firebaseService.getAppointmentsByDoctor(doctorId).subscribe(appointments => {
        this.appointments = appointments;
        if (this.selectedDate) {
          this.generateTimeSlots();
        }
      });

    } catch (error) {
      console.error('Error loading doctor data:', error);
      this.showToast('Error loading doctor information', 'danger');
    }
  }

  private generateAvailableDates() {
    if (!this.schedule) return;

    const dates: DateOption[] = [];
    const today = new Date();
    
    // Look for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      const dayName = this.getDayName(date);
      const dateString = this.formatDateString(date);
      
      // Check if this day is enabled in schedule
      if (this.isDayEnabled(dayName, dateString)) {
        dates.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate().toString(),
          value: dateString
        });
        
        // Stop after 7 available dates
        if (dates.length >= 7) break;
      }
    }
    
    this.availableDates = dates;
  }

  private getDayName(date: Date): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getDay()];
  }

  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isDayEnabled(dayName: string, dateString: string): boolean {
    if (!this.schedule?.weekly) return false;
    
    const daySchedule = (this.schedule.weekly as any)[dayName];
    if (!daySchedule || !daySchedule.enabled) return false;
    
    // Check for exceptions
    const exception = this.schedule.exceptions?.find(ex => ex.date === dateString);
    if (exception && exception.closed) return false;
    
    return true;
  }

  selectDate(dateValue: string) {
    this.selectedDate = dateValue;
    this.selectedTime = null;
    this.generateTimeSlots();
  }

  private generateTimeSlots() {
    if (!this.selectedDate || !this.schedule) {
      this.timeSlots = [];
      return;
    }

    const date = new Date(this.selectedDate + 'T00:00:00');
    const dayName = this.getDayName(date);
    const daySchedule = (this.schedule.weekly as any)[dayName];
    
    if (!daySchedule || !daySchedule.enabled) {
      this.timeSlots = [];
      return;
    }

    // Get schedule times
    const startTime = daySchedule.start || '10:00';
    const endTime = daySchedule.end || '14:00';
    const slotDuration = this.schedule.slotMinutes || 10;

    // Generate time slots
    const slots = this.generateSlots(startTime, endTime, slotDuration);
    
    // Mark booked slots
    const bookedTimes = this.getBookedTimes(this.selectedDate);
    
    this.timeSlots = slots.map(time => ({
      time,
      booked: bookedTimes.has(time)
    }));
  }

  private generateSlots(startTime: string, endTime: string, duration: number): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    
    for (let minutes = start; minutes < end; minutes += duration) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const time12 = this.convertTo12Hour(hour, min);
      slots.push(time12);
    }
    
    return slots;
  }

  private convertTo12Hour(hour: number, minute: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const minStr = minute.toString().padStart(2, '0');
    return `${hour12}:${minStr} ${ampm}`;
  }

  private getBookedTimes(dateString: string): Set<string> {
    const bookedTimes = new Set<string>();
    
    this.appointments.forEach(appointment => {
      if (appointment.status === 'cancelled') return;
      
      const appointmentDate = this.getAppointmentDateString(appointment.date);
      if (appointmentDate === dateString) {
        bookedTimes.add(appointment.time);
      }
    });
    
    return bookedTimes;
  }

  private getAppointmentDateString(date: any): string {
    if (!date) return '';
    
    if (date instanceof Date) {
      return this.formatDateString(date);
    }
    
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    
    if (date.toDate && typeof date.toDate === 'function') {
      return this.formatDateString(date.toDate());
    }
    
    return '';
  }

  selectTime(slot: TimeSlot) {
    if (!slot.booked) {
      this.selectedTime = slot;
    }
  }

  // Getters for template
  get dayWindow(): { start: string; end: string; enabled: boolean } | null {
    if (!this.selectedDate || !this.schedule) return null;
    
    const date = new Date(this.selectedDate + 'T00:00:00');
    const dayName = this.getDayName(date);
    const daySchedule = (this.schedule.weekly as any)[dayName];
    
    if (!daySchedule) return { start: '10:00', end: '14:00', enabled: false };
    
    return {
      start: daySchedule.start || '10:00',
      end: daySchedule.end || '14:00',
      enabled: daySchedule.enabled || false
    };
  }

  get slotDurationMinutes(): number {
    return this.schedule?.slotMinutes || 10;
  }

  get bookedCountForSelectedDate(): number {
    if (!this.selectedDate) return 0;
    return this.getBookedTimes(this.selectedDate).size;
  }

  get maxPatientsForSelectedDate(): number | null {
    if (!this.selectedDate || !this.schedule) return null;
    
    const date = new Date(this.selectedDate + 'T00:00:00');
    const dayName = this.getDayName(date);
    const daySchedule = (this.schedule.weekly as any)[dayName];
    
    return daySchedule?.maxPatients || null;
  }

  get remainingCapacityForSelectedDate(): number | null {
    const max = this.maxPatientsForSelectedDate;
    if (max === null) return null;
    return Math.max(0, max - this.bookedCountForSelectedDate);
  }

  canBookAppointment(): boolean {
    return this.bookingForm.valid && !!this.selectedDate && !!this.selectedTime;
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getConsultationFee(): number {
    if (!this.selectedDoctor) return 0;
    const appointmentType = this.bookingForm?.get('appointmentType')?.value;
    if (appointmentType === 'video') {
      return this.selectedDoctor.videoConsultationFee || 0;
    }
    return this.selectedDoctor.consultationFee || 500;
  }

  isVideoConsultationAvailable(): boolean {
    return !!(this.selectedDoctor?.videoConsultationAccess && this.selectedDoctor?.videoConsultationEnabled);
  }

  async bookAppointment() {
    if (!this.canBookAppointment()) {
      this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Appointment',
      message: `Book appointment with ${this.selectedDoctor?.name} on ${this.getFormattedDate(this.selectedDate)} at ${this.selectedTime?.time}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', handler: () => this.confirmBooking() }
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

      const appointmentData = {
        doctorId: this.selectedDoctor?.id || '',
        doctorName: this.selectedDoctor?.name || '',
        patientId: currentUser.uid,
        patientName: formData.patientName,
        patientPhone: formData.phone,
        patientAge: Number(formData.age),
        patientGender: 'Not specified',
        appointmentType: formData.appointmentType as 'clinic' | 'video',
        symptoms: 'No symptoms specified',
        paymentMethod: formData.paymentMethod as 'cash' | 'online',
        paymentStatus: 'pending' as const,
        date: new Date(this.selectedDate + 'T00:00:00'),
        time: this.selectedTime?.time || '',
        fee: this.getConsultationFee(),
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.appointmentService.bookAppointment(appointmentData);
      
      this.showToast('Appointment booked successfully!', 'success');
      
      setTimeout(() => {
        this.router.navigate(['/patient/dashboard'], { replaceUrl: true });
      }, 2000);

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      this.showToast(error.message || 'Failed to book appointment', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  handleBackButton(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      if (currentUser.userType === 'patient' || currentUser.role === 'patient') {
        this.router.navigate(['/patient/dashboard']);
      } else if (currentUser.userType === 'doctor' || currentUser.role === 'doctor') {
        this.router.navigate(['/doctor/dashboard']);
      } else {
        this.router.navigate(['/auth/login']);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  onDoctorImageError() {
    if (this.selectedDoctor) {
      this.selectedDoctor.avatar = undefined;
    }
  }

  onNumberKeyPress(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if ([8, 9, 27, 13, 46].indexOf(charCode) !== -1 ||
        (charCode === 65 && event.ctrlKey === true) ||
        (charCode === 67 && event.ctrlKey === true) ||
        (charCode === 86 && event.ctrlKey === true) ||
        (charCode === 88 && event.ctrlKey === true)) {
      return true;
    }
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onAgeInput(event: any) {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    const limitedValue = numericValue.substring(0, 3);
    let age = parseInt(limitedValue);
    if (age > 120) age = 120;
    const finalValue = age ? age.toString() : limitedValue;
    if (finalValue !== value) {
      this.bookingForm.patchValue({ age: finalValue });
    }
  }

  onPhoneInput(event: any) {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    const limitedValue = numericValue.substring(0, 15);
    if (limitedValue !== value) {
      this.bookingForm.patchValue({ phone: limitedValue });
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}