import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
  IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner
} from '@ionic/angular/standalone';
import { FirebaseService } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  analyticsOutline, trendingUpOutline, peopleOutline, calendarOutline,
  medicalOutline, cardOutline, timeOutline, statsChartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
    IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner
  ]
})
export class AnalyticsPage implements OnInit {
  
  selectedPeriod: 'week' | 'month' | 'year' = 'month';
  isLoading = false;
  
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
    usersGrowth: 12.5,
    appointmentsGrowth: 8.3,
    revenueGrowth: 15.7,
    doctorsGrowth: 5.2
  };

  appointmentStats: { [key: string]: number } = {
    pending: 45,
    confirmed: 123,
    completed: 89,
    cancelled: 12
  };

  topSpecializations = [
    { name: 'Cardiology', count: 45, percentage: 25 },
    { name: 'Dermatology', count: 38, percentage: 21 },
    { name: 'Pediatrics', count: 32, percentage: 18 },
    { name: 'Orthopedics', count: 28, percentage: 16 },
    { name: 'General Medicine', count: 36, percentage: 20 }
  ];

  constructor(
    private firebaseService: FirebaseService
  ) {
    addIcons({
      analyticsOutline, trendingUpOutline, peopleOutline, calendarOutline,
      medicalOutline, cardOutline, timeOutline, statsChartOutline
    });
  }

  ngOnInit() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.isLoading = true;
    try {
      const stats = await this.firebaseService.getAdminAnalytics();
      this.totalStats = {
        users: stats.totalUsers,
        doctors: stats.totalDoctors,
        patients: stats.totalPatients,
        appointments: stats.totalAppointments,
        revenue: stats.totalRevenue || 0,
        completedAppointments: stats.completedAppointments || 0
      };
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadAnalytics();
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
}
