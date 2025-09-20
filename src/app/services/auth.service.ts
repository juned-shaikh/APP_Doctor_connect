import { Injectable } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from '@angular/fire/auth';
import { Firestore, getDoc, query, where, getDocs, collection } from '@angular/fire/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { GoogleAuthService } from './google-auth.service';

export type UserRole = 'doctor' | 'patient' | 'admin';
export type AuthMethod = 'otp' | 'password' | 'google';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface User {
  uid: string;
  email?: string;
  name: string;
  phone?: string;
  role: UserRole;
  userType: UserRole;
  isActive: boolean;
  verificationStatus?: 'pending' | 'under_review' | 'approved' | 'rejected';
  emailVerified?: boolean;
  avatar?: string;
  isRoleLocked?: boolean;
  createdAt: Date;
}

export interface UserRegistration {
  email?: string;
  password?: string;
  name: string;
  phone: string;
  userType: UserRole;
  authMethod: AuthMethod;
  additionalData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);
  private initialUserType = new BehaviorSubject<UserRole | null>(null);

  currentUser$ = this.currentUser.asObservable();
  initialUserType$ = this.initialUserType.asObservable();

  // Make this service accessible globally for debugging
  static instance: AuthService;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private googleAuthService: GoogleAuthService
  ) {
    AuthService.instance = this;

    // Google Auth initialization is handled by GoogleAuthService

    // Listen to auth state changes
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.loadUserData(user.uid);
      } else {
        this.currentUser.next(null);
      }
    });
  }

  private async loadUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        this.currentUser.next({ ...userData, uid: userId });
      } else {
        // Check if this is the admin user and create profile
        const authUser = this.auth.currentUser;
        if (authUser?.email === 'admin@doctorapp.com') {
          await this.createAdminProfile(userId, authUser.email);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private async createAdminProfile(userId: string, email: string) {
    try {
      const adminData = {
        uid: userId,
        email: email,
        name: 'Super Administrator',
        phone: '+1234567890',
        role: 'admin' as UserRole,
        userType: 'admin' as UserRole,
        isActive: true,
        isRoleLocked: true,
        verificationStatus: 'approved' as const,
        createdAt: new Date(),

        // Admin specific permissions
        permissions: [
          'manage_users',
          'verify_doctors',
          'view_analytics',
          'manage_system_settings',
          'access_all_data',
          'manage_revenue'
        ],

        isSuper: true
      };

      await setDoc(doc(this.firestore, 'users', userId), adminData);
      this.currentUser.next({ ...adminData, uid: userId });
      console.log('✅ Admin profile created successfully');
    } catch (error) {
      console.error('Error creating admin profile:', error);
      // Continue with basic user data if Firestore fails
      const basicAdminData = {
        uid: userId,
        email: email,
        name: 'Super Administrator',
        phone: '+1234567890',
        role: 'admin' as UserRole,
        userType: 'admin' as UserRole,
        isActive: true,
        isRoleLocked: true,
        verificationStatus: 'approved' as const,
        createdAt: new Date()
      };
      this.currentUser.next(basicAdminData);
    }
  }

  // Set initial user type from user selection
  setInitialUserType(type: UserRole) {
    this.initialUserType.next(type);
  }

  getInitialUserType(): UserRole | null {
    return this.initialUserType.value;
  }

  // Check for duplicate contacts
  async checkDuplicateContact(phone: string, email?: string): Promise<boolean> {
    try {
      const usersRef = collection(this.firestore, 'users');

      // Check phone number
      const phoneQuery = query(usersRef, where('phone', '==', phone));
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        return true;
      }

      // Check email if provided
      if (email) {
        const emailQuery = query(usersRef, where('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);

        if (!emailSnapshot.empty) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking duplicate contact:', error);
      return false;
    }
  }

  // OTP Registration
  async signUpWithOTP(userType: UserRole, phone: string): Promise<string> {
    try {
      // Ensure phone number is in E.164 format
      const formattedPhone = this.formatPhoneNumber(phone);

      // Initialize reCAPTCHA with better configuration
      const recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });

      console.log('Sending OTP to:', formattedPhone);
      const confirmationResult = await signInWithPhoneNumber(this.auth, formattedPhone, recaptchaVerifier);
      console.log('OTP sent successfully, verificationId:', confirmationResult.verificationId);

      return confirmationResult.verificationId;
    } catch (error: any) {
      console.error('Error sending OTP:', error);

      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please use +country_code format (e.g., +919876543210)');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('Captcha verification failed. Please try again.');
      }

      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }
  }

  // Helper method to format phone number
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If it doesn't start with +, add +91 for India (you can modify this)
    if (!phone.startsWith('+')) {
      if (cleaned.length === 10) {
        return '+91' + cleaned; // Default to India
      } else if (cleaned.length > 10) {
        return '+' + cleaned;
      }
    }

    return phone;
  }

  // Verify OTP and complete registration
  async verifyOTP(verificationId: string, otp: string, userData: UserRegistration): Promise<User> {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(this.auth, credential);

      const newUser: User = {
        uid: userCredential.user.uid,
        name: userData.name,
        phone: userData.phone,
        email: userData.email || '',
        role: userData.userType,
        userType: userData.userType,
        isActive: userData.userType === 'patient', // Auto-verify patients
        isRoleLocked: true,
        verificationStatus: userData.userType === 'doctor' ? 'pending' : 'approved',
        createdAt: new Date()
      };

      // Add kycStatus for doctors and merge additional doctor data
      const userDoc: any = { ...newUser };
      if (userData.userType === 'doctor') {
        userDoc.kycStatus = 'pending';
        if (userData.additionalData) {
          const add = { ...userData.additionalData };
          if (add.experience !== undefined && add.experience !== null) {
            add.experience = Number(add.experience);
          }
          Object.assign(userDoc, add);
        }
      }

      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userDoc);
      this.currentUser.next(newUser);

      return newUser;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  // Password Registration
  async signUpWithPassword(userType: UserRole, userData: UserRegistration): Promise<User> {
    try {
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, userData.password);
      
      // Send email verification
      try {
        await sendEmailVerification(userCredential.user);
        console.log('Email verification sent to:', userData.email);
      } catch (emailError) {
        console.error('Error sending email verification:', emailError);
        // Don't fail registration if email verification fails
      }

      const newUser: User = {
        uid: userCredential.user.uid,
        email: userData.email || '',
        name: userData.name,
        phone: userData.phone,
        role: userData.userType,
        userType: userData.userType,
        isActive: userData.userType === 'patient', // Auto-activate patients
        isRoleLocked: true,
        verificationStatus: userData.userType === 'doctor' ? 'pending' : 'approved',
        emailVerified: false, // Track email verification status
        createdAt: new Date()
      };

      // Add kycStatus for doctors and merge additional doctor data
      const userDoc: any = { ...newUser };
      if (userData.userType === 'doctor') {
        userDoc.kycStatus = 'pending';
        if (userData.additionalData) {
          const add = { ...userData.additionalData };
          if (add.experience !== undefined && add.experience !== null) {
            add.experience = Number(add.experience);
          }
          Object.assign(userDoc, add);
        }
      }

      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userDoc);
      this.currentUser.next(newUser);

      return newUser;
    } catch (error) {
      console.error('Error registering with password:', error);
      throw error;
    }
  }

  // Google Sign-In Registration
  async signUpWithGoogle(userType: UserRole, additionalData?: any): Promise<User> {
    try {
      console.log('🔐 Starting Google Sign-Up for:', userType);

      // Use platform-aware Google Auth service
      const userCredential = await this.googleAuthService.signInWithFirebase();
      console.log('✅ Google authentication successful');

      // Check if user already exists
      const existingUserDoc = await getDoc(doc(this.firestore, 'users', userCredential.user.uid));
      if (existingUserDoc.exists()) {
        throw new Error('Account already exists. Please use login instead.');
      }

      const newUser: User = {
        uid: userCredential.user.uid,
        name: additionalData?.name || userCredential.user.displayName || 'Google User',
        phone: additionalData?.phone || userCredential.user.phoneNumber || '',
        email: userCredential.user.email || '',
        role: userType,
        userType: userType,
        isActive: userType === 'patient',
        isRoleLocked: true,
        verificationStatus: userType === 'doctor' ? 'pending' : 'approved',
        avatar: userCredential.user.photoURL || undefined,
        createdAt: new Date()
      };

      // Add kycStatus for doctors and merge additional data
      const userDoc: any = { ...newUser };
      if (userType === 'doctor') {
        userDoc.kycStatus = 'pending';
        if (additionalData) {
          // Merge doctor-specific fields
          const { name, phone, ...doctorData } = additionalData;
          Object.assign(userDoc, doctorData);
        }
      }

      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), userDoc);
      this.currentUser.next(newUser);

      console.log('✅ User profile created successfully');
      return newUser;
    } catch (error: any) {
      console.error('❌ Error signing up with Google:', error);

      // Handle specific Google Auth errors
      if (error.message?.includes('cancelled') || error.message?.includes('popup_closed_by_user')) {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (error.message?.includes('popup_blocked')) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw new Error(error.message || 'Failed to sign up with Google. Please try again.');
    }
  }

  // Login methods
  async signInWithPassword(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.loadUserData(userCredential.user.uid);
      return this.currentUser.value!;
    } catch (error) {
      console.error('Error signing in with password:', error);
      throw error;
    }
  }

  // Reauthenticate user with password
  async reauthenticateUser(email: string, password: string): Promise<boolean> {
    try {
      const user = this.auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user is currently signed in');
      }

      // If the user signed in with email/password, we need to reauthenticate
      if (user.email === email) {
        const credential = EmailAuthProvider.credential(email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
      }
      
      // For Google sign-in, we can't reauthenticate with password
      const providerData = user.providerData.find(p => p.providerId === 'google.com');
      if (providerData) {
        // Redirect to Google reauthentication
        await this.signInWithGoogle();
        return true;
      }

      throw new Error('Could not reauthenticate user');
    } catch (error) {
      console.error('Error reauthenticating user:', error);
      throw error;
    }
  }

  // Update user's password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user is currently signed in');
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      console.log('Attempting to send password reset email to:', email);
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent successfully to:', email);
    } catch (error: any) {
      console.error('Error sending password reset email:', {
        code: error.code,
        message: error.message,
        email: email,
        timestamp: new Date().toISOString()
      });
      
      if (error.code === 'auth/user-not-found') {
        // For security, we don't reveal if the email exists or not
        console.log('User not found for email:', email);
        throw new Error('If an account exists with this email, you will receive a password reset link.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('The email address is not valid.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/missing-continue-uri') {
        throw new Error('Password reset configuration is missing. Please contact support.');
      } else if (error.code === 'auth/unauthorized-continue-uri') {
        console.error('Unauthorized domain. Check Firebase Authorized domains in console.');
        throw new Error('Password reset is not properly configured. Please contact support.');
      } else {
        console.error('Unexpected error during password reset:', error);
        throw new Error('Failed to send password reset email. Please try again later.');
      }
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      console.log('🔐 Starting Google Sign-In');

      // Use platform-aware Google Auth service
      const userCredential = await this.googleAuthService.signInWithFirebase();
      console.log('✅ Google authentication successful:', userCredential.user);

      // Load or create user data
      await this.loadUserData(userCredential.user.uid);

      let user = this.currentUser.value;
      if (!user) {
        // If no user profile exists, create a basic one for login
        const basicUser: User = {
          uid: userCredential.user.uid,
          name: userCredential.user.displayName || 'Google User',
          email: userCredential.user.email || '',
          phone: userCredential.user.phoneNumber || '',
          role: 'patient', // Default role
          userType: 'patient',
          isActive: true,
          verificationStatus: 'approved',
          avatar: userCredential.user.photoURL || undefined,
          createdAt: new Date()
        };

        // Save to Firestore
        try {
          await setDoc(doc(this.firestore, 'users', userCredential.user.uid), basicUser);
          this.currentUser.next(basicUser);
          user = basicUser;
          console.log('✅ New user profile created for Google sign-in');
        } catch (firestoreError) {
          console.warn('Firestore save failed, continuing with basic profile:', firestoreError);
          this.currentUser.next(basicUser);
          user = basicUser;
        }
      }

      console.log('✅ User signed in successfully:', user.name);
      return user;
    } catch (error: any) {
      console.error('❌ Error signing in with Google:', error);

      // Handle specific Google Auth errors
      if (error.message?.includes('cancelled') || error.message?.includes('popup_closed_by_user')) {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (error.message?.includes('popup_blocked')) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection.');
      } else if (error.message?.includes('unauthorized-domain')) {
        throw new Error('This domain is not authorized for Google Sign-In. Please contact support.');
      } else if (error.message?.includes('operation-not-allowed')) {
        throw new Error('Google Sign-In is not enabled in Firebase Console.');
      } else if (error.message?.includes('argument-error')) {
        throw new Error('Firebase configuration error. Check your Firebase setup.');
      }

      throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
    }
  }

  // Login with OTP (phone) - verifies OTP and loads existing user profile
  async signInWithOTP(verificationId: string, otp: string): Promise<User> {
    try {
      console.log('Verifying OTP:', otp, 'with verificationId:', verificationId);

      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(this.auth, credential);

      console.log('OTP verified successfully, loading user data...');
      await this.loadUserData(userCredential.user.uid);

      const user = this.currentUser.value;
      if (!user) {
        // User authenticated but no profile exists in Firestore (not registered)
        throw new Error('No user profile found. Please register first.');
      }

      console.log('User signed in successfully:', user.name);
      return user;
    } catch (error: any) {
      console.error('Error signing in with OTP:', error);

      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('OTP code has expired. Please request a new one.');
      } else if (error.code === 'auth/invalid-verification-id') {
        throw new Error('Invalid verification session. Please try again.');
      }

      throw new Error(error.message || 'Failed to verify OTP. Please try again.');
    }
  }

  // Add method to send OTP for login (without registration)
  async sendLoginOTP(phone: string): Promise<string> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Check if user exists first
      const usersRef = collection(this.firestore, 'users');
      const phoneQuery = query(usersRef, where('phone', '==', formattedPhone));
      const phoneSnapshot = await getDocs(phoneQuery);

      if (phoneSnapshot.empty) {
        throw new Error('No account found with this phone number. Please register first.');
      }

      // Initialize reCAPTCHA for login
      const recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA solved for login:', response);
        }
      });

      console.log('Sending login OTP to:', formattedPhone);
      const confirmationResult = await signInWithPhoneNumber(this.auth, formattedPhone, recaptchaVerifier);

      return confirmationResult.verificationId;
    } catch (error: any) {
      console.error('Error sending login OTP:', error);
      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Sign out from Google if user signed in with Google
      try {
        await this.googleAuthService.signOut();
      } catch (googleError) {
        console.warn('Google sign out failed:', googleError);
        // Continue with Firebase sign out even if Google sign out fails
      }

      await signOut(this.auth);
      this.currentUser.next(null);
      this.initialUserType.next(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser.value;
  }

  // Lock user role (prevent role switching)
  async lockUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      await setDoc(doc(this.firestore, 'users', userId), {
        isRoleLocked: true,
        userType: role
      }, { merge: true });
    } catch (error) {
      console.error('Error locking user role:', error);
      throw error;
    }
  }

  // Prevent role change
  preventRoleChange(userId: string): boolean {
    const user = this.currentUser.value;
    return user?.isRoleLocked || false;
  }

  // Test method for debugging Firebase Auth
  async testFirebaseAuth(): Promise<void> {
    try {
      console.log('🧪 Testing Firebase Auth Setup...');
      console.log('Firebase Auth instance:', this.auth);
      console.log('Current user:', this.auth.currentUser);
      console.log('Auth app:', this.auth.app);
      console.log('Auth config:', this.auth.config);

      // Test Google provider creation
      const provider = new GoogleAuthProvider();
      console.log('Google provider created:', provider);

      // Test if we can create a popup (without actually signing in)
      console.log('Testing popup capability...');

      console.log('✅ Firebase Auth test completed');
    } catch (error) {
      console.error('❌ Firebase Auth test failed:', error);
    }
  }

  // Test method for debugging OTP
  async testOTPSetup(): Promise<void> {
    try {
      console.log('🧪 Testing OTP Setup...');
      console.log('Firebase Auth instance:', this.auth);
      console.log('Current user:', this.auth.currentUser);

      // Test reCAPTCHA container
      const container = document.getElementById('recaptcha-container');
      console.log('reCAPTCHA container found:', !!container);

      // Test phone number formatting
      const testPhone = '+919876543210';
      const formatted = this.formatPhoneNumber(testPhone);
      console.log('Phone formatting test:', testPhone, '→', formatted);

      console.log('✅ OTP setup test completed');
    } catch (error) {
      console.error('❌ OTP setup test failed:', error);
    }
  }
}