import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { GoogleAuthService } from './services/google-auth.service';
import { AuthService } from './services/auth.service';

@Component({
    selector: 'app-debug-google-signin',
    standalone: true,
    imports: [CommonModule, IonicModule],
    template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Google Sign-In Debug</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          
          <div class="debug-info">
            <h3>Platform Info</h3>
            <p><strong>Platforms:</strong> {{ platformInfo }}</p>
            <p><strong>Is Capacitor:</strong> {{ isCapacitor }}</p>
            <p><strong>Is Android:</strong> {{ isAndroid }}</p>
            <p><strong>Is iOS:</strong> {{ isIOS }}</p>
          </div>

          <div class="debug-actions">
            <ion-button 
              expand="block" 
              (click)="testGoogleAuth()" 
              [disabled]="testing">
              <ion-icon name="logo-google" slot="start"></ion-icon>
              {{ testing ? 'Testing...' : 'Test Google Sign-In' }}
            </ion-button>

            <ion-button 
              expand="block" 
              fill="outline" 
              (click)="checkGoogleAuthAvailability()" 
              [disabled]="testing">
              <ion-icon name="checkmark-circle" slot="start"></ion-icon>
              Check Google Auth Availability
            </ion-button>

            <ion-button 
              expand="block" 
              fill="outline" 
              (click)="clearLogs()">
              <ion-icon name="trash" slot="start"></ion-icon>
              Clear Logs
            </ion-button>
          </div>

          <div class="debug-logs" *ngIf="logs.length > 0">
            <h3>Debug Logs</h3>
            <div class="log-container">
              <div 
                *ngFor="let log of logs" 
                [class]="'log-entry log-' + log.type">
                <small>{{ log.timestamp }}</small><br>
                <strong>{{ log.type.toUpperCase() }}:</strong> {{ log.message }}
                <pre *ngIf="log.data">{{ log.data }}</pre>
              </div>
            </div>
          </div>

        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
    styles: [`
    .debug-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .debug-actions {
      margin-bottom: 16px;
    }
    
    .debug-actions ion-button {
      margin-bottom: 8px;
    }
    
    .log-container {
      max-height: 400px;
      overflow-y: auto;
      background: #1e1e1e;
      color: #fff;
      padding: 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    
    .log-entry {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #333;
    }
    
    .log-info { color: #4CAF50; }
    .log-error { color: #f44336; }
    .log-warn { color: #ff9800; }
    
    pre {
      white-space: pre-wrap;
      margin: 8px 0 0 0;
      font-size: 11px;
      color: #ccc;
    }
  `]
})
export class DebugGoogleSigninComponent {
    platformInfo: string = '';
    isCapacitor: boolean = false;
    isAndroid: boolean = false;
    isIOS: boolean = false;
    testing: boolean = false;
    logs: Array<{ type: string, message: string, timestamp: string, data?: string }> = [];

    constructor(
        private platform: Platform,
        private googleAuthService: GoogleAuthService,
        private authService: AuthService
    ) {
        this.initializePlatformInfo();
    }

    private initializePlatformInfo() {
        this.platformInfo = this.platform.platforms().join(', ');
        this.isCapacitor = this.platform.is('capacitor');
        this.isAndroid = this.platform.is('android');
        this.isIOS = this.platform.is('ios');

        this.addLog('info', 'Platform initialized', JSON.stringify({
            platforms: this.platform.platforms(),
            isCapacitor: this.isCapacitor,
            isAndroid: this.isAndroid,
            isIOS: this.isIOS
        }, null, 2));
    }

    async checkGoogleAuthAvailability() {
        this.testing = true;
        this.addLog('info', 'Checking Google Auth availability...');

        try {
            if (this.platform.is('capacitor')) {
                // Just check if we can import the plugin
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                this.addLog('info', 'Google Auth plugin imported successfully');

                // Check if GoogleAuth object exists and has expected methods
                const hasSignIn = typeof GoogleAuth.signIn === 'function';
                const hasInitialize = typeof GoogleAuth.initialize === 'function';
                const hasSignOut = typeof GoogleAuth.signOut === 'function';

                this.addLog('info', 'Available methods', JSON.stringify({
                    signIn: hasSignIn,
                    initialize: hasInitialize,
                    signOut: hasSignOut
                }, null, 2));

                if (!hasSignIn || !hasInitialize) {
                    this.addLog('error', 'Google Auth plugin is missing required methods');
                } else {
                    this.addLog('info', 'Google Auth plugin has all required methods');
                }
            } else {
                this.addLog('info', 'Running in browser - Google Auth should work with popup');
            }
        } catch (error: any) {
            this.addLog('error', 'Error checking Google Auth availability', error.message);
        } finally {
            this.testing = false;
        }
    }

    async testGoogleAuth() {
        this.testing = true;
        this.addLog('info', 'Starting Google Sign-In test...');

        try {
            // Test the GoogleAuthService directly
            const result = await this.googleAuthService.signInWithFirebase();
            this.addLog('info', 'Google Sign-In successful!', JSON.stringify({
                uid: result.user?.uid,
                email: result.user?.email,
                displayName: result.user?.displayName,
                photoURL: result.user?.photoURL
            }, null, 2));

            // Test the AuthService Google sign-in
            const user = await this.authService.signInWithGoogle();
            this.addLog('info', 'AuthService Google Sign-In successful!', JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: user.name,
                role: user.role
            }, null, 2));

        } catch (error: any) {
            this.addLog('error', 'Google Sign-In failed', JSON.stringify({
                message: error.message,
                code: error.code,
                stack: error.stack
            }, null, 2));
        } finally {
            this.testing = false;
        }
    }

    private addLog(type: 'info' | 'error' | 'warn', message: string, data?: string) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.unshift({ type, message, timestamp, data });

        // Keep only last 20 logs
        if (this.logs.length > 20) {
            this.logs = this.logs.slice(0, 20);
        }

        // Also log to console
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`, data || '');
    }

    clearLogs() {
        this.logs = [];
    }
}