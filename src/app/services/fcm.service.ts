import { Injectable } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FCMService {
  private currentMessage = new BehaviorSubject<any>(null);
  
  constructor(private messaging: Messaging) {
    this.requestPermission();
    this.receiveMessage();
  }

  requestPermission() {
    getToken(this.messaging, { 
      vapidKey: environment.firebase.vapidKey || 'YOUR_VAPID_KEY_HERE' 
    }).then((currentToken) => {
      if (currentToken) {
        console.log('FCM registration token:', currentToken);
        // Send the token to your server and update the UI if necessary
        this.saveTokenToServer(currentToken);
      } else {
        console.log('No registration token available.');
      }
    }).catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
    });
  }

  receiveMessage() {
    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      this.currentMessage.next(payload);
      
      // Show notification to user
      this.showNotification(payload);
    });
  }

  private saveTokenToServer(token: string) {
    // Save token to your backend server
    // This token will be used to send targeted push notifications
    console.log('Saving FCM token to server:', token);
    
    // Example: Send to your backend
    // this.http.post('/api/fcm-tokens', { token, userId: this.authService.getCurrentUser()?.uid }).subscribe();
  }

  private showNotification(payload: any) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        data: payload.data
      });

      notification.onclick = () => {
        // Handle notification click
        window.focus();
        notification.close();
        
        // Navigate based on notification data
        if (payload.data?.type) {
          this.handleNotificationClick(payload.data);
        }
      };
    }
  }

  private handleNotificationClick(data: any) {
    switch (data.type) {
      case 'appointment':
        window.location.href = '/patient/appointments';
        break;
      case 'prescription':
        window.location.href = '/patient/prescriptions';
        break;
      case 'payment':
        window.location.href = '/patient/payments';
        break;
      default:
        window.location.href = '/notifications';
    }
  }

  getCurrentMessage() {
    return this.currentMessage.asObservable();
  }
}