import { Component, OnInit } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonText } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-simple-notification-test',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Simple Notification Test</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div *ngIf="!isNativePlatform" class="warning-box">
        <h3>⚠️ Platform Warning</h3>
        <p>Local notifications only work on mobile devices (Android/iOS).</p>
        <p>You are currently running on the web platform.</p>
        <p>To test notifications, deploy to a mobile device or emulator.</p>
      </div>
      
      <p>Test local notifications directly</p>
      <ion-button expand="block" (click)="testPermissions()" [disabled]="!isNativePlatform">
        Check Permissions
      </ion-button>
      <ion-button expand="block" (click)="sendSimpleNotification()" [disabled]="!isNativePlatform">
        Send Simple Notification
      </ion-button>
      <ion-button expand="block" color="danger" (click)="clearNotifications()" [disabled]="!isNativePlatform">
        Clear All Notifications
      </ion-button>
      
      <div style="margin-top: 20px;">
        <h3>Platform Info:</h3>
        <p><strong>Current Platform:</strong> {{ platformInfo }}</p>
        <p><strong>Is Native:</strong> {{ isNativePlatform }}</p>
      </div>
      
      <div *ngIf="logMessages.length > 0" style="margin-top: 20px;">
        <h3>Log:</h3>
        <div *ngFor="let msg of logMessages" style="font-family: monospace; font-size: 12px; margin: 2px 0; padding: 2px; background: #f5f5f5;">
          {{ msg }}
        </div>
      </div>
    </ion-content>
  `,
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonText],
  standalone: true
})
export class SimpleNotificationTestComponent implements OnInit {
  logMessages: string[] = [];
  isNativePlatform: boolean = false;
  platformInfo: string = '';

  constructor() {}

  ngOnInit() {
    this.log('Component initialized');
    this.checkPlatform();
  }

  checkPlatform() {
    this.isNativePlatform = Capacitor.isNativePlatform();
    this.platformInfo = Capacitor.getPlatform();
    this.log(`Platform: ${this.platformInfo}, Is Native: ${this.isNativePlatform}`);
  }

  log(message: string) {
    const timestamp = new Date().toISOString();
    this.logMessages.push(`[${timestamp}] ${message}`);
    console.log(`[SimpleNotificationTest] ${message}`);
  }

  async testPermissions() {
    try {
      this.log('Checking permissions...');
      
      if (!this.isNativePlatform) {
        this.log('Not a native platform, local notifications not available');
        return;
      }

      this.log('Requesting permissions...');
      const permission = await LocalNotifications.requestPermissions();
      this.log(`Permission result: ${JSON.stringify(permission)}`);

      if (permission.display === 'granted') {
        this.log('✅ Permission granted!');
      } else {
        this.log('⚠️ Permission not granted');
      }
    } catch (error) {
      this.log(`❌ Error checking permissions: ${error}`);
      console.error('[SimpleNotificationTest] Error:', error);
    }
  }

  async sendSimpleNotification() {
    try {
      this.log('Sending simple notification...');
      
      if (!this.isNativePlatform) {
        this.log('Not a native platform, skipping notification');
        return;
      }

      // Request permissions first
      const permission = await LocalNotifications.requestPermissions();
      this.log(`Permission status: ${permission.display}`);
      
      if (permission.display !== 'granted') {
        this.log('Permission not granted, cannot send notification');
        return;
      }

      const notificationId = Math.floor(Math.random() * 1000000);
      this.log(`Using notification ID: ${notificationId}`);

      const result = await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'Test Notification',
            body: 'This is a simple test notification',
            schedule: {
              at: new Date(Date.now() + 3000) // Show in 3 seconds
            },
            sound: 'default',
            attachments: [],
            ongoing: false,
            autoCancel: true
          }
        ]
      });

      this.log(`✅ Notification scheduled: ${JSON.stringify(result)}`);
    } catch (error) {
      this.log(`❌ Error sending notification: ${error}`);
      console.error('[SimpleNotificationTest] Error:', error);
    }
  }

  async clearNotifications() {
    try {
      this.log('Clearing all notifications...');
      
      if (this.isNativePlatform) {
        await LocalNotifications.removeAllDeliveredNotifications();
        this.log('✅ All notifications cleared');
      } else {
        this.log('Not a native platform, skipping clear');
      }
    } catch (error) {
      this.log(`❌ Error clearing notifications: ${error}`);
      console.error('[SimpleNotificationTest] Error:', error);
    }
  }
}