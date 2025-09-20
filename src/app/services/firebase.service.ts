import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  DocumentReference,
  CollectionReference
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, BehaviorSubject, from, map, switchMap, combineLatest } from 'rxjs';
import { getStorage} from 'firebase/storage';
export interface AppointmentData {
  id?: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  appointmentType: 'clinic' | 'video';
  date: Date;
  time: string;
  symptoms: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  fee: number;
  notes?: string;
  prescription?: string;
  checkedIn?: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionData {
  id?: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  appointmentId?: string;
  diagnosis: string;
  medications: MedicationData[];
  notes?: string;
  followUpDate?: Date;
  status: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationData {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface UserData {
  id?: string;
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Doctor specific fields
  specialization?: string;
  qualification?: string;
  experience?: number; // total years
  consultationFee?: number;
  clinicAddress?: string; // legacy flat address
  isVerified?: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  rating?: number;
  reviewCount?: number;
  totalPatients?: number;
  avatar?: string; // avatar image URL
  bio?: string;
  languages?: string[];
  regNumber?: string;
  showPhone?: boolean;
  // Structured clinic details
  clinicDetails?: {
    name?: string;
    address?: {
      line?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    mapsUrl?: string;
  };
  // Consultation settings
  consultation?: {
    videoEnabled?: boolean;
    clinicEnabled?: boolean;
    videoFee?: number;
    clinicFee?: number;
    paymentMethods?: ('online' | 'cash')[];
  };
  
  // Patient specific fields
  age?: number;
  gender?: string;
  bloodGroup?: string;
  medicalHistory?: string[];
}

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'payment' | 'general';
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage
  ) {
    this.auth.onAuthStateChanged(user => {
      this.currentUser$.next(user);
    });
  }

  // Real-time: patient's completed appointments
  getCompletedAppointmentsByPatient(patientId: string): Observable<AppointmentData[]> {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const q = query(
      appointmentsRef,
      where('patientId', '==', patientId),
      where('status', '==', 'completed')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Coerce Firestore Timestamps to JS Dates when present
          date: doc.data()['date']?.toDate?.() ?? doc.data()['date'],
          completedAt: doc.data()['completedAt']?.toDate?.() ?? doc.data()['completedAt'],
          createdAt: doc.data()['createdAt']?.toDate?.() ?? doc.data()['createdAt'],
          updatedAt: doc.data()['updatedAt']?.toDate?.() ?? doc.data()['updatedAt']
        })) as AppointmentData[];
        observer.next(appointments);
      });
      return unsubscribe;
    });
  }

  // Real-time: live count of patient's completed appointments
  getCompletedAppointmentsCountByPatient(patientId: string): Observable<number> {
    return new Observable<number>(observer => {
      const appointmentsRef = collection(this.firestore, 'appointments');
      const q = query(
        appointmentsRef,
        where('patientId', '==', patientId),
        where('status', '==', 'completed')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        observer.next(snapshot.size);
      });
      return unsubscribe;
    });
  }

  // Real-time stream of doctors by status. Falls back to client-side filter if index is missing.
  getDoctorsByStatusStream(status: 'pending' | 'approved' | 'rejected'): Observable<UserData[]> {
    const usersCol = collection(this.firestore, 'users');
    const primaryQuery = query(
      usersCol,
      where('role', '==', 'doctor'),
      where('kycStatus', '==', status),
      orderBy('createdAt', 'desc')
    );

    return new Observable<UserData[]>(observer => {
      let unsubscribe: (() => void) | undefined;

      const getCreatedAtMs = (d: any) => {
        const ca: any = d?.createdAt;
        if (!ca) return 0;
        // Firestore Timestamp has toMillis; Date has getTime
        if (typeof ca.toMillis === 'function') return ca.toMillis();
        if (ca instanceof Date) return ca.getTime();
        if (typeof ca === 'number') return ca;
        return 0;
      };

      const subscribeWith = (q: any, clientFilter: boolean = false) => {
        unsubscribe = onSnapshot(q, (snapshot: any) => {
          let doctors = snapshot.docs.map((d: any) => {
            const data: any = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data?.['createdAt']?.toDate?.() ?? data?.['createdAt'],
              updatedAt: data?.['updatedAt']?.toDate?.() ?? data?.['updatedAt']
            } as UserData;
          });
          if (clientFilter) {
            doctors = doctors.filter((d: UserData) => (d.kycStatus ?? 'pending') === status && d.role === 'doctor');
            // Sort client-side by createdAt desc
            doctors = doctors.sort((a: any, b: any) => getCreatedAtMs(b) - getCreatedAtMs(a));
          }
          observer.next(doctors);
        }, (err: any) => {
          observer.error(err);
        });
      };

      // Try primary (requires composite index). If it errors with failed-precondition, fallback.
      unsubscribe = onSnapshot(primaryQuery, (snapshot: any) => {
        const doctors = snapshot.docs.map((d: any) => {
          const data: any = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data?.['createdAt']?.toDate?.() ?? data?.['createdAt'],
            updatedAt: data?.['updatedAt']?.toDate?.() ?? data?.['updatedAt']
          } as UserData;
        });
        observer.next(doctors);
      }, (err: any) => {
        if (err?.code === 'failed-precondition') {
          // Fallback 1: role == doctor (no orderBy), filter/sort client-side.
          const fallbackQuery = query(usersCol, where('role', '==', 'doctor'));
          subscribeWith(fallbackQuery, true);
        } else {
          // Try a very lenient fallback once if orderBy/where combination still fails for other reasons
          try {
            const superFallback = usersCol; // no where/orderBy; filter entirely on client
            subscribeWith(superFallback, true);
          } catch (_) {
            observer.error(err);
          }
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }

  // User Management
  async createUser(userData: Partial<UserData>): Promise<string> {
    const usersRef = collection(this.firestore, 'users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateUser(userId: string, userData: Partial<UserData>): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: Timestamp.now()
    });
  }

  // async updateUserProfile(userId: string, userData: Partial<UserData>): Promise<void> {
  //   try {
  //     await updateDoc(doc(this.firestore, 'users', userId), {
  //       ...userData,
  //       updatedAt: new Date()
  //     });
  //   } catch (error) {
  //     console.error('Error updating user profile:', error);
  //     throw error;
  //   }
  // }

  getUserById(userId: string): Observable<UserData | null> {
    const userRef = doc(this.firestore, 'users', userId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data: any = doc.data();
          observer.next({
            id: doc.id,
            ...data,
            createdAt: data?.['createdAt']?.toDate?.() ?? data?.['createdAt'],
            updatedAt: data?.['updatedAt']?.toDate?.() ?? data?.['updatedAt']
          } as UserData);
        } else {
          observer.next(null);
        }
      });
      return unsubscribe;
    });
  }

  getUsersByRole(role: string): Observable<UserData[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', role), where('isActive', '==', true));
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(d => {
          const data: any = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data?.['createdAt']?.toDate?.() ?? data?.['createdAt'],
            updatedAt: data?.['updatedAt']?.toDate?.() ?? data?.['updatedAt']
          } as UserData;
        });
        observer.next(users);
      });
      return unsubscribe;
    });
  }

  // Appointment Management
  async createAppointment(appointmentData: Partial<AppointmentData>): Promise<string> {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const docRef = await addDoc(appointmentsRef, {
      ...appointmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateAppointment(appointmentId: string, appointmentData: Partial<AppointmentData>): Promise<void> {
    const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      ...appointmentData,
      updatedAt: Timestamp.now()
    });
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
    await deleteDoc(appointmentRef);
  }

  getAppointmentsByDoctor(doctorId: string): Observable<AppointmentData[]> {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const q = query(
      appointmentsRef, 
      where('doctorId', '==', doctorId),
      orderBy('date', 'desc')
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data()['date']?.toDate?.() ?? d.data()['date'],
          completedAt: d.data()['completedAt']?.toDate?.() ?? d.data()['completedAt'],
          createdAt: d.data()['createdAt']?.toDate?.() ?? d.data()['createdAt'],
          updatedAt: d.data()['updatedAt']?.toDate?.() ?? d.data()['updatedAt']
        })) as AppointmentData[];
        observer.next(appointments);
      });
      return unsubscribe;
    });
  }

  getAppointmentsByPatient(patientId: string): Observable<AppointmentData[]> {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const q = query(
      appointmentsRef, 
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data()['date']?.toDate?.() ?? d.data()['date'],
          completedAt: d.data()['completedAt']?.toDate?.() ?? d.data()['completedAt'],
          createdAt: d.data()['createdAt']?.toDate?.() ?? d.data()['createdAt'],
          updatedAt: d.data()['updatedAt']?.toDate?.() ?? d.data()['updatedAt']
        })) as AppointmentData[];
        observer.next(appointments);
      });
      return unsubscribe;
    });
  }

  getAppointmentById(appointmentId: string): Observable<AppointmentData | null> {
    const appointmentRef = doc(this.firestore, 'appointments', appointmentId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(appointmentRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          observer.next({
            id: doc.id,
            ...data,
            date: (data as any)['date']?.toDate?.() ?? (data as any)['date'],
            completedAt: (data as any)['completedAt']?.toDate?.() ?? (data as any)['completedAt'],
            createdAt: (data as any)['createdAt']?.toDate?.() ?? (data as any)['createdAt'],
            updatedAt: (data as any)['updatedAt']?.toDate?.() ?? (data as any)['updatedAt']
          } as AppointmentData);
        } else {
          observer.next(null);
        }
      });
      return unsubscribe;
    });
  }

  // Prescription Management
  async createPrescription(prescriptionData: Partial<PrescriptionData>): Promise<string> {
    const prescriptionsRef = collection(this.firestore, 'prescriptions');
    const docRef = await addDoc(prescriptionsRef, {
      ...prescriptionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updatePrescription(prescriptionId: string, prescriptionData: Partial<PrescriptionData>): Promise<void> {
    const prescriptionRef = doc(this.firestore, 'prescriptions', prescriptionId);
    await updateDoc(prescriptionRef, {
      ...prescriptionData,
      updatedAt: Timestamp.now()
    });
  }

  async deletePrescription(prescriptionId: string): Promise<void> {
    const prescriptionRef = doc(this.firestore, 'prescriptions', prescriptionId);
    await deleteDoc(prescriptionRef);
  }

  getPrescriptionsByDoctor(doctorId: string): Observable<PrescriptionData[]> {
    const prescriptionsRef = collection(this.firestore, 'prescriptions');
    const q = query(
      prescriptionsRef, 
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const prescriptions = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data()['createdAt']?.toDate?.() ?? d.data()['createdAt'],
          updatedAt: d.data()['updatedAt']?.toDate?.() ?? d.data()['updatedAt'],
          followUpDate: d.data()['followUpDate']?.toDate?.() ?? d.data()['followUpDate']
        })) as PrescriptionData[];
        observer.next(prescriptions);
      });
      return unsubscribe;
    });
  }

  getPrescriptionsByPatient(patientId: string): Observable<PrescriptionData[]> {
    const prescriptionsRef = collection(this.firestore, 'prescriptions');
    const q = query(
      prescriptionsRef, 
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const prescriptions = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data()['createdAt']?.toDate?.() ?? d.data()['createdAt'],
          updatedAt: d.data()['updatedAt']?.toDate?.() ?? d.data()['updatedAt'],
          followUpDate: d.data()['followUpDate']?.toDate?.() ?? d.data()['followUpDate']
        })) as PrescriptionData[];
        observer.next(prescriptions);
      });
      return unsubscribe;
    });
  }

  // Notification Management
  async createNotification(notificationData: Partial<NotificationData>): Promise<string> {
    const notificationsRef = collection(this.firestore, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(this.firestore, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
  }

  getNotificationsByUser(userId: string): Observable<NotificationData[]> {
    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data()['createdAt']?.toDate?.() ?? d.data()['createdAt']
        })) as NotificationData[];
        observer.next(notifications);
      });
      return unsubscribe;
    });
  }

  // File Upload
async uploadFile(file: File, path: string): Promise<string> {
  const storage = getStorage();              // modular entry point
  const storageRef = ref(storage, path);     // create reference
  await uploadBytes(storageRef, file);     // upload
  return await getDownloadURL(storageRef); // get public URL
}
async updateUserProfile(uid: string, data: Partial<UserData>) {
  const userDoc = doc(this.firestore, 'users', uid);
  return updateDoc(userDoc, data);
}

  async deleteFile(path: string): Promise<void> {
    const fileRef = ref(this.storage, path);
    await deleteObject(fileRef);
  }

  // Analytics and Reports
  getAppointmentStats(doctorId: string, startDate: Date, endDate: Date): Observable<any> {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const q = query(
      appointmentsRef,
      where('doctorId', '==', doctorId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data()['date']?.toDate?.() ?? d.data()['date'],
          completedAt: d.data()['completedAt']?.toDate?.() ?? d.data()['completedAt'],
          createdAt: d.data()['createdAt']?.toDate?.() ?? d.data()['createdAt'],
          updatedAt: d.data()['updatedAt']?.toDate?.() ?? d.data()['updatedAt']
        })) as AppointmentData[];
        
        const stats = {
          totalAppointments: appointments.length,
          completedAppointments: appointments.filter(a => a.status === 'completed').length,
          cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
          pendingAppointments: appointments.filter(a => a.status === 'pending').length,
          totalRevenue: appointments
            .filter(a => a.status === 'completed' || a.paymentMethod === 'online')
            .reduce((sum, a) => sum + a.fee, 0),
          videoConsultations: appointments.filter(a => a.appointmentType === 'video').length,
          clinicVisits: appointments.filter(a => a.appointmentType === 'clinic').length,
          checkedInCount: appointments.filter(a => (a as any).checkedIn === true).length
        };
        
        observer.next(stats);
      });
      return unsubscribe;
    });
  }

  // Doctor verification methods
  async getDoctorsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<UserData[]> {
    try {
      // First, try to get doctors with the kycStatus field
      let q = query(
        collection(this.firestore, 'users'),
        where('role', '==', 'doctor'),
        where('kycStatus', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      let snapshot = await getDocs(q);
      let doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      
      // If no doctors found and looking for pending, also check doctors without kycStatus
      if (doctors.length === 0 && status === 'pending') {
        q = query(
          collection(this.firestore, 'users'),
          where('role', '==', 'doctor'),
          orderBy('createdAt', 'desc')
        );
        
        snapshot = await getDocs(q);
        const allDoctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
        
        // Filter doctors without kycStatus or with pending status
        doctors = allDoctors.filter(doctor => 
          !doctor.kycStatus || doctor.kycStatus === 'pending'
        );
        
        // Update doctors without kycStatus to have pending status
        for (const doctor of doctors) {
          if (!doctor.kycStatus && doctor.id) {
            await updateDoc(doc(this.firestore, 'users', doctor.id), {
              kycStatus: 'pending',
              updatedAt: new Date()
            });
            doctor.kycStatus = 'pending';
          }
        }
      }
      
      return doctors;
    } catch (error) {
      console.error('Error getting doctors by status:', error);
      throw error;
    }
  }

  async updateDoctorVerificationStatus(doctorId: string, status: 'approved' | 'rejected', notes?: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'users', doctorId), {
        kycStatus: status,
        isActive: status === 'approved',
        verificationStatus: status,
        verificationNotes: notes,
        verifiedAt: new Date(),
        updatedAt: new Date()
      });

      // Send notification to doctor
      await this.createNotification({
        userId: doctorId,
        title: `KYC Verification ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: status === 'approved' 
          ? 'Congratulations! Your doctor verification has been approved. You can now start accepting appointments.'
          : `Your doctor verification has been rejected. Reason: ${notes}`,
        type: 'general',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error updating doctor verification status:', error);
      throw error;
    }
  }

  // Admin analytics methods
  async getAdminAnalytics(): Promise<any> {
    try {
      const [users, appointments] = await Promise.all([
        getDocs(collection(this.firestore, 'users')),
        getDocs(collection(this.firestore, 'appointments'))
      ]);

      const userDocs = users.docs.map(doc => doc.data() as UserData);
      const appointmentDocs = appointments.docs.map(doc => doc.data() as AppointmentData);

      return {
        totalUsers: userDocs.length,
        totalDoctors: userDocs.filter(u => u.role === 'doctor').length,
        totalPatients: userDocs.filter(u => u.role === 'patient').length,
        pendingDoctors: userDocs.filter(u => u.role === 'doctor' && u.kycStatus === 'pending').length,
        approvedDoctors: userDocs.filter(u => u.role === 'doctor' && u.kycStatus === 'approved').length,
        totalAppointments: appointmentDocs.length,
        completedAppointments: appointmentDocs.filter(a => a.status === 'completed').length,
        pendingAppointments: appointmentDocs.filter(a => a.status === 'pending').length,
        totalRevenue: appointmentDocs
          .filter(a => a.paymentStatus === 'paid')
          .reduce((sum, a) => sum + a.fee, 0)
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      throw error;
    }
  }

  // User management methods
  async getAllUsers(): Promise<UserData[]> {
    try {
      const q = query(collection(this.firestore, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data: any = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data?.['createdAt']?.toDate?.() ?? data?.['createdAt'],
          updatedAt: data?.['updatedAt']?.toDate?.() ?? data?.['updatedAt']
        } as UserData;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'users', userId), {
        isActive,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Utility methods
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  async sendAppointmentNotification(appointmentData: AppointmentData, type: 'created' | 'updated' | 'cancelled'): Promise<void> {
    const notifications = [];
    
    // Notification for patient
    notifications.push(this.createNotification({
      userId: appointmentData.patientId,
      title: `Appointment ${type}`,
      message: `Your appointment with Dr. ${appointmentData.doctorName} has been ${type}`,
      type: 'appointment',
      isRead: false,
      data: { appointmentId: appointmentData.id }
    }));
    
    // Notification for doctor
    notifications.push(this.createNotification({
      userId: appointmentData.doctorId,
      title: `Appointment ${type}`,
      message: `Appointment with ${appointmentData.patientName} has been ${type}`,
      type: 'appointment',
      isRead: false,
      data: { appointmentId: appointmentData.id }
    }));
    
    await Promise.all(notifications);
  }

  // Video Call Methods
  async setCallOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const callRef = doc(this.firestore, 'videoCalls', callId);
      await updateDoc(callRef, {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error setting call offer:', error);
      throw new Error('Failed to set call offer. Please check Firestore permissions.');
    }
  }

  async setCallAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const callRef = doc(this.firestore, 'videoCalls', callId);
      await updateDoc(callRef, {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        },
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error setting call answer:', error);
      throw new Error('Failed to set call answer. Please check Firestore permissions.');
    }
  }

  getCallOffer(callId: string): Observable<RTCSessionDescriptionInit | null> {
    const callRef = doc(this.firestore, 'videoCalls', callId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(callRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          observer.next(data?.['offer'] || null);
        } else {
          observer.next(null);
        }
      });
      return unsubscribe;
    });
  }

  getCallAnswer(callId: string): Observable<RTCSessionDescriptionInit | null> {
    const callRef = doc(this.firestore, 'videoCalls', callId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(callRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          observer.next(data?.['answer'] || null);
        } else {
          observer.next(null);
        }
      });
      return unsubscribe;
    });
  }

  async addIceCandidate(callId: string, candidate: RTCIceCandidate): Promise<void> {
    try {
      const candidatesRef = collection(this.firestore, 'videoCalls', callId, 'iceCandidates');
      await addDoc(candidatesRef, {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // Don't throw error for ICE candidates as they're not critical
    }
  }

  getIceCandidates(callId: string): Observable<RTCIceCandidateInit[]> {
    const candidatesRef = collection(this.firestore, 'videoCalls', callId, 'iceCandidates');
    const q = query(candidatesRef, orderBy('createdAt', 'asc'));
    
    let lastCandidateCount = 0;
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const candidates = snapshot.docs.map(doc => ({
          candidate: doc.data()['candidate'],
          sdpMLineIndex: doc.data()['sdpMLineIndex'],
          sdpMid: doc.data()['sdpMid']
        }));
        
        // Only emit new candidates to avoid processing duplicates
        if (candidates.length > lastCandidateCount) {
          const newCandidates = candidates.slice(lastCandidateCount);
          lastCandidateCount = candidates.length;
          observer.next(newCandidates);
        }
      });
      return unsubscribe;
    });
  }

  async createVideoCall(appointmentId: string, doctorId: string, patientId: string): Promise<string> {
    const callId = `call_${appointmentId}`;
    const callRef = doc(this.firestore, 'videoCalls', callId);
    
    console.log('Creating video call:', { callId, appointmentId, doctorId, patientId });
    
    try {
      // Use setDoc to create or update the document with the specific ID
      await setDoc(callRef, {
        appointmentId,
        doctorId,
        patientId,
        status: 'waiting',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      console.log('Video call document created successfully');
      
      // Clear any existing signaling data from previous calls
      try {
        // Clear ICE candidates
        const candidatesRef = collection(this.firestore, 'videoCalls', callId, 'iceCandidates');
        const candidatesSnapshot = await getDocs(candidatesRef);
        const deletePromises = candidatesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        // Clear offer and answer
        await updateDoc(callRef, {
          offer: null,
          answer: null
        });
        
        console.log('Cleared existing signaling data');
      } catch (error) {
        console.log('No existing signaling data to clear:', error);
      }
      
      return callId;
    } catch (error) {
      console.error('Error creating video call:', error);
      throw error;
    }
  }

  async endCall(callId: string): Promise<void> {
    const callRef = doc(this.firestore, 'videoCalls', callId);
    await updateDoc(callRef, {
      status: 'ended',
      endedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  getVideoCall(callId: string): Observable<any> {
    const callRef = doc(this.firestore, 'videoCalls', callId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(callRef, (doc) => {
        if (doc.exists()) {
          observer.next({ id: doc.id, ...doc.data() });
        } else {
          observer.next(null);
        }
      });
      return unsubscribe;
    });
  }
}
