import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  imageUrl?: string;
  idToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  
  constructor(
    private platform: Platform,
    private auth: Auth
  ) {
    this.initializeGoogleAuth();
  }

  private async initializeGoogleAuth() {
    if (this.platform.is('capacitor')) {
      try {
        console.log('Initializing Google Auth for mobile...');
        await GoogleAuth.initialize({
          clientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual web client ID from Firebase Console
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        console.log('Google Auth initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        throw new Error('Google Sign-In initialization failed. Please check your configuration.');
      }
    }
  }

  async signIn(): Promise<GoogleUser> {
    try {
      if (this.platform.is('capacitor')) {
        // Use native Google Sign-In for mobile
        console.log('Using native Google Sign-In for mobile');
        console.log('Platform detected as capacitor:', this.platform.is('capacitor'));
        console.log('Available platforms:', this.platform.platforms());
        
        const result = await GoogleAuth.signIn();
        console.log('Google Auth result:', result);
        
        return {
          id: result.id,
          email: result.email,
          name: result.name,
          imageUrl: result.imageUrl,
          idToken: result.authentication.idToken
        };
      } else {
        // Use web-based Google Sign-In for browser
        console.log('Using web Google Sign-In for browser');
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        // For web, we'll use the existing Firebase Auth popup
        const { signInWithPopup } = await import('@angular/fire/auth');
        const result = await signInWithPopup(this.auth, provider);
        
        if (!result.user) {
          throw new Error('No user data received from Google');
        }

        return {
          id: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || 'Google User',
          imageUrl: result.user.photoURL || undefined,
          idToken: await result.user.getIdToken()
        };
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Handle specific errors
      if (error.message?.includes('popup_closed_by_user') || error.message?.includes('cancelled')) {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection.');
      } else if (error.message?.includes('popup_blocked')) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      } else if (error.message?.includes('missing initial state')) {
        throw new Error('Google Sign-In not available on this device. Please use email/password instead.');
      } else if (error.message?.includes('CLIENT_ID') || error.message?.includes('client_id')) {
        throw new Error('Google Sign-In configuration error. Please check your client ID setup.');
      } else if (error.message?.includes('DEVELOPER_ERROR') || error.code === 'DEVELOPER_ERROR') {
        throw new Error('Google Sign-In setup error. Please check your SHA-1 fingerprint and client ID configuration.');
      }
      
      throw new Error(`Google Sign-In failed: ${error.message || error.code || 'Unknown error'}`);
    }
  }

  async signInWithFirebase(): Promise<any> {
    try {
      const googleUser = await this.signIn();
      
      // Create Firebase credential from Google ID token
      const credential = GoogleAuthProvider.credential(googleUser.idToken);
      
      // Sign in to Firebase with the credential
      const result = await signInWithCredential(this.auth, credential);
      
      return result;
    } catch (error) {
      console.error('Firebase Google Sign-In error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.platform.is('capacitor')) {
        await GoogleAuth.signOut();
      }
      // Firebase sign out is handled by AuthService
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  async refresh(): Promise<void> {
    try {
      if (this.platform.is('capacitor')) {
        await GoogleAuth.refresh();
      }
    } catch (error) {
      console.error('Google token refresh error:', error);
      throw error;
    }
  }
}