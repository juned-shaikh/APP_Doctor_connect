import { Injectable } from '@angular/core';
import { FirebaseService, AppointmentData } from './firebase.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { AlertController, ToastController } from '@ionic/angular/standalone';

export interface RescheduleData {
  appointmentId: string;
  newDate: Date;
  newTime: string;
  reason?: string;
}

export interface CancellationData {
  appointmentId: string;
  reason: string;
  cancelledBy: 'patient' | 'doctor';
  refundAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  constructor(
    private firebaseService: FirebaseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async bookAppointment(appointmentData: Partial<AppointmentData>): Promise<string> {
    try {
      const appointmentId = await this.firebaseService.createAppointment({
        ...appointmentData,
        status: 'pending',
        paymentStatus: appointmentData.paymentMethod === 'online' ? 'paid' : 'pending'
      });

      // Send notifications with the created appointmentId attached
      await this.firebaseService.sendAppointmentNotification(
        { ...(appointmentData as AppointmentData), id: appointmentId },
        'created'
      );

      // Schedule reminders
      if (appointmentData.date) {
        await this.notificationService.scheduleAppointmentReminders(
          appointmentId,
          appointmentData.patientId!,
          appointmentData.doctorName!,
          appointmentData.date
        );
      }
      return appointmentId;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }

  async checkInAppointment(appointmentId: string): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) throw new Error('Appointment not found');

      // Only allow check-in on appointment date and for clinic visits
      const today = new Date().toDateString();
      if (new Date(appointment.date).toDateString() !== today) {
        throw new Error('Check-in is only allowed on the appointment date');
      }
      if (appointment.appointmentType !== 'clinic') {
        throw new Error('Check-in is only available for clinic visits');
      }

      await this.firebaseService.updateAppointment(appointmentId, {
        checkedIn: true as any, // mark presence
        status: 'completed' as any, // mark as completed so analytics and lists update live
        // store completion timestamp
        completedAt: new Date() as any
      });

      await this.notificationService.showToastNotification(
        'Patient marked as present',
        'success'
      );
    } catch (error) {
      console.error('Error during check-in:', error);
      await this.notificationService.showToastNotification(
        error instanceof Error ? error.message : 'Failed to mark present',
        'danger'
      );
      throw error;
    }
  }

  async rescheduleAppointment(rescheduleData: RescheduleData): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(rescheduleData.appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if reschedule is allowed (e.g., at least 24 hours before appointment)
      const now = new Date();
      const appointmentTime = new Date(appointment.date);
      const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        throw new Error('Appointments can only be rescheduled at least 24 hours in advance');
      }

      // Update appointment
      await this.firebaseService.updateAppointment(rescheduleData.appointmentId, {
        date: rescheduleData.newDate,
        time: rescheduleData.newTime,
        status: 'pending' // Reset to pending for doctor approval
      });

      // Send notifications
      await this.firebaseService.sendAppointmentNotification(
        { ...appointment, date: rescheduleData.newDate, time: rescheduleData.newTime },
        'updated'
      );

      // Create notification about reschedule
      await this.firebaseService.createNotification({
        userId: appointment.doctorId,
        title: 'Appointment Rescheduled',
        message: `${appointment.patientName} has requested to reschedule their appointment to ${this.formatDateTime(rescheduleData.newDate)} at ${rescheduleData.newTime}`,
        type: 'appointment',
        isRead: false,
        data: { 
          appointmentId: rescheduleData.appointmentId,
          reason: rescheduleData.reason 
        }
      });

      await this.notificationService.showToastNotification(
        'Appointment rescheduled successfully. Waiting for doctor approval.',
        'success'
      );

    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      await this.notificationService.showToastNotification(
        error instanceof Error ? error.message : 'Failed to reschedule appointment',
        'danger'
      );
      throw error;
    }
  }

  async cancelAppointment(cancellationData: CancellationData): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(cancellationData.appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check cancellation policy (e.g., at least 2 hours before appointment)
      const now = new Date();
      const appointmentTime = new Date(appointment.date);
      const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      let refundAmount = 0;
      if (appointment.paymentMethod === 'online' && appointment.paymentStatus === 'paid') {
        if (hoursUntilAppointment >= 24) {
          refundAmount = appointment.fee; // Full refund
        } else if (hoursUntilAppointment >= 2) {
          refundAmount = appointment.fee * 0.5; // 50% refund
        }
        // No refund if cancelled less than 2 hours before
      }

      // Update appointment
      await this.firebaseService.updateAppointment(cancellationData.appointmentId, {
        status: 'cancelled',
        notes: `Cancelled by ${cancellationData.cancelledBy}. Reason: ${cancellationData.reason}`
      });

      // Process refund if applicable
      if (refundAmount > 0) {
        // In a real app, integrate with payment gateway for refund
        await this.firebaseService.updateAppointment(cancellationData.appointmentId, {
          paymentStatus: 'refunded'
        });

        await this.notificationService.sendPaymentNotification(
          appointment.patientId,
          refundAmount,
          'success'
        );
      }

      // Send notifications
      await this.firebaseService.sendAppointmentNotification(appointment, 'cancelled');

      const refundMessage = refundAmount > 0 ? ` Refund of ₹${refundAmount} will be processed within 3-5 business days.` : '';
      await this.notificationService.showToastNotification(
        `Appointment cancelled successfully.${refundMessage}`,
        'success'
      );

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      await this.notificationService.showToastNotification(
        error instanceof Error ? error.message : 'Failed to cancel appointment',
        'danger'
      );
      throw error;
    }
  }

  async approveAppointment(appointmentId: string): Promise<void> {
    try {
      await this.firebaseService.updateAppointment(appointmentId, {
        status: 'confirmed'
      });

      const appointment = await this.getAppointmentById(appointmentId);
      if (appointment) {
        await this.firebaseService.createNotification({
          userId: appointment.patientId,
          title: 'Appointment Confirmed',
          message: `Your appointment with Dr. ${appointment.doctorName} has been confirmed for ${this.formatDateTime(appointment.date)} at ${appointment.time}`,
          type: 'appointment',
          isRead: false,
          data: { appointmentId }
        });
      }

      await this.notificationService.showToastNotification(
        'Appointment approved successfully',
        'success'
      );

    } catch (error) {
      console.error('Error approving appointment:', error);
      throw error;
    }
  }

  async rejectAppointment(appointmentId: string, reason: string): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      await this.firebaseService.updateAppointment(appointmentId, {
        status: 'cancelled',
        notes: `Rejected by doctor. Reason: ${reason}`
      });

      // Process refund if payment was made
      if (appointment.paymentMethod === 'online' && appointment.paymentStatus === 'paid') {
        await this.firebaseService.updateAppointment(appointmentId, {
          paymentStatus: 'refunded'
        });

        await this.notificationService.sendPaymentNotification(
          appointment.patientId,
          appointment.fee,
          'success'
        );
      }

      await this.firebaseService.createNotification({
        userId: appointment.patientId,
        title: 'Appointment Rejected',
        message: `Your appointment request has been declined. Reason: ${reason}. Full refund will be processed if payment was made.`,
        type: 'appointment',
        isRead: false,
        data: { appointmentId, reason }
      });

      await this.notificationService.showToastNotification(
        'Appointment rejected successfully',
        'success'
      );

    } catch (error) {
      console.error('Error rejecting appointment:', error);
      throw error;
    }
  }

  async markAppointmentComplete(appointmentId: string, notes?: string): Promise<void> {
    try {
      await this.firebaseService.updateAppointment(appointmentId, {
        status: 'completed',
        notes: notes || 'Consultation completed'
      });

      const appointment = await this.getAppointmentById(appointmentId);
      if (appointment) {
        await this.firebaseService.createNotification({
          userId: appointment.patientId,
          title: 'Consultation Completed',
          message: `Your consultation with Dr. ${appointment.doctorName} has been completed. Please check for any prescriptions.`,
          type: 'appointment',
          isRead: false,
          data: { appointmentId }
        });
      }

      await this.notificationService.showToastNotification(
        'Appointment marked as completed',
        'success'
      );

    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  private async getAppointmentById(appointmentId: string): Promise<AppointmentData | null> {
    return new Promise((resolve) => {
      const subscription = this.firebaseService.getAppointmentById(appointmentId).subscribe(
        appointment => {
          subscription.unsubscribe();
          resolve(appointment);
        }
      );
    });
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Utility methods for appointment validation
  async showRescheduleDialog(appointmentId: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Reschedule Appointment',
      message: 'Please select a new date and time for your appointment.',
      inputs: [
        {
          name: 'date',
          type: 'date',
          min: new Date().toISOString().split('T')[0]
        },
        {
          name: 'time',
          type: 'time'
        },
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for rescheduling (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reschedule',
          handler: async (data) => {
            if (data.date && data.time) {
              const newDate = new Date(data.date + 'T' + data.time);
              await this.rescheduleAppointment({
                appointmentId,
                newDate,
                newTime: data.time,
                reason: data.reason
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async showCancelDialog(appointmentId: string, cancelledBy: 'patient' | 'doctor'): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for cancellation',
          attributes: {
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'No, Keep Appointment',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          role: 'destructive',
          handler: async (data) => {
            if (data.reason) {
              await this.cancelAppointment({
                appointmentId,
                reason: data.reason,
                cancelledBy
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }
}
