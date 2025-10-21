import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
  IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonButton
} from '@ionic/angular/standalone';
import { FirebaseService } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import {
  analyticsOutline, trendingUpOutline, peopleOutline, calendarOutline,
  medicalOutline, cardOutline, timeOutline, statsChartOutline, starOutline,
  checkmarkCircleOutline, cashOutline, chevronDownOutline, star
} from 'ionicons/icons';
import { collection } from 'firebase/firestore';

interface DoctorAnalytics {
  uid: string;
  name: string;
  email: string;
  specialization: string;
  profileImage?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  totalAppointments: number;
  completedAppointments: number;
  totalEarnings: number;
  uniquePatients: number;
  completionRate: number;
  avgResponseTime: number;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
    IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonButton
  ]
})

export class AnalyticsPage implements OnInit {

  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  selectedDoctorView: 'top' | 'all' = 'top';
  isLoading = false;
  doctorsPerPage = 5;
  currentDoctorPage = 1;

  // Analytics data
  totalStats = {
    users: 0,
    doctors: 0,
    patients: 0,
    appointments: 0,
    revenue: 0,
    completedAppointments: 0
  };

  growthStats = {
    usersGrowth: 0,
    appointmentsGrowth: 0,
    revenueGrowth: 0,
    doctorsGrowth: 0
  };

  appointmentStats: { [key: string]: number } = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  };

  topSpecializations: { name: string; count: number; percentage: number }[] = [];

  // Doctor Analytics Data
  doctorAnalytics = {
    totalActiveDoctors: 0,
    verifiedDoctors: 0,
    pendingVerification: 0,
    averageRating: 0,
    totalReviews: 0,
    averageResponseTime: 0,
    onTimeDoctors: 0
  };

  doctorsList: DoctorAnalytics[] = [];
  displayedDoctors: DoctorAnalytics[] = [];

  constructor(
    private firebaseService: FirebaseService
  ) {
    addIcons({
      analyticsOutline, trendingUpOutline, peopleOutline, calendarOutline,
      medicalOutline, cardOutline, timeOutline, statsChartOutline, starOutline,
      checkmarkCircleOutline, cashOutline, chevronDownOutline, star
    });
  }

  ngOnInit() {
    console.log('🚀 Admin Analytics Page Initialized');
    this.testFirebaseConnection();
    this.loadAnalytics();
    this.loadDoctorAnalytics();
  }

  async testFirebaseConnection() {
    try {
      console.log('🧪 Testing Firebase connection...');

      // Test if we can access Firebase at all
      const testCollection = collection(this.firebaseService['firestore'], 'users');
      console.log('✅ Firebase connection successful');

      // Test if getAdminAnalytics method exists
      if (typeof this.firebaseService.getAdminAnalytics === 'function') {
        console.log('✅ getAdminAnalytics method exists');
      } else {
        console.error('❌ getAdminAnalytics method not found');
      }

    } catch (error) {
      console.error('❌ Firebase connection test failed:', error);
    }
  }

  async debugLoadData() {
    console.log('🐛 DEBUG: Manual data load triggered');
    console.log('🐛 Current totalStats:', this.totalStats);
    console.log('🐛 Current appointmentStats:', this.appointmentStats);
    console.log('🐛 Current isLoading:', this.isLoading);

    try {
      console.log('🐛 Calling getAdminAnalytics directly...');
      const result = await this.firebaseService.getAdminAnalytics();
      console.log('🐛 Direct call result:', result);

      if (result) {
        console.log('🐛 Updating stats manually...');
        this.totalStats = {
          users: result.totalUsers || 0,
          doctors: result.totalDoctors || 0,
          patients: result.totalPatients || 0,
          appointments: result.totalAppointments || 0,
          revenue: result.totalRevenue || 0,
          completedAppointments: result.completedAppointments || 0
        };
        console.log('🐛 Updated totalStats:', this.totalStats);
      }
    } catch (error) {
      console.error('🐛 Debug call failed:', error);
    }
  }

  async loadAnalytics() {
    this.isLoading = true;
    try {
      console.log('🔄 Loading admin analytics for period:', this.selectedPeriod);
      const stats = await this.firebaseService.getAdminAnalytics(this.selectedPeriod);
      console.log('📊 Admin analytics received:', stats);

      if (!stats) {
        console.error('❌ No stats received from Firebase');
        throw new Error('No data received');
      }

      // Update total stats
      this.totalStats = {
        users: stats.totalUsers || 0,
        doctors: stats.totalDoctors || 0,
        patients: stats.totalPatients || 0,
        appointments: stats.totalAppointments || 0,
        revenue: stats.totalRevenue || 0,
        completedAppointments: stats.completedAppointments || 0
      };

      console.log('📈 Updated totalStats:', this.totalStats);

      // Update appointment status breakdown
      this.appointmentStats = {
        pending: stats.pendingAppointments || 0,
        confirmed: 0, // We don't have confirmed status, using 0
        completed: stats.completedAppointments || 0,
        cancelled: (stats.totalAppointments || 0) - (stats.completedAppointments || 0) - (stats.pendingAppointments || 0)
      };

      console.log('📋 Updated appointmentStats:', this.appointmentStats);

      // Load specializations data
      await this.loadSpecializationsData();

      // Calculate growth stats (for now using mock data, but you can implement period comparison)
      this.growthStats = {
        usersGrowth: 12.5, // Mock data - implement period comparison for real growth
        appointmentsGrowth: 8.3,
        revenueGrowth: 15.7,
        doctorsGrowth: 5.2
      };

      console.log('✅ Analytics loading completed successfully for period:', this.selectedPeriod);

    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      // Set default values on error
      this.totalStats = {
        users: 0,
        doctors: 0,
        patients: 0,
        appointments: 0,
        revenue: 0,
        completedAppointments: 0
      };

      this.appointmentStats = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      };

      console.log('🔄 Using fallback data due to error');
    } finally {
      this.isLoading = false;
      console.log('🏁 Analytics loading finished, isLoading:', this.isLoading);
    }
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadAnalytics();
    this.loadDoctorAnalytics();
  }

  onDoctorViewChange(event: any) {
    this.selectedDoctorView = event.detail.value;
    this.currentDoctorPage = 1;
    this.updateDisplayedDoctors();
  }

  async loadSpecializationsData() {
    try {
      console.log('Loading specializations data...');
      const doctorData = await this.firebaseService.getDoctorAnalytics(this.selectedPeriod);

      if (doctorData && doctorData.doctors && doctorData.doctors.length > 0) {
        // Count specializations from live doctor data
        const specializationCounts: { [key: string]: number } = {};

        doctorData.doctors.forEach((doctor: any) => {
          const spec = doctor.specialization || 'General Medicine';
          specializationCounts[spec] = (specializationCounts[spec] || 0) + doctor.totalAppointments;
        });

        // Convert to array and calculate percentages
        const totalAppointments = Object.values(specializationCounts).reduce((sum: number, count: number) => sum + count, 0);

        this.topSpecializations = Object.entries(specializationCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 specializations

        console.log('Live specializations data:', this.topSpecializations);
      } else {
        // Fallback to default data if no live data
        this.topSpecializations = [
          { name: 'General Medicine', count: 0, percentage: 0 }
        ];
      }
    } catch (error) {
      console.error('Error loading specializations:', error);
      this.topSpecializations = [];
    }
  }

  async loadDoctorAnalytics() {
    try {
      console.log('Loading doctor analytics for period:', this.selectedPeriod);
      const doctorData = await this.firebaseService.getDoctorAnalytics(this.selectedPeriod);
      console.log('Doctor analytics data received:', doctorData);

      if (doctorData) {
        this.doctorAnalytics = {
          totalActiveDoctors: doctorData.totalActiveDoctors || 0,
          verifiedDoctors: doctorData.verifiedDoctors || 0,
          pendingVerification: doctorData.pendingVerification || 0,
          averageRating: doctorData.averageRating || 0,
          totalReviews: doctorData.totalReviews || 0,
          averageResponseTime: doctorData.averageResponseTime || 0,
          onTimeDoctors: doctorData.onTimeDoctors || 0
        };

        if (doctorData.doctors && doctorData.doctors.length > 0) {
          this.doctorsList = doctorData.doctors;
          console.log('Using live doctor analytics data with', this.doctorsList.length, 'doctors');
        } else {
          console.log('No doctors found in live data');
          this.doctorsList = [];
        }
      } else {
        console.log('No analytics data received');
        this.doctorsList = [];
        this.doctorAnalytics = {
          totalActiveDoctors: 0,
          verifiedDoctors: 0,
          pendingVerification: 0,
          averageRating: 0,
          totalReviews: 0,
          averageResponseTime: 0,
          onTimeDoctors: 0
        };
      }

      this.updateDisplayedDoctors();
    } catch (error) {
      console.error('Error loading doctor analytics:', error);
      this.doctorsList = [];
      this.updateDisplayedDoctors();
    }
  }

  updateDisplayedDoctors() {
    if (this.selectedDoctorView === 'top') {
      // Show top 5 doctors by rating and completion rate
      this.displayedDoctors = this.doctorsList
        .sort((a, b) => (b.rating * b.completionRate) - (a.rating * a.completionRate))
        .slice(0, 5);
    } else {
      // Show paginated list of all doctors
      const startIndex = 0;
      const endIndex = this.currentDoctorPage * this.doctorsPerPage;
      this.displayedDoctors = this.doctorsList.slice(startIndex, endIndex);
    }
  }

  loadMoreDoctors() {
    this.currentDoctorPage++;
    this.updateDisplayedDoctors();
  }

  getResponseTimePercentage(responseTime: number): number {
    // Convert response time to percentage (lower is better)
    // Assuming 24 hours is 0% and 1 hour is 100%
    return Math.max(0, Math.min(100, 100 - ((responseTime - 1) * 4.35)));
  }

  generateMockDoctorData(): DoctorAnalytics[] {
    return [
      {
        uid: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        specialization: 'Cardiology',
        isVerified: true,
        isActive: true,
        rating: 4.8,
        totalReviews: 156,
        totalAppointments: 234,
        completedAppointments: 218,
        totalEarnings: 125000,
        uniquePatients: 189,
        completionRate: 93,
        avgResponseTime: 2.5
      },
      {
        uid: '2',
        name: 'Dr. Michael Chen',
        email: 'michael.chen@example.com',
        specialization: 'Dermatology',
        isVerified: true,
        isActive: true,
        rating: 4.6,
        totalReviews: 98,
        totalAppointments: 187,
        completedAppointments: 172,
        totalEarnings: 89000,
        uniquePatients: 145,
        completionRate: 92,
        avgResponseTime: 1.8
      },
      {
        uid: '3',
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        specialization: 'Pediatrics',
        isVerified: true,
        isActive: true,
        rating: 4.9,
        totalReviews: 203,
        totalAppointments: 298,
        completedAppointments: 285,
        totalEarnings: 156000,
        uniquePatients: 234,
        completionRate: 96,
        avgResponseTime: 1.2
      },
      {
        uid: '4',
        name: 'Dr. James Wilson',
        email: 'james.wilson@example.com',
        specialization: 'Orthopedics',
        isVerified: false,
        isActive: true,
        rating: 4.3,
        totalReviews: 67,
        totalAppointments: 123,
        completedAppointments: 108,
        totalEarnings: 67000,
        uniquePatients: 89,
        completionRate: 88,
        avgResponseTime: 3.2
      },
      {
        uid: '5',
        name: 'Dr. Lisa Thompson',
        email: 'lisa.thompson@example.com',
        specialization: 'General Medicine',
        isVerified: true,
        isActive: true,
        rating: 4.7,
        totalReviews: 134,
        totalAppointments: 201,
        completedAppointments: 189,
        totalEarnings: 98000,
        uniquePatients: 167,
        completionRate: 94,
        avgResponseTime: 2.1
      }
    ];
  }

  getGrowthColor(growth: number): string {
    return growth >= 0 ? 'success' : 'danger';
  }

  getGrowthIcon(growth: number): string {
    return growth >= 0 ? 'trending-up-outline' : 'trending-down-outline';
  }

  getAppointmentStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getPeriodTitle(): string {
    switch (this.selectedPeriod) {
      case 'week':
        return 'Last 7 Days';
      case 'year':
        return 'This Year';
      default:
        return 'This Month';
    }
  }

  getPeriodDateRange(): string {
    const now = new Date();
    let startDate: Date;

    switch (this.selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        return `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        return `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    }
  }

  async checkDoctorsInDatabase() {
    console.log('🔍 Checking doctors in database...');

    try {
      // Get all users
      const allUsers = await this.firebaseService.getAllUsers();
      console.log('👥 Total users in database:', allUsers.length);

      if (allUsers.length === 0) {
        console.log('❌ No users found in database');
        alert('No users found in database. Please register some users first.');
        return;
      }

      // Show all users
      console.log('👥 All users:', allUsers);

      // Filter doctors
      const allDoctors = allUsers.filter(u => u.role === 'doctor');
      console.log('👨‍⚕️ Total doctors:', allDoctors.length);

      if (allDoctors.length === 0) {
        console.log('❌ No doctors found');
        alert('No doctors found in database. Please register some doctors first.');
        return;
      }

      // Check doctor status
      console.log('👨‍⚕️ Doctor details:');
      allDoctors.forEach((doctor, index) => {
        console.log(`Doctor ${index + 1}:`, {
          name: doctor.name,
          email: doctor.email,
          role: doctor.role,
          isActive: doctor.isActive,
          kycStatus: doctor.kycStatus,
          uid: doctor.uid || doctor.id
        });
      });

      // Count active doctors
      const activeDoctors = allDoctors.filter(d => d.isActive !== false);
      const verifiedDoctors = allDoctors.filter(d => d.kycStatus === 'approved');

      console.log('✅ Active doctors:', activeDoctors.length);
      console.log('✅ Verified doctors:', verifiedDoctors.length);

      alert(`Found ${allDoctors.length} doctors total:\n- ${activeDoctors.length} active\n- ${verifiedDoctors.length} verified\n\nCheck console for details.`);

    } catch (error: any) {
      console.error('❌ Error checking database:', error);
      alert('Error checking database: ' + error.message);
    }
  }
}
