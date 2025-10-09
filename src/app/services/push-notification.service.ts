import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular/standalone';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  badge?: number;
}

export interface SendPushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private fcmToken$ = new BehaviorSubject<string | null>(null);
  private notificationCount$ = new BehaviorSubject<number>(0);

  constructor(
    private platform: Platform,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.initializePushNotifications();
  }

  async initializePushNotifications() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    // Request permission to use push notifications
    await this.requestPermissions();

    // Register with Apple / Google to receive push via APNS/FCM
    await this.registerNotifications();

    // Setup listeners
    this.setupListeners();
  }

  private async requestPermissions() {
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        console.log('Push notification permissions granted');
        return true;
      } else {
        console.log('Push notification permissions denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      return false;
    }
  }

  private async registerNotifications() {
    try {
      await PushNotifications.register();
      console.log('Push notifications registered successfully');
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  }

  private setupListeners() {
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      this.fcmToken$.next(token.value);
      this.saveFCMToken(token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
      this.handleForegroundNotification(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed', notification);
      this.handleNotificationAction(notification);
    });
  }

  private async saveFCMToken(token: string) {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.uid) {
        // Save token to Firestore for sending targeted notifications
        // You'll need to implement this in your Firebase service
        console.log('Saving FCM token for user:', currentUser.uid);
        // await this.firebaseService.saveFCMToken(currentUser.uid, token);
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  private async handleForegroundNotification(notification: PushNotificationSchema) {
    // Show in-app notification when app is in foreground
    await this.notificationService.showToastNotification(
      `${notification.title}: ${notification.body}`,
      'primary'
    );

    // Update notification count
    this.incrementNotificationCount();

    // Create local notification record
    await this.createLocalNotification(notification);
  }

  private async handleNotificationAction(notification: ActionPerformed) {
    const data = notification.notification.data;
    
    // Navigate based on notification type
    if (data?.type) {
      switch (data.type) {
        case 'appointment':
          // Navigate to appointments
          window.location.href = '/patient/appointments';
          break;
        case 'prescription':
          // Navigate to prescriptions
          window.location.href = '/patient/prescriptions';
          break;
        case 'payment':
          // Navigate to payments
          window.location.href = '/patient/payments';
          break;
        default:
          // Navigate to notifications
          window.location.href = '/notifications';
      }
    }
  }

  private async createLocalNotification(notification: PushNotificationSchema) {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.uid) {
        // Create notification in local database
        // This would integrate with your existing notification service
        console.log('Creating local notification record');
      }
    } catch (error) {
      console.error('Error creating local notification:', error);
    }
  }

  // Public methods
  getFCMToken() {
    return this.fcmToken$.asObservable();
  }

  getNotificationCount() {
    return this.notificationCount$.asObservable();
  }

  incrementNotificationCount() {
    const current = this.notificationCount$.value;
    this.notificationCount$.next(current + 1);
  }

  resetNotificationCount() {
    this.notificationCount$.next(0);
  }

  async sendTestNotification() {
    if (!Capacitor.isNativePlatform()) {
      await this.notificationService.showToastNotification('Test notification sent!', 'success');
      return;
    }

    // This would typically be sent from your backend
    console.log('Test notification would be sent from backend');
  }

  async sendPushNotification(notificationData: SendPushNotificationData) {
    try {
      // In a real implementation, this would call your backend API
      // which would then use FCM to send the push notification
      console.log('Sending push notification:', notificationData);
      
      // Example implementation that would be done on the backend:
      // 1. Get the user's FCM token from your database
      // 2. Use the FCM Admin SDK to send the notification
      // 3. Handle any errors
      
      // For now, we'll just log it
      console.log(`Would send push notification to user ${notificationData.userId}: ${notificationData.title}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Badge management
  async setBadgeCount(count: number) {
    if (Capacitor.isNativePlatform()) {
      try {
        // Set app icon badge count
        // Note: This requires additional native implementation
        console.log('Setting badge count to:', count);
      } catch (error) {
        console.error('Error setting badge count:', error);
      }
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
  }
}