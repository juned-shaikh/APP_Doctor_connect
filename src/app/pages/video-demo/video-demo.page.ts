import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonItem, IonLabel, IonInput, IonButtons, IonBackButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { videocamOutline, callOutline, personOutline, arrowBack } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-video-demo',
  templateUrl: './video-demo.page.html',
  styleUrls: ['./video-demo.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardContent, IonButton, IonIcon, IonText, IonItem, IonLabel,
    IonInput, IonButtons, IonBackButton
  ]
})
export class VideoDemoPage implements OnInit {
  appointmentId: string = '';
  isCreating: boolean = false;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private toastController: ToastController
  ) {
    addIcons({ videocamOutline, callOutline, personOutline, arrowBack });
  }

  ngOnInit() {}

  async createDemoAppointment() {
    if (!this.appointmentId.trim()) {
      this.showToast('Please enter an appointment ID');
      return;
    }

    this.isCreating = true;

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.showToast('Please login first');
        this.router.navigate(['/auth/login']);
        return;
      }

      // Create a demo video appointment
      const appointmentData = {
        doctorId: 'demo-doctor-id',
        doctorName: 'Dr. Demo Doctor',
        patientId: currentUser.uid,
        patientName: 'Demo Patient',
        patientPhone: '1234567890',
        patientAge: 30,
        patientGender: 'Not specified',
        appointmentType: 'video' as const,
        symptoms: 'Demo consultation for video call testing',
        paymentMethod: 'cash' as const,
        paymentStatus: 'pending' as const,
        date: new Date(),
        time: new Date().toLocaleTimeString(),
        fee: 0, // Free video consultation
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.firebaseService.createAppointment(appointmentData);
      
      this.showToast('Demo appointment created! Joining video call...', 'success');
      
      // Navigate to video consultation
      setTimeout(() => {
        this.router.navigate(['/video-consultation', this.appointmentId]);
      }, 1000);

    } catch (error) {
      console.error('Error creating demo appointment:', error);
      this.showToast('Failed to create demo appointment', 'danger');
    } finally {
      this.isCreating = false;
    }
  }

  joinExistingCall() {
    if (!this.appointmentId.trim()) {
      this.showToast('Please enter an appointment ID');
      return;
    }

    this.router.navigate(['/video-consultation', this.appointmentId]);
  }

  private async showToast(message: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}