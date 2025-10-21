import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
  IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
  IonButton, IonSearchbar, IonSelect, IonSelectOption, ToastController
} from '@ionic/angular/standalone';
import { FirebaseService } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  cashOutline, cardOutline, medicalOutline, checkmarkCircleOutline,
  trendingUpOutline, calendarOutline, eyeOutline, downloadOutline,
  refreshOutline, searchOutline, bugOutline
} from 'ionicons/icons';

interface DoctorRevenue {
  uid: string;
  name: string;
  email: string;
  specialization: string;
  profileImage?: string;
  isVerified: boolean;
  isActive: boolean;
  totalRevenue: number;
  doctorEarnings: number;
  platformCommission: number;
  totalAppointments: number;
  paidAppointments: number;
  avgRevenuePerAppointment: number;
  paymentSuccessRate: number;
}

@Component({
  selector: 'app-revenue',
  templateUrl: './revenue.page.html',
  styleUrls: ['./revenue.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
    IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
    IonButton, IonSearchbar, IonSelect, IonSelectOption
  ]
})
export class RevenuePage implements OnInit {
  
  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  isLoading = false;
  searchTerm = '';
  sortBy: 'revenue' | 'appointments' | 'name' | 'commission' = 'revenue';
  
  // Revenue summary data
  totalRevenue = 0;
  platformCommission = 0;
  doctorEarnings = 0;
  paidAppointments = 0;
  totalAppointments = 0;
  revenueGrowth = 15.2;
  commissionRate = 15; // 15% platform commission

  // Doctor revenue data
  doctorRevenueList: DoctorRevenue[] = [];
  filteredDoctors: DoctorRevenue[] = [];

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private toastController: ToastController
  ) {
    addIcons({
      cashOutline, cardOutline, medicalOutline, checkmarkCircleOutline,
      trendingUpOutline, calendarOutline, eyeOutline, downloadOutline,
      refreshOutline, searchOutline, bugOutline
    });
  }

  ngOnInit() {
    this.loadRevenueData();
  }

  async loadRevenueData() {
    this.isLoading = true;
    try {
      console.log('Loading revenue data for period:', this.selectedPeriod);
      const revenueData = await this.firebaseService.getRevenueAnalytics(this.selectedPeriod);
      console.log('Revenue data received:', revenueData);
      
      if (revenueData) {
        // Always use the structure from Firebase, even if empty
        this.totalRevenue = revenueData.totalRevenue || 0;
        this.platformCommission = this.totalRevenue * (this.commissionRate / 100);
        this.doctorEarnings = this.totalRevenue - this.platformCommission;
        this.paidAppointments = revenueData.paidAppointments || 0;
        this.totalAppointments = revenueData.totalAppointments || 0;
        
        if (revenueData.doctors && revenueData.doctors.length > 0) {
          this.doctorRevenueList = revenueData.doctors;
          console.log('Using live data with', this.doctorRevenueList.length, 'doctors');
        } else {
          // No doctors found in live data, but still show the summary stats
          console.log('No doctors found in live data, using mock data for display');
          this.doctorRevenueList = this.generateMockRevenueData();
        }
      } else {
        // Fallback to mock data
        console.log('No live data available, using mock data');
        this.doctorRevenueList = this.generateMockRevenueData();
        this.calculateSummaryFromMockData();
      }
      
      this.filterAndSortDoctors();
    } catch (error) {
      console.error('Error loading revenue data:', error);
      // Use mock data if Firebase method doesn't exist yet
      console.log('Falling back to mock data due to error');
      this.doctorRevenueList = this.generateMockRevenueData();
      this.calculateSummaryFromMockData();
      this.filterAndSortDoctors();
    } finally {
      this.isLoading = false;
    }
  }

  calculateSummaryFromMockData() {
    this.totalRevenue = this.doctorRevenueList.reduce((sum, doctor) => sum + doctor.totalRevenue, 0);
    this.platformCommission = this.totalRevenue * (this.commissionRate / 100);
    this.doctorEarnings = this.totalRevenue - this.platformCommission;
    this.paidAppointments = this.doctorRevenueList.reduce((sum, doctor) => sum + doctor.paidAppointments, 0);
    this.totalAppointments = this.doctorRevenueList.reduce((sum, doctor) => sum + doctor.totalAppointments, 0);
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadRevenueData();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterAndSortDoctors();
  }

  onSortChange(event: any) {
    this.sortBy = event.detail.value;
    this.filterAndSortDoctors();
  }

  filterAndSortDoctors() {
    let filtered = this.doctorRevenueList;

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(term) ||
        doctor.email.toLowerCase().includes(term) ||
        doctor.specialization.toLowerCase().includes(term)
      );
    }

    // Sort by selected criteria
    switch (this.sortBy) {
      case 'revenue':
        filtered.sort((a, b) => b.totalRevenue - a.totalRevenue);
        break;
      case 'appointments':
        filtered.sort((a, b) => b.totalAppointments - a.totalAppointments);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'commission':
        filtered.sort((a, b) => b.platformCommission - a.platformCommission);
        break;
    }

    this.filteredDoctors = filtered;
  }

  async refreshData() {
    await this.loadRevenueData();
    this.showToast('Revenue data refreshed successfully', 'success');
  }

  async testFirebaseData() {
    try {
      console.log('=== Testing Firebase Data ===');
      
      // Test admin analytics first
      const adminAnalytics = await this.firebaseService.getAdminAnalytics();
      console.log('Admin analytics:', adminAnalytics);
      
      // Test if we can find Dr. Mubeen specifically
      console.log('=== Looking for Dr. Mubeen ===');
      
      // Get all users to see the structure
      const allUsers = await this.firebaseService.getAllUsers();
      console.log('All users count:', allUsers.length);
      
      const doctors = allUsers.filter(u => u.role === 'doctor');
      console.log('Doctors found:', doctors.length);
      
      const mubeen = doctors.find(d => d.name.toLowerCase().includes('mubeen'));
      if (mubeen) {
        console.log('Found Dr. Mubeen:', mubeen);
        console.log('Dr. Mubeen UID:', mubeen.uid || mubeen.id);
      } else {
        console.log('Dr. Mubeen not found in doctors list');
        console.log('Available doctors:', doctors.map(d => d.name));
      }
      
      this.showToast('Check console for detailed Firebase data', 'success');
    } catch (error) {
      console.error('Error testing Firebase data:', error);
      this.showToast('Error testing Firebase data - check console', 'danger');
    }
  }

  viewDoctorDetails(doctor: DoctorRevenue) {
    // Navigate to detailed doctor revenue page or show modal
    this.router.navigate(['/admin/doctor-revenue', doctor.uid]);
  }

  downloadReport(doctor: DoctorRevenue) {
    // Generate and download revenue report for specific doctor
    this.showToast(`Downloading report for ${doctor.name}`, 'success');
    // Implementation for report generation would go here
  }

  generateMockRevenueData(): DoctorRevenue[] {
    return [
      {
        uid: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        specialization: 'Cardiology',
        isVerified: true,
        isActive: true,
        totalRevenue: 125000,
        doctorEarnings: 106250,
        platformCommission: 18750,
        totalAppointments: 234,
        paidAppointments: 218,
        avgRevenuePerAppointment: 573,
        paymentSuccessRate: 93
      },
      {
        uid: '2',
        name: 'Dr. Michael Chen',
        email: 'michael.chen@example.com',
        specialization: 'Dermatology',
        isVerified: true,
        isActive: true,
        totalRevenue: 89000,
        doctorEarnings: 75650,
        platformCommission: 13350,
        totalAppointments: 187,
        paidAppointments: 172,
        avgRevenuePerAppointment: 517,
        paymentSuccessRate: 92
      },
      {
        uid: '3',
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        specialization: 'Pediatrics',
        isVerified: true,
        isActive: true,
        totalRevenue: 156000,
        doctorEarnings: 132600,
        platformCommission: 23400,
        totalAppointments: 298,
        paidAppointments: 285,
        avgRevenuePerAppointment: 547,
        paymentSuccessRate: 96
      },
      {
        uid: '4',
        name: 'Dr. James Wilson',
        email: 'james.wilson@example.com',
        specialization: 'Orthopedics',
        isVerified: false,
        isActive: true,
        totalRevenue: 67000,
        doctorEarnings: 56950,
        platformCommission: 10050,
        totalAppointments: 123,
        paidAppointments: 108,
        avgRevenuePerAppointment: 620,
        paymentSuccessRate: 88
      },
      {
        uid: '5',
        name: 'Dr. Lisa Thompson',
        email: 'lisa.thompson@example.com',
        specialization: 'General Medicine',
        isVerified: true,
        isActive: true,
        totalRevenue: 98000,
        doctorEarnings: 83300,
        platformCommission: 14700,
        totalAppointments: 201,
        paidAppointments: 189,
        avgRevenuePerAppointment: 518,
        paymentSuccessRate: 94
      },
      {
        uid: '6',
        name: 'Dr. Robert Kumar',
        email: 'robert.kumar@example.com',
        specialization: 'Neurology',
        isVerified: true,
        isActive: true,
        totalRevenue: 142000,
        doctorEarnings: 120700,
        platformCommission: 21300,
        totalAppointments: 167,
        paidAppointments: 159,
        avgRevenuePerAppointment: 893,
        paymentSuccessRate: 95
      }
    ];
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}