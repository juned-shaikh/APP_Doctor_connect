import { Injectable } from '@angular/core';
import { FirebaseService, NotificationData } from './firebase.service';
import { AuthService } from './auth.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { ToastController, AlertController } from '@ionic/angular/standalone';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<NotificationData[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser?.uid) {
      this.firebaseService.getNotificationsByUser(currentUser.uid).subscribe(notifications => {
        this.notifications$.next(notifications);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        this.unreadCount$.next(unreadCount);
      });
    }
  }

  getNotifications(): Observable<NotificationData[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.firebaseService.markNotificationAsRead(notificationId);
  }

  async markAllAsRead(): Promise<void> {
    const notifications = this.notifications$.value;
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    const promises = unreadNotifications.map(notification => 
      this.firebaseService.markNotificationAsRead(notification.id!)
    );
    
    await Promise.all(promises);
  }

  async sendAppointmentReminder(appointmentId: string, patientId: string, doctorName: string, appointmentTime: Date): Promise<void> {
    await this.firebaseService.createNotification({
      userId: patientId,
      title: 'Appointment Reminder',
      message: `Your appointment with Dr. ${doctorName} is scheduled for ${this.formatDateTime(appointmentTime)}`,
      type: 'appointment',
      isRead: false,
      data: { appointmentId }
    });
  }

  async sendPrescriptionNotification(patientId: string, doctorName: string, prescriptionId: string): Promise<void> {
    await this.firebaseService.createNotification({
      userId: patientId,
      title: 'New Prescription',
      message: `Dr. ${doctorName} has prescribed new medications for you`,
      type: 'prescription',
      isRead: false,
      data: { prescriptionId }
    });
  }

  async sendPaymentNotification(userId: string, amount: number, status: 'success' | 'failed'): Promise<void> {
    const title = status === 'success' ? 'Payment Successful' : 'Payment Failed';
    const message = status === 'success' 
      ? `Your payment of ₹${amount} has been processed successfully`
      : `Your payment of ₹${amount} could not be processed. Please try again.`;

    await this.firebaseService.createNotification({
      userId,
      title,
      message,
      type: 'payment',
      isRead: false,
      data: { amount, status }
    });
  }

  async showToastNotification(message: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async showAlertNotification(title: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: title,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Schedule appointment reminders (would integrate with a job scheduler in production)
  async scheduleAppointmentReminders(appointmentId: string, patientId: string, doctorName: string, appointmentTime: Date): Promise<void> {
    const now = new Date();
    const appointmentDate = new Date(appointmentTime);
    
    // Schedule reminder 24 hours before
    const reminder24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      // In a real app, you would use a job scheduler or cloud functions
      setTimeout(async () => {
        await this.sendAppointmentReminder(appointmentId, patientId, doctorName, appointmentTime);
      }, reminder24h.getTime() - now.getTime());
    }
    
    // Schedule reminder 2 hours before
    const reminder2h = new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000);
    if (reminder2h > now) {
      setTimeout(async () => {
        await this.sendAppointmentReminder(appointmentId, patientId, doctorName, appointmentTime);
      }, reminder2h.getTime() - now.getTime());
    }
  }
}
