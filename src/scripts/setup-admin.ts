import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Super Admin credentials
const ADMIN_EMAIL = 'admin@doctorapp.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME = 'Super Administrator';

async function createSuperAdmin() {
  try {
    console.log('Creating super admin account...');
    
    // Create admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const adminUser = userCredential.user;
    
    console.log('Admin user created in Firebase Auth:', adminUser.uid);
    
    // Create admin user document in Firestore
    const adminData = {
      uid: adminUser.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      phone: '+1234567890',
      role: 'admin',
      userType: 'admin',
      isActive: true,
      isRoleLocked: true,
      verificationStatus: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Admin specific permissions
      permissions: [
        'manage_users',
        'verify_doctors',
        'view_analytics',
        'manage_system_settings',
        'access_all_data',
        'manage_revenue'
      ],
      
      // Admin profile
      avatar: '',
      lastLogin: new Date(),
      isSuper: true
    };
    
    // Save admin data to Firestore
    await setDoc(doc(db, 'users', adminUser.uid), adminData);
    
    console.log('✅ Super admin account created successfully!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🆔 UID:', adminUser.uid);
    
    // Create initial system settings
    await setDoc(doc(db, 'system', 'settings'), {
      platformName: 'MyDoctor Connect',
      version: '1.0.0',
      maintenanceMode: false,
      registrationEnabled: true,
      doctorVerificationRequired: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ System settings initialized');
    
    // Create sample analytics data
    await setDoc(doc(db, 'analytics', 'overview'), {
      totalUsers: 0,
      totalDoctors: 0,
      totalPatients: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      lastUpdated: new Date()
    });
    
    console.log('✅ Analytics collection initialized');
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin account already exists. You can login with:');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('🔑 Password:', ADMIN_PASSWORD);
    }
    
    process.exit(1);
  }
}

// Run the setup
createSuperAdmin();
