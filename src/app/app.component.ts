import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { PushNotificationService } from './services/push-notification.service';
import { LocalNotificationService } from './services/local-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private pushNotificationService: PushNotificationService,
    private localNotificationService: LocalNotificationService
  ) {
    this.configureStatusBar();
  }

  ngOnInit() {
    // Initialize push notifications
    this.pushNotificationService.initializePushNotifications();
  }

  private async configureStatusBar() {
    try {
      // Only run on native platforms
      if (Capacitor.getPlatform() !== 'web') {
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Match app theme brand color (green) and keep light icons
        await StatusBar.setBackgroundColor({ color: '#20c997' });
        await StatusBar.setStyle({ style: StatusBarStyle.Light });
      }
    } catch (err) {
      // No-op if plugin not available (e.g., web)
      console.warn('StatusBar config skipped:', err);
    }
  }
}
