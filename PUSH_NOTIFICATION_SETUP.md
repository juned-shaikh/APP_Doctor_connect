# Push Notification Setup Guide

## ✅ What's Already Done
- Installed `@capacitor/push-notifications`
- Created `PushNotificationService` for native push notifications
- Created `FCMService` for web push notifications
- Updated Capacitor configuration
- Added notification badge to patient tabs
- Integrated with existing notification system

## 🔧 Next Steps to Complete Setup

### 1. Firebase Console Configuration

#### Enable Cloud Messaging
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **doctorconnect-f0aa0**
3. Go to **Project Settings** > **Cloud Messaging**
4. Generate a new **Server Key** (for backend)
5. Generate **Web Push certificates** (for web notifications)

#### Get VAPID Key (for Web)
1. In Firebase Console > Project Settings > Cloud Messaging
2. Go to **Web configuration**
3. Generate or copy your **VAPID key**
4. Add it to `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    // ... existing config
    vapidKey: 'YOUR_VAPID_KEY_HERE'
  }
};
```

### 2. Android Configuration

#### Add Firebase Service Worker
Create `src/firebase-messaging-sw.js`:
```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDj0H_g8tSM2QuXhLqSdJFNKuoseLAPbJM",
  authDomain: "doctorconnect-f0aa0.firebaseapp.com",
  projectId: "doctorconnect-f0aa0",
  storageBucket: "doctorconnect-f0aa0.firebasestorage.app",
  messagingSenderId: "1041888734011",
  appId: "1:1041888734011:web:6b79cc7f8918327cce251e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

#### Update Android Manifest
The plugin should automatically add required permissions, but verify in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

### 3. Build and Sync

```bash
npm run build
npx cap sync android
npx cap open android
```

### 4. Test Push Notifications

#### Test on Device
1. Build and install on physical device
2. Grant notification permissions when prompted
3. Check console for FCM token
4. Use Firebase Console to send test notification

#### Test Web Notifications
1. Run `ionic serve`
2. Allow notifications when prompted
3. Check browser console for FCM token
4. Send test notification from Firebase Console

### 5. Backend Integration (Optional)

To send notifications from your backend:

```javascript
// Node.js example using firebase-admin
const admin = require('firebase-admin');

const message = {
  notification: {
    title: 'Appointment Reminder',
    body: 'Your appointment is in 1 hour'
  },
  data: {
    type: 'appointment',
    appointmentId: '123'
  },
  token: 'USER_FCM_TOKEN'
};

admin.messaging().send(message);
```

## 🎯 Features Implemented

### Native Mobile Features
- ✅ Push notification registration
- ✅ Foreground notification handling
- ✅ Background notification handling
- ✅ Notification action handling
- ✅ Badge count management
- ✅ Deep linking from notifications

### Web Features
- ✅ FCM token registration
- ✅ Foreground message handling
- ✅ Background service worker
- ✅ Browser notification API
- ✅ Click handling and navigation

### UI Features
- ✅ Notification badge on tabs
- ✅ Real-time unread count
- ✅ Animated notification badge
- ✅ Integration with existing notification page

## 🚀 How to Use

### Send Appointment Reminder
```typescript
await this.notificationService.sendAppointmentReminder(
  appointmentId,
  patientId,
  doctorName,
  appointmentTime
);
```

### Send Prescription Notification
```typescript
await this.notificationService.sendPrescriptionNotification(
  patientId,
  doctorName,
  prescriptionId
);
```

### Send Payment Notification
```typescript
await this.notificationService.sendPaymentNotification(
  userId,
  amount,
  'success'
);
```

## 🔍 Troubleshooting

### No FCM Token Generated
- Check Firebase configuration
- Verify VAPID key is correct
- Ensure user granted notification permissions

### Notifications Not Received
- Check device has internet connection
- Verify FCM token is saved to backend
- Check Firebase Console message delivery status

### Badge Not Showing
- Verify notification service is properly injected
- Check unread count is being updated
- Ensure subscription is not being destroyed

Your push notification system is now ready! Just complete the Firebase configuration and test on a device.