import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { PushNotificationService } from './push-notification.service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class LocalNotificationService {
  private notifiedAppointments: Set<string> = new Set();
  private isInitialized = false;
  private appState: 'active' | 'background' = 'active';
  private initializationPromise: Promise<void> | null = null;
  
  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService
  ) {
    this.initializeLocalNotifications();
    this.setupAppStateListener();
  }

  private async initializeLocalNotifications() {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      console.log('[LocalNotificationService] ⏳ Already initializing, waiting for completion...');
      return this.initializationPromise;
    }

    console.log('[LocalNotificationService] 🔧 Starting initialization process...');
    
    // Create a promise to track initialization
    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize() {
    try {
      console.log('[LocalNotificationService] 🔧 Initializing local notifications service...');
      
      // Only initialize on native platforms
      const isNative = Capacitor.isNativePlatform();
      console.log('[LocalNotificationService] 🧪 Platform check - isNative:', isNative);
      
      if (!isNative) {
        console.log('[LocalNotificationService] ⚠️ Not running on native platform (web/browser). Local notifications only work on mobile devices.');
        return;
      }

      console.log('[LocalNotificationService] 🔐 Requesting notification permissions...');
      // Request permission for local notifications
      const permission = await LocalNotifications.requestPermissions();
      console.log('[LocalNotificationService] 🔐 Permission result:', permission);
      
      // Check if we have permission
      if (permission.display !== 'granted') {
        console.warn('[LocalNotificationService] ⚠️ Notification permission not granted. User must allow notifications in device settings.');
        return;
      }

      console.log('[LocalNotificationService] 👂 Setting up notification listeners...');
      // Set up notification listeners
      await this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('[LocalNotificationService] ✅ Local notification service initialized successfully!');

      // Listen for appointment status changes
      this.listenForAppointmentStatusChanges();
    } catch (error) {
      console.error('[LocalNotificationService] ❌ Initialization error:', error);
      this.isInitialized = false;
    }
  }

  private async setupNotificationListeners() {
    try {
      console.log('[LocalNotificationService] 👂 Setting up notification listeners...');
      
      // Listen for notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('[LocalNotificationService] 🔔 Notification action performed:', notification);
      });

      // Listen for notification received
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('[LocalNotificationService] 📥 Notification received:', notification);
      });
      
      console.log('[LocalNotificationService] ✅ Notification listeners set up successfully');
    } catch (error) {
      console.error('[LocalNotificationService] ❌ Error setting up listeners:', error);
    }
  }

  private setupAppStateListener() {
    try {
      console.log('[LocalNotificationService] 👂 Setting up app state listener...');
      
      if (Capacitor.isNativePlatform()) {
        App.addListener('appStateChange', (state) => {
          this.appState = state.isActive ? 'active' : 'background';
          console.log('[LocalNotificationService] 📱 App state changed to:', this.appState);
        });
        console.log('[LocalNotificationService] ✅ App state listener set up successfully');
      } else {
        console.log('[LocalNotificationService] 🧪 Skipping app state listener on web platform');
      }
    } catch (error) {
      console.error('[LocalNotificationService] ❌ Error setting up app state listener:', error);
    }
  }

  private listenForAppointmentStatusChanges() {
    try {
      const currentUser = this.authService.getCurrentUser();
      console.log('[LocalNotificationService] 👂 Setting up appointment listener for user:', currentUser?.uid);
      
      if (!currentUser) {
        console.log('[LocalNotificationService] ⚠️ No current user, skipping appointment listener setup');
        return;
      }

      // Listen for appointments with error handling
      this.firebaseService.getAppointmentsByPatient(currentUser.uid).subscribe({
        next: (appointments) => {
          console.log('[LocalNotificationService] 📋 Received appointments update, count:', appointments.length);
          
          appointments.forEach(appointment => {
            // Check if appointment is confirmed and we haven't notified about it yet
            if (appointment.status === 'confirmed' && !this.notifiedAppointments.has(appointment.id!)) {
              console.log('[LocalNotificationService] 🎉 New confirmed appointment detected:', appointment.id);
              
              // Send notification based on app state
              this.sendAppointmentConfirmedNotification(appointment);
              
              // Mark as notified
              this.notifiedAppointments.add(appointment.id!);
            }
          });
        },
        error: (error) => {
          console.error('[LocalNotificationService] ❌ Error listening for appointment changes:', error);
        }
      });
    } catch (error) {
      console.error('[LocalNotificationService] ❌ Error in listenForAppointmentStatusChanges:', error);
    }
  }

  async sendAppointmentConfirmedNotification(appointment: any) {
    try {
      console.log('[LocalNotificationService] 🚀 Sending appointment confirmation notification for:', appointment.id);
      
      // Validate appointment data
      if (!appointment) {
        console.log('[LocalNotificationService] ⚠️ Appointment data is null or undefined');
        return;
      }
      
      console.log('[LocalNotificationService] 📋 Appointment details:', {
        id: appointment.id,
        doctorName: appointment.doctorName,
        date: appointment.date,
        time: appointment.time,
        appointmentType: appointment.appointmentType
      });
      
      // Validate required fields
      if (!appointment.id) {
        console.log('[LocalNotificationService] ⚠️ Appointment ID is missing');
        return;
      }
      
      if (!appointment.doctorName) {
        console.log('[LocalNotificationService] ⚠️ Doctor name is missing');
        return;
      }
      
      if (!appointment.date) {
        console.log('[LocalNotificationService] ⚠️ Appointment date is missing');
        return;
      }
      
      if (!appointment.time) {
        console.log('[LocalNotificationService] ⚠️ Appointment time is missing');
        return;
      }
      
      console.log('[LocalNotificationService] 📱 App state:', this.appState);
      console.log('[LocalNotificationService] ⚙️ Service initialized:', this.isInitialized);
      console.log('[LocalNotificationService] 🧪 Running on native platform:', Capacitor.isNativePlatform());

      // Check if we're on a native platform
      if (!Capacitor.isNativePlatform()) {
        console.log('[LocalNotificationService] ⚠️ Local notifications only work on mobile devices. Showing in-app notification instead.');
        return;
      }

      // Wait for initialization if it's still in progress
      if (!this.isInitialized && this.initializationPromise) {
        console.log('[LocalNotificationService] ⏳ Waiting for initialization to complete...');
        await this.initializationPromise;
      }

      // Always try to send local notification first if initialized
      if (this.isInitialized && Capacitor.isNativePlatform()) {
        console.log('[LocalNotificationService] 📬 Sending local notification...');
        await this.sendLocalNotification(appointment);
        console.log('[LocalNotificationService] ✅ Local notification sent successfully');
      } else {
        console.log('[LocalNotificationService] ⚠️ Cannot send local notification - service not initialized or not native platform');
        console.log('[LocalNotificationService] ⚙️ Initialized status:', this.isInitialized);
        console.log('[LocalNotificationService] 🧪 Native platform status:', Capacitor.isNativePlatform());
      }

      // Also send push notification as backup
      if (this.appState === 'background') {
        console.log('[LocalNotificationService] 📱 App in background, sending push notification as well');
        await this.sendPushNotification(appointment);
      }
    } catch (error) {
      console.error('[LocalNotificationService] 💥 Error sending notification:', error);
      console.error('[LocalNotificationService] 💥 Error details:', JSON.stringify(error, null, 2));
    }
  }

  private async sendLocalNotification(appointment: any) {
    try {
      console.log('[LocalNotificationService] 📬 Preparing to send local notification...');
      
      if (!this.isInitialized) {
        console.log('[LocalNotificationService] ⚠️ Local notifications not initialized, skipping');
        return;
      }

      const notificationId = Math.floor(Math.random() * 1000000); // Generate a random int ID
      
      console.log('[LocalNotificationService] 🆔 Scheduling local notification with ID:', notificationId);
      
      const notificationData = {
        notifications: [
          {
            id: notificationId,
            title: 'Appointment Confirmed! 🎉',
            body: `Dr. ${appointment.doctorName} confirmed your appointment for ${this.formatDate(appointment.date)} at ${appointment.time}`,
            largeBody: `Your appointment with Dr. ${appointment.doctorName} has been confirmed!

Date: ${this.formatDate(appointment.date)}
Time: ${appointment.time}
Type: ${appointment.appointmentType === 'video' ? 'Video Consultation' : 'Clinic Visit'}`,
            summaryText: 'Appointment Confirmed',
            schedule: {
              at: new Date(Date.now() + 1000) // Show immediately
            },
            sound: 'default',
            actionTypeId: 'APPOINTMENT_CONFIRMED',
            extra: {
              appointmentId: appointment.id,
              status: 'confirmed',
              doctorName: appointment.doctorName,
              appointmentDate: appointment.date,
              appointmentTime: appointment.time
            },
            attachments: [],
            ongoing: false,
            autoCancel: true
          }
        ]
      };
      
      console.log('[LocalNotificationService] 📤 Notification data:', JSON.stringify(notificationData, null, 2));
      
      const result = await LocalNotifications.schedule(notificationData);
      
      console.log('[LocalNotificationService] ✅ Local notification scheduled successfully:', result);
    } catch (error) {
      console.error('[LocalNotificationService] 💥 Error sending local notification:', error);
      console.error('[LocalNotificationService] 💥 Error details:', JSON.stringify(error, null, 2));
      throw error; // Re-throw to handle in calling function
    }
  }

  private async sendPushNotification(appointment: any) {
    try {
      console.log('[LocalNotificationService] 📱 Sending push notification...');
      
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.log('[LocalNotificationService] ⚠️ No current user, skipping push notification');
        return;
      }
      
      // Send push notification through push notification service
      await this.pushNotificationService.sendPushNotification({
        userId: currentUser.uid,
        title: 'Appointment Confirmed',
        body: `Your appointment with Dr. ${appointment.doctorName} has been confirmed for ${this.formatDate(appointment.date)} at ${appointment.time}`,
        data: { appointmentId: appointment.id, status: 'confirmed' }
      });
      
      console.log('[LocalNotificationService] ✅ Push notification sent successfully');
    } catch (error) {
      console.error('[LocalNotificationService] 💥 Error sending push notification:', error);
    }
  }

  private isAppInForeground(): boolean {
    // For native platforms, use the app state
    if (Capacitor.isNativePlatform()) {
      return this.appState === 'active';
    }
    
    // For web, check document visibility
    const isVisible = document.visibilityState === 'visible';
    const isFocused = document.hasFocus?.() ?? true;
    
    return isVisible && isFocused;
  }

  // Public method to manually trigger notification (for testing)
  async testNotification() {
    try {
      console.log('[LocalNotificationService] 🧪 Sending test notification...');
      
      // Ensure service is initialized
      if (!this.isInitialized) {
        console.log('[LocalNotificationService] 🔧 Initializing service for test...');
        await this.initializeLocalNotifications();
      }

      const testAppointment = {
        id: 'test-' + Math.floor(Math.random() * 1000000),
        doctorName: 'Test Doctor',
        date: new Date(),
        time: '10:00 AM',
        appointmentType: 'video'
      };

      await this.sendLocalNotification(testAppointment);
      console.log('[LocalNotificationService] ✅ Test notification sent successfully');
    } catch (error) {
      console.error('[LocalNotificationService] 💥 Error sending test notification:', error);
    }
  }

  // Method to clear all notifications
  async clearAllNotifications() {
    try {
      console.log('[LocalNotificationService] 🧹 Clearing all notifications...');
      
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.removeAllDeliveredNotifications();
        console.log('[LocalNotificationService] ✅ All notifications cleared');
      } else {
        console.log('[LocalNotificationService] 🧪 Skipping clear on web platform');
      }
    } catch (error) {
      console.error('[LocalNotificationService] 💥 Error clearing notifications:', error);
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Method to send notification to doctor about new appointment booking
  async sendNewAppointmentNotificationToDoctor(appointment: any) {
    try {
      console.log('[LocalNotificationService] 🚀 Sending new appointment notification to doctor:', appointment.id);
      
      // Validate appointment data
      if (!appointment) {
        console.log('[LocalNotificationService] ⚠️ Appointment data is null or undefined');
        return;
      }
      
      console.log('[LocalNotificationService] 📋 Appointment details:', {
        id: appointment.id,
        patientName: appointment.patientName,
        date: appointment.date,
        time: appointment.time,
        appointmentType: appointment.appointmentType
      });
      
      // Check if we're on a native platform
      if (!Capacitor.isNativePlatform()) {
        console.log('[LocalNotificationService] ⚠️ Local notifications only work on mobile devices.');
        return;
      }

      // Wait for initialization if it's still in progress
      if (!this.isInitialized && this.initializationPromise) {
        console.log('[LocalNotificationService] ⏳ Waiting for initialization to complete...');
        await this.initializationPromise;
      }

      // Send local notification if initialized
      if (this.isInitialized && Capacitor.isNativePlatform()) {
        console.log('[LocalNotificationService] 📬 Sending local notification to doctor...');
        
        const notificationId = Math.floor(Math.random() * 1000000);
        
        const notificationData = {
          notifications: [
            {
              id: notificationId,
              title: 'New Appointment Booking! 📅',
              body: `${appointment.patientName} has booked an appointment for ${this.formatDate(appointment.date)} at ${appointment.time}`,
              largeBody: `New appointment booking received!
Patient: ${appointment.patientName}
Date: ${this.formatDate(appointment.date)}
Time: ${appointment.time}
Type: ${appointment.appointmentType === 'video' ? 'Video Consultation' : 'Clinic Visit'}

Please review and approve the appointment.`,
              summaryText: 'New Appointment',
              schedule: {
                at: new Date(Date.now() + 1000) // Show immediately
              },
              sound: 'default',
              actionTypeId: 'NEW_APPOINTMENT',
              extra: {
                appointmentId: appointment.id,
                status: 'pending',
                patientName: appointment.patientName,
                appointmentDate: appointment.date,
                appointmentTime: appointment.time
              },
              attachments: [],
              ongoing: false,
              autoCancel: true
            }
          ]
        };
        
        console.log('[LocalNotificationService] 📤 Notification data:', JSON.stringify(notificationData, null, 2));
        
        const result = await LocalNotifications.schedule(notificationData);
        
        console.log('[LocalNotificationService] ✅ Local notification scheduled successfully:', result);
      } else {
        console.log('[LocalNotificationService] ⚠️ Cannot send local notification - service not initialized or not native platform');
      }
    } catch (error) {
      console.error('[LocalNotificationService] 💥 Error sending doctor notification:', error);
      console.error('[LocalNotificationService] 💥 Error details:', JSON.stringify(error, null, 2));
    }
  }
}