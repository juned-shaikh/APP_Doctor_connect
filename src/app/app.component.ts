import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.configureStatusBar();
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
