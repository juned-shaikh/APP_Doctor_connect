import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthDebugService {
  
  constructor(private platform: Platform) {}

  async diagnoseGoogleAuth(): Promise<string[]> {
    const issues: string[] = [];
    
    console.log('🔍 Starting Google Auth Diagnosis...');
    
    // Check platform
    console.log('Platform info:', {
      isCapacitor: this.platform.is('capacitor'),
      isAndroid: this.platform.is('android'),
      isIos: this.platform.is('ios'),
      isMobile: this.platform.is('mobile'),
      platforms: this.platform.platforms()
    });
    
    if (!this.platform.is('capacitor')) {
      issues.push('Not running on Capacitor platform - Google Auth plugin won\'t work');
      return issues;
    }
    
    // Check if GoogleAuth is available
    try {
      console.log('GoogleAuth object:', GoogleAuth);
      if (!GoogleAuth) {
        issues.push('GoogleAuth plugin not available');
        return issues;
      }
    } catch (error) {
      issues.push(`GoogleAuth plugin error: ${error}`);
      return issues;
    }
    
    // Check initialization
    try {
      await GoogleAuth.initialize({
        clientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('✅ GoogleAuth initialization successful');
    } catch (error: any) {
      issues.push(`GoogleAuth initialization failed: ${error.message || error}`);
      console.error('Initialization error:', error);
    }
    
    // Check if we can call basic methods
    try {
      // This might fail but will give us more info
      const result = await GoogleAuth.signIn();
      console.log('Sign-in test result:', result);
    } catch (error: any) {
      console.log('Sign-in test error (expected):', error);
      if (error.message?.includes('CLIENT_ID') || error.message?.includes('client_id')) {
        issues.push('Invalid or missing Google Client ID');
      } else if (error.message?.includes('DEVELOPER_ERROR')) {
        issues.push('Developer error - check SHA-1 fingerprint and Firebase configuration');
      } else if (error.message?.includes('cancelled')) {
        console.log('✅ Sign-in dialog appeared (good sign)');
      } else {
        issues.push(`Sign-in error: ${error.message || error}`);
      }
    }
    
    console.log('🔍 Diagnosis complete. Issues found:', issues.length);
    return issues;
  }
}