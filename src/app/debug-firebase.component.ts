import { Component } from '@angular/core';
import { FirebaseService } from './services/firebase.service';
import { AuthService } from './services/auth.service';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-debug-firebase',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Firebase Debug</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <ion-card>
        <ion-card-content>
          <h2>Current User</h2>
          <p>{{ currentUser | json }}</p>
          
          <ion-button (click)="testFirebaseConnection()" expand="block">
            Test Firebase Connection
          </ion-button>
          
          <ion-button (click)="createSampleAppointment()" expand="block" color="secondary">
            Create Sample Appointment
          </ion-button>
          
          <ion-button (click)="listAllAppointments()" expand="block" color="tertiary">
            List All Appointments
          </ion-button>
          
          <div *ngIf="debugOutput">
            <h3>Debug Output:</h3>
            <pre>{{ debugOutput }}</pre>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  imports: [
    CommonModule,
    IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent
  ],
  standalone: true
})
export class DebugFirebaseComponent {
  currentUser: any = null;
  debugOutput: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  async testFirebaseConnection() {
    try {
      this.debugOutput = 'Testing Firebase connection...\n';
      
      // Test auth
      const user = this.authService.getCurrentUser();
      this.debugOutput += `Current user: ${JSON.stringify(user, null, 2)}\n`;
      
      if (!user) {
        this.debugOutput += 'ERROR: No authenticated user found!\n';
        return;
      }
      
      // Test Firestore read
      this.debugOutput += 'Testing Firestore read...\n';
      const appointments = await new Promise((resolve, reject) => {
        const sub = this.firebaseService.getAppointmentsByDoctor(user.uid).subscribe({
          next: (data) => {
            sub.unsubscribe();
            resolve(data);
          },
          error: (err) => {
            sub.unsubscribe();
            reject(err);
          }
        });
      });
      
      this.debugOutput += `Appointments found: ${JSON.stringify(appointments, null, 2)}\n`;
      
    } catch (error) {
      this.debugOutput += `ERROR: ${JSON.stringify(error, null, 2)}\n`;
    }
  }

  async createSampleAppointment() {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.debugOutput = 'ERROR: No authenticated user found!\n';
        return;
      }

      this.debugOutput = 'Creating sample appointments...\n';
      
      const sampleAppointments = [
        {
          doctorId: user.uid,
          doctorName: user.name || 'Dr. Test',
          patientId: 'sample-patient-1',
          patientName: 'John Doe',
          patientPhone: '+1234567890',
          patientAge: 30,
          patientGender: 'Male',
          appointmentType: 'clinic' as const,
          date: new Date(),
          time: '10:00 AM',
          symptoms: 'Fever and headache',
          status: 'pending' as const,
          paymentMethod: 'cash' as const,
          paymentStatus: 'pending' as const,
          fee: 500,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          doctorId: user.uid,
          doctorName: user.name || 'Dr. Test',
          patientId: 'sample-patient-2',
          patientName: 'Jane Smith',
          patientPhone: '+1234567891',
          patientAge: 25,
          patientGender: 'Female',
          appointmentType: 'video' as const,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          time: '2:00 PM',
          symptoms: 'Regular checkup',
          status: 'confirmed' as const,
          paymentMethod: 'online' as const,
          paymentStatus: 'paid' as const,
          fee: 600,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          doctorId: user.uid,
          doctorName: user.name || 'Dr. Test',
          patientId: 'sample-patient-3',
          patientName: 'Bob Johnson',
          patientPhone: '+1234567892',
          patientAge: 45,
          patientGender: 'Male',
          appointmentType: 'clinic' as const,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          time: '11:00 AM',
          symptoms: 'Back pain',
          status: 'completed' as const,
          paymentMethod: 'cash' as const,
          paymentStatus: 'paid' as const,
          fee: 700,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const appointment of sampleAppointments) {
        const appointmentId = await this.firebaseService.createAppointment(appointment);
        this.debugOutput += `Created appointment for ${appointment.patientName} with ID: ${appointmentId}\n`;
      }
      
      this.debugOutput += `\nAll sample appointments created successfully!\n`;
      
    } catch (error) {
      this.debugOutput += `ERROR creating appointments: ${JSON.stringify(error, null, 2)}\n`;
    }
  }

  async listAllAppointments() {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.debugOutput = 'ERROR: No authenticated user found!\n';
        return;
      }

      this.debugOutput = 'Listing all appointments...\n';
      
      const appointments = await new Promise((resolve, reject) => {
        const sub = this.firebaseService.getAppointmentsByDoctor(user.uid).subscribe({
          next: (data) => {
            sub.unsubscribe();
            resolve(data);
          },
          error: (err) => {
            sub.unsubscribe();
            reject(err);
          }
        });
      });
      
      this.debugOutput += `Found ${(appointments as any[]).length} appointments:\n`;
      this.debugOutput += JSON.stringify(appointments, null, 2);
      
    } catch (error) {
      this.debugOutput += `ERROR: ${JSON.stringify(error, null, 2)}\n`;
    }
  }
}