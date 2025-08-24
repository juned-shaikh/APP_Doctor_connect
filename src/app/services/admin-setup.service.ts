import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AdminSetupService {
  
  private readonly ADMIN_EMAIL = 'admin@doctorapp.com';
  private readonly ADMIN_PASSWORD = 'Admin123!';
  private readonly ADMIN_NAME = 'Super Administrator';

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  async createSuperAdmin(): Promise<void> {
    try {
      console.log('Creating super admin account...');
      
      // Create admin user in Firebase Auth only
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        this.ADMIN_EMAIL, 
        this.ADMIN_PASSWORD
      );
      
      const adminUser = userCredential.user;
      console.log('✅ Admin user created in Firebase Auth:', adminUser.uid);
      console.log('📧 Email:', this.ADMIN_EMAIL);
      console.log('🔑 Password:', this.ADMIN_PASSWORD);
      
      // Note: Firestore document will be created on first login
      console.log('ℹ️ Admin profile will be created automatically on first login');
      
      return;
      
    } catch (error: any) {
      console.error('❌ Error creating super admin:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin account already exists');
        throw new Error('Admin account already exists. You can login with the provided credentials.');
      }
      
      if (error.code === 'permission-denied' || error.message.includes('permissions')) {
        throw new Error('Firebase permissions issue. Admin account created in Auth but profile will be set up on first login.');
      }
      
      throw error;
    }
  }

  getAdminCredentials() {
    return {
      email: this.ADMIN_EMAIL,
      password: this.ADMIN_PASSWORD
    };
  }
}
