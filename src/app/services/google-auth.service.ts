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
  accessToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  constructor(
    private platform: Platform,
    private auth: Auth
  ) {
    // Don't initialize immediately in constructor
    // Initialize only when needed (lazy initialization)
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this.initializeGoogleAuth();
    await this.initializationPromise;
  }
  
  private async initializeGoogleAuth(): Promise<void> {
    if (!this.platform.is('capacitor')) {
      this.isInitialized = true;
      return;
    }
    
    try {
      console.log('🔍 Environment Check:');
      console.log('- Package Name:', 'com.Js.DoctorConnect');
      console.log('- Platform:', this.platform.platforms());
      console.log('- Is Physical Device:', !this.platform.is('mobileweb'));
      console.log('- User Agent:', navigator.userAgent);
      
      console.log('🚀 Initializing Google Auth for mobile...');
      await GoogleAuth.initialize({
        clientId: '1041888734011-tivpcn8efo5723ks6q6vs1rh8e87teh2.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      
      console.log('✅ Google Auth initialized successfully');
      this.isInitialized = true;
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Auth:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        platform: this.platform.platforms()
      });
      this.isInitialized = false;
      throw error;
    }
  }

  async signIn(): Promise<GoogleUser> {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Google Sign-In attempt ${attempt}/${maxRetries}`);
        
        if (this.platform.is('capacitor')) {
          // Use native Google Sign-In for mobile
          console.log('📱 Using native Google Sign-In for mobile');
          console.log('Platform detected as capacitor:', this.platform.is('capacitor'));
          console.log('Available platforms:', this.platform.platforms());
          
          // Ensure Google Auth is initialized before attempting sign-in
          console.log('🔄 Ensuring Google Auth is initialized...');
          await this.ensureInitialized();
          
          console.log('🚀 Starting Google Auth sign-in...');
          const result = await GoogleAuth.signIn();
          console.log('✅ Google Auth result:', {
            id: result.id,
            email: result.email,
            name: result.name,
            hasIdToken: !!result.authentication?.idToken,
            hasAccessToken: !!result.authentication?.accessToken
          });
        
          return {
            id: result.id,
            email: result.email,
            name: result.name,
            imageUrl: result.imageUrl,
            idToken: result.authentication.idToken,
            accessToken: result.authentication.accessToken
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
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          platform: this.platform.platforms(),
          attempt: attempt
        });
        
        if (attempt === maxRetries) {
          break; // Exit retry loop
        }
        
        // Wait before retry
        console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Handle the final error after all retries
    if (lastError) {
      console.error('❌ Final Google Sign-In error after all retries:', lastError);
      console.error('Error code:', lastError.code);
      console.error('Error message:', lastError.message);
      console.error('Full error object:', JSON.stringify(lastError, null, 2));
      
      // Handle specific errors with more detailed messages
      if (lastError.message?.includes('popup_closed_by_user') || lastError.message?.includes('cancelled')) {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (lastError.message?.includes('network') || lastError.code === 'network_error') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (lastError.message?.includes('popup_blocked')) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      } else if (lastError.message?.includes('missing initial state')) {
        throw new Error('Google Sign-In not available on this device. Please use email/password instead.');
      } else if (lastError.message?.includes('CLIENT_ID') || lastError.message?.includes('client_id')) {
        throw new Error('Google Sign-In configuration error. Please check your client ID setup.');
      } else if (lastError.message?.includes('DEVELOPER_ERROR') || lastError.code === 'DEVELOPER_ERROR') {
        throw new Error('Google Sign-In setup error. Please check your SHA-1 fingerprint and client ID configuration.');
      } else if (lastError.message?.includes('Google Play Services')) {
        throw new Error('Google Play Services not available. Please install Google Play Services on your device.');
      } else if (lastError.code === '12500' || lastError.message?.includes('12500')) {
        throw new Error('Google Sign-In configuration error. The app is not properly configured for Google Sign-In.');
      } else if (lastError.code === '7' || lastError.message?.includes('NETWORK_ERROR')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw new Error(`Google Sign-In failed: ${lastError.message || lastError.code || 'Unknown error'}`);
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Google Sign-In failed: Unknown error');
  }

  async signInWithFirebase(): Promise<any> {
    try {
      console.log('🔍 Debug Info:');
      console.log('Platform:', this.platform.platforms());
      console.log('Is Capacitor:', this.platform.is('capacitor'));
      console.log('Is Android:', this.platform.is('android'));
      console.log('Is iOS:', this.platform.is('ios'));
      
      if (this.platform.is('capacitor')) {
        console.log('📱 Starting mobile Google Sign-In...');
        
        // Ensure Google Auth is initialized
        await this.ensureInitialized();
        
        // For mobile, get the Google Auth result
        console.log('Getting Google Auth result for mobile Firebase sign-in...');
        const result = await GoogleAuth.signIn();
        console.log('✅ Google Auth successful:', {
          id: result.id,
          email: result.email,
          name: result.name,
          hasIdToken: !!result.authentication?.idToken,
          hasAccessToken: !!result.authentication?.accessToken,
          idTokenLength: result.authentication?.idToken?.length || 0
        });
        
        // Validate that we have the required tokens
        if (!result.authentication?.idToken) {
          throw new Error('No ID token received from Google Auth');
        }
        
        console.log('ID Token received:', result.authentication.idToken.substring(0, 50) + '...');
        
        // Create Firebase credential with ONLY the ID token
        // Do NOT pass the access token as it can cause auth/invalid-credential
        const credential = GoogleAuthProvider.credential(
          result.authentication.idToken,
          null // Explicitly set access token to null
        );
        
        console.log('Created Firebase credential with ID token only');
        
        // Sign in to Firebase with the credential
        const firebaseResult = await signInWithCredential(this.auth, credential);
        console.log('Firebase sign-in successful:', firebaseResult.user?.email);
        
        return firebaseResult;
      } else {
        // For web, use Firebase's built-in popup
        console.log('Using web Google Sign-In for browser');
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const { signInWithPopup } = await import('@angular/fire/auth');
        const result = await signInWithPopup(this.auth, provider);
        
        return result;
      }
    } catch (error: any) {
      console.error('❌ Firebase Google Sign-In error:', error);
      console.error('❌ Detailed Error Info:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        customData: error.customData,
        platform: this.platform.platforms(),
        timestamp: new Date().toISOString(),
        fullError: JSON.stringify(error, null, 2)
      });
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/invalid-credential') {
        console.error('Invalid credential error - this usually means the token format is wrong');
        throw new Error('Google Sign-In authentication failed. The token format is invalid.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      
      throw new Error(`Google Sign-In failed: ${error.message || error.code || 'Unknown error'}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.platform.is('capacitor') && this.isInitialized) {
        console.log('🚪 Signing out from Google Auth...');
        await GoogleAuth.signOut();
        console.log('✅ Google Auth sign out successful');
      }
      // Firebase sign out is handled by AuthService
    } catch (error) {
      console.error('❌ Google Sign-Out error:', error);
      // Don't throw error for sign out failures
      console.warn('Google sign out failed, but continuing...');
    }
  }

  async refresh(): Promise<void> {
    try {
      if (this.platform.is('capacitor') && this.isInitialized) {
        console.log('🔄 Refreshing Google Auth token...');
        await GoogleAuth.refresh();
        console.log('✅ Google Auth token refresh successful');
      }
    } catch (error) {
      console.error('❌ Google token refresh error:', error);
      throw error;
    }
  }
}