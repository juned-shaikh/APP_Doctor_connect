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
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/assets/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/icons/dismiss-icon.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Handle view action
    const data = event.notification.data;
    let url = '/notifications';
    
    if (data?.type) {
      switch (data.type) {
        case 'appointment':
          url = '/patient/appointments';
          break;
        case 'prescription':
          url = '/patient/prescriptions';
          break;
        case 'payment':
          url = '/patient/payments';
          break;
      }
    }
    
    event.waitUntil(
      clients.openWindow(url)
    );
  }
  // Dismiss action just closes the notification (default behavior)
});