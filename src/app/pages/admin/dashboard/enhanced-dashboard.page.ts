import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonGrid, IonRow, IonCol, IonItem, IonLabel,
  IonBadge, IonChip, IonSpinner, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonList, IonAvatar, IonNote, IonProgressBar,
  IonFab, IonFabButton, IonButtons, IonMenuButton, IonSearchbar,
  AlertController, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline, peopleOutline, medicalOutline, calendarOutline,
  cashOutline, trendingUpOutline, trendingDownOutline, eyeOutline,
  addOutline, notificationsOutline, settingsOutline, refreshOutline,
  checkmarkCircleOutline, warningOutline, timeOutline, cardOutline,
  documentTextOutline, personAddOutline, businessOutline, analyticsOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest, interval } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, UserData, AppointmentData } from '../../../services/firebase.service';
import { NotificationService } from '../../../services/notification.service';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  pendingDoctors: number;
  approvedDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  averageRating: number;
  activeUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'appointment' | 'verification' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'warning' | 'danger';
  user?: string;
  amount?: number;
}

@Component({
  selector: 'app-enhanced-admin-dashboard',
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Admin Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="showNotifications()">
            <ion-icon name="notifications-outline"></ion-icon>
            <ion-badge *ngIf="unreadNotifications > 0" color="danger">{{ unreadNotifications }}</ion-badge>
          </ion-button>
          <ion-button fill="clear" (click)="refreshDashboard()">
            <ion-icon name="refresh-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="refreshData($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Loading dashboard...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!isLoading" class="dashboard-container">
        
        <!-- Welcome Section -->
        <ion-card class="welcome-card">
          <ion-card-content>
            <div class="welcome-content">
              <div class="welcome-text">
                <h1>Welcome back, Admin!</h1>
                <p>Here's what's happening with your platform today</p>
                <ion-note>Last updated: {{ lastUpdated | date:'short' }}</ion-note>
              </div>
              <div class="welcome-stats">
                <div class="quick-stat">
                  <span class="stat-number">{{ stats.totalUsers }}</span>
                  <span class="stat-label">Total Users</span>
                </div>
                <div class="quick-stat">
                  <span class="stat-number">{{ stats.todayAppointments }}</span>
                  <span class="stat-label">Today's Appointments</span>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Key Metrics Grid -->
        <div class="metrics-grid">
          <ion-card class="metric-card" (click)="navigateTo('/admin/users')">
            <ion-card-content>
              <div class="metric-content">
                <div class="metric-icon users">
                  <ion-icon name="people-outline"></ion-icon>
                </div>
                <div class="metric-info">
                  <h2>{{ stats.totalUsers }}</h2>
                  <p>Total Users</p>
                  <ion-chip color="success" size="small">
                    <ion-icon name="trending-up-outline"></ion-icon>
                    +{{ getUserGrowth() }}%
                  </ion-chip>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="metric-card" (click)="navigateTo('/admin/doctors')">
            <ion-card-content>
              <div class="metric-content">
                <div class="metric-icon doctors">
                  <ion-icon name="medical-outline"></ion-icon>
                </div>
                <div class="metric-info">
                  <h2>{{ stats.totalDoctors }}</h2>
                  <p>Doctors</p>
                  <ion-badge *ngIf="stats.pendingDoctors > 0" color="warning">
                    {{ stats.pendingDoctors }} pending
                  </ion-badge>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="metric-card" (click)="navigateTo('/admin/appointments')">
            <ion-card-content>
              <div class="metric-content">
                <div class="metric-icon appointments">
                  <ion-icon name="calendar-outline"></ion-icon>
                </div>
                <div class="metric-info">
                  <h2>{{ stats.totalAppointments }}</h2>
                  <p>Appointments</p>
                  <ion-note>{{ stats.todayAppointments }} today</ion-note>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="metric-card" (click)="navigateTo('/admin/revenue')">
            <ion-card-content>
              <div class="metric-content">
                <div class="metric-icon revenue">
                  <ion-icon name="cash-outline"></ion-icon>
                </div>
                <div class="metric-info">
                  <h2>₹{{ formatCurrency(stats.totalRevenue) }}</h2>
                  <p>Total Revenue</p>
                  <ion-chip color="primary" size="small">
                    ₹{{ formatCurrency(stats.monthlyRevenue) }} this month
                  </ion-chip>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Status Overview -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Platform Status</h2>
              <ion-chip [color]="getSystemHealthColor()" size="small">
                {{ getSystemHealthStatus() }}
              </ion-chip>
            </div>
            
            <ion-grid>
              <ion-row>
                <ion-col size="6" size-md="3">
                  <div class="status-item">
                    <div class="status-value">{{ stats.approvedDoctors }}</div>
                    <div class="status-label">Active Doctors</div>
                    <ion-progress-bar 
                      [value]="stats.approvedDoctors / stats.totalDoctors" 
                      color="success">
                    </ion-progress-bar>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="3">
                  <div class="status-item">
                    <div class="status-value">{{ stats.completedAppointments }}</div>
                    <div class="status-label">Completed</div>
                    <ion-progress-bar 
                      [value]="stats.completedAppointments / stats.totalAppointments" 
                      color="primary">
                    </ion-progress-bar>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="3">
                  <div class="status-item">
                    <div class="status-value">{{ stats.pendingAppointments }}</div>
                    <div class="status-label">Pending</div>
                    <ion-progress-bar 
                      [value]="stats.pendingAppointments / stats.totalAppointments" 
                      color="warning">
                    </ion-progress-bar>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="3">
                  <div class="status-item">
                    <div class="status-value">{{ stats.averageRating.toFixed(1) }}</div>
                    <div class="status-label">Avg Rating</div>
                    <ion-progress-bar 
                      [value]="stats.averageRating / 5" 
                      color="tertiary">
                    </ion-progress-bar>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Recent Activity -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Recent Activity</h2>
              <ion-button fill="clear" size="small" (click)="viewAllActivity()">
                View All
              </ion-button>
            </div>
            
            <ion-list lines="none">
              <ion-item *ngFor="let activity of recentActivities.slice(0, 5)" class="activity-item">
                <ion-avatar slot="start">
                  <div class="activity-icon" [class]="'icon-' + activity.type">
                    <ion-icon [name]="getActivityIcon(activity.type)"></ion-icon>
                  </div>
                </ion-avatar>
                
                <ion-label class="ion-text-wrap">
                  <h3>{{ activity.title }}</h3>
                  <p>{{ activity.description }}</p>
                  <ion-note>{{ formatTime(activity.timestamp) }}</ion-note>
                </ion-label>
                
                <div slot="end">
                  <ion-chip [color]="getStatusColor(activity.status)" size="small">
                    {{ activity.status }}
                  </ion-chip>
                  <div *ngIf="activity.amount" class="activity-amount">
                    ₹{{ formatCurrency(activity.amount) }}
                  </div>
                </div>
              </ion-item>
            </ion-list>
            
            <div *ngIf="recentActivities.length === 0" class="empty-activity">
              <ion-icon name="time-outline" color="medium"></ion-icon>
              <p>No recent activity</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Quick Actions -->
        <ion-card>
          <ion-card-content>
            <div class="card-header">
              <h2>Quick Actions</h2>
            </div>
            
            <div class="quick-actions">
              <ion-button 
                expand="block" 
                fill="outline" 
                (click)="navigateTo('/admin/doctor-verification')">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                Verify Doctors
                <ion-badge *ngIf="stats.pendingDoctors > 0" color="warning" slot="end">
                  {{ stats.pendingDoctors }}
                </ion-badge>
              </ion-button>
              
              <ion-button 
                expand="block" 
                fill="outline" 
                (click)="navigateTo('/admin/analytics')">
                <ion-icon name="analytics-outline" slot="start"></ion-icon>
                View Analytics
              </ion-button>
              
              <ion-button 
                expand="block" 
                fill="outline" 
                (click)="navigateTo('/admin/reports')">
                <ion-icon name="document-text-outline" slot="start"></ion-icon>
                Generate Reports
              </ion-button>
              
              <ion-button 
                expand="block" 
                fill="outline" 
                (click)="navigateTo('/admin/settings')">
                <ion-icon name="settings-outline" slot="start"></ion-icon>
                System Settings
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- System Alerts -->
        <ion-card *ngIf="systemAlerts.length > 0" class="alerts-card">
          <ion-card-content>
            <div class="card-header">
              <h2>System Alerts</h2>
              <ion-badge color="danger">{{ systemAlerts.length }}</ion-badge>
            </div>
            
            <div *ngFor="let alert of systemAlerts" class="alert-item">
              <ion-icon [name]="getAlertIcon(alert.type)" [color]="getAlertColor(alert.type)"></ion-icon>
              <div class="alert-content">
                <h4>{{ alert.title }}</h4>
                <p>{{ alert.message }}</p>
                <ion-note>{{ formatTime(alert.timestamp) }}</ion-note>
              </div>
              <ion-button fill="clear" size="small" (click)="dismissAlert(alert)">
                Dismiss
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Floating Action Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="showQuickActions()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    /* Force header height in this component */
    :host ion-header ion-toolbar {
      --min-height: 40px !important;
      height: 40px !important;
      min-height: 40px !important;
      max-height: 40px !important;
    }
    
    :host ion-header ion-toolbar ion-title {
      height: 40px !important;
      font-size: 1rem !important;
      display: flex !important;
      align-items: center !important;
    }
    
    :host ion-header ion-toolbar ion-buttons {
      height: 40px !important;
    }

    .dashboard-container {
      padding: 1rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .loading-container {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-container p {
      margin-top: 1rem;
      opacity: 0.7;
    }

    .welcome-card {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      margin-bottom: 1.5rem;
    }

    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .welcome-text h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      font-weight: bold;
    }

    .welcome-text p {
      margin: 0 0 0.5rem 0;
      opacity: 0.9;
    }

    .welcome-stats {
      display: flex;
      gap: 2rem;
    }

    .quick-stat {
      text-align: center;
    }

    .quick-stat .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: bold;
    }

    .quick-stat .stat-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .metric-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .metric-icon.users {
      background: linear-gradient(135deg, #007bff, #0056b3);
    }

    .metric-icon.doctors {
      background: linear-gradient(135deg, #28a745, #1e7e34);
    }

    .metric-icon.appointments {
      background: linear-gradient(135deg, #ffc107, #e0a800);
    }

    .metric-icon.revenue {
      background: linear-gradient(135deg, #17a2b8, #117a8b);
    }

    .metric-info h2 {
      margin: 0 0 0.25rem 0;
      font-size: 2rem;
      font-weight: bold;
      color: var(--ion-color-dark);
    }

    .metric-info p {
      margin: 0 0 0.5rem 0;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .status-item {
      text-align: center;
      padding: 1rem 0;
    }

    .status-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: var(--ion-color-primary);
      display: block;
      margin-bottom: 0.25rem;
    }

    .status-label {
      font-size: 0.9rem;
      color: var(--ion-color-medium);
      margin-bottom: 0.5rem;
    }

    .activity-item {
      --padding-start: 0;
      --padding-end: 0;
      margin-bottom: 0.5rem;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .icon-registration {
      background: var(--ion-color-primary);
    }

    .icon-appointment {
      background: var(--ion-color-secondary);
    }

    .icon-verification {
      background: var(--ion-color-tertiary);
    }

    .icon-payment {
      background: var(--ion-color-success);
    }

    .activity-amount {
      font-weight: bold;
      color: var(--ion-color-success);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .empty-activity {
      text-align: center;
      padding: 2rem;
      opacity: 0.6;
    }

    .empty-activity ion-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .quick-actions {
      display: grid;
      gap: 0.75rem;
    }

    .quick-actions ion-button {
      --border-radius: 8px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      justify-content: flex-start;
    }

    .alerts-card {
      border-left: 4px solid var(--ion-color-danger);
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .alert-item:last-child {
      border-bottom: none;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content h4 {
      margin: 0 0 0.25rem 0;
      font-weight: 600;
    }

    .alert-content p {
      margin: 0 0 0.25rem 0;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0.5rem;
      }

      .welcome-content {
        flex-direction: column;
        text-align: center;
      }

      .welcome-stats {
        justify-content: center;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .metric-content {
        justify-content: center;
        text-align: center;
      }
    }
  `],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonGrid, IonRow, IonCol, IonItem, IonLabel,
    IonBadge, IonChip, IonSpinner, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonList, IonAvatar, IonNote, IonProgressBar,
    IonFab, IonFabButton, IonButtons, IonMenuButton, IonSearchbar
  ],
  standalone: true
})
export class EnhancedAdminDashboardPage implements OnInit, OnDestroy {
  stats: DashboardStats = {
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingDoctors: 0,
    approvedDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    averageRating: 4.2,
    activeUsers: 0
  };

  recentActivities: RecentActivity[] = [];
  systemAlerts: any[] = [];
  unreadNotifications = 0;
  lastUpdated = new Date();
  isLoading = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private notificationService: NotificationService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      statsChartOutline, peopleOutline, medicalOutline, calendarOutline,
      cashOutline, trendingUpOutline, trendingDownOutline, eyeOutline,
      addOutline, notificationsOutline, settingsOutline, refreshOutline,
      checkmarkCircleOutline, warningOutline, timeOutline, cardOutline,
      documentTextOutline, personAddOutline, businessOutline, analyticsOutline
    });
  }

  ngOnInit() {
    this.loadDashboardData();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadDashboardData() {
    this.isLoading = true;

    try {
      // Load analytics data
      const analytics = await this.firebaseService.getAdminAnalytics();
      this.stats = {
        ...this.stats,
        ...analytics
      };

      // Calculate today's appointments
      this.calculateTodayAppointments();
      
      // Load recent activities
      await this.loadRecentActivities();
      
      // Load system alerts
      this.loadSystemAlerts();

      this.lastUpdated = new Date();
      this.isLoading = false;

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showToast('Failed to load dashboard data', 'danger');
      this.isLoading = false;
    }
  }

  setupRealTimeUpdates() {
    // Update dashboard every 30 seconds
    const updateInterval = interval(30000).subscribe(() => {
      this.loadDashboardData();
    });
    this.subscriptions.push(updateInterval);

    // Listen to notification count
    const notificationSub = this.notificationService.getUnreadCount().subscribe(count => {
      this.unreadNotifications = count;
    });
    this.subscriptions.push(notificationSub);
  }

  calculateTodayAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This would be calculated from actual appointment data
    this.stats.todayAppointments = Math.floor(this.stats.totalAppointments * 0.1);
  }

  async loadRecentActivities() {
    // Simulate recent activities - in real app, this would come from Firebase
    this.recentActivities = [
      {
        id: '1',
        type: 'registration',
        title: 'New Doctor Registration',
        description: 'Dr. Sarah Johnson registered as Cardiologist',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: 'pending',
        user: 'Dr. Sarah Johnson'
      },
      {
        id: '2',
        type: 'appointment',
        title: 'Appointment Completed',
        description: 'Patient consultation with Dr. Smith completed',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'success',
        amount: 500
      },
      {
        id: '3',
        type: 'verification',
        title: 'Doctor Verified',
        description: 'Dr. Michael Brown KYC verification approved',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'success',
        user: 'Dr. Michael Brown'
      },
      {
        id: '4',
        type: 'payment',
        title: 'Payment Received',
        description: 'Online payment processed successfully',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'success',
        amount: 750
      }
    ];
  }

  loadSystemAlerts() {
    // Simulate system alerts
    this.systemAlerts = [];
    
    if (this.stats.pendingDoctors > 5) {
      this.systemAlerts.push({
        id: '1',
        type: 'warning',
        title: 'Pending Doctor Verifications',
        message: `${this.stats.pendingDoctors} doctors are waiting for verification`,
        timestamp: new Date()
      });
    }

    if (this.stats.totalRevenue < 10000) {
      this.systemAlerts.push({
        id: '2',
        type: 'info',
        title: 'Revenue Alert',
        message: 'Monthly revenue is below target',
        timestamp: new Date()
      });
    }
  }

  getUserGrowth(): number {
    // Simulate growth percentage
    return Math.floor(Math.random() * 20) + 5;
  }

  getSystemHealthColor(): string {
    const healthScore = this.calculateHealthScore();
    if (healthScore >= 80) return 'success';
    if (healthScore >= 60) return 'warning';
    return 'danger';
  }

  getSystemHealthStatus(): string {
    const healthScore = this.calculateHealthScore();
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    return 'Needs Attention';
  }

  calculateHealthScore(): number {
    // Simple health calculation based on various metrics
    let score = 0;
    
    // Doctor approval rate
    if (this.stats.totalDoctors > 0) {
      score += (this.stats.approvedDoctors / this.stats.totalDoctors) * 30;
    }
    
    // Appointment completion rate
    if (this.stats.totalAppointments > 0) {
      score += (this.stats.completedAppointments / this.stats.totalAppointments) * 40;
    }
    
    // Revenue growth (simulated)
    score += 20;
    
    // System alerts (fewer alerts = better health)
    score += Math.max(0, 10 - this.systemAlerts.length);
    
    return Math.min(100, score);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'registration': return 'person-add-outline';
      case 'appointment': return 'calendar-outline';
      case 'verification': return 'checkmark-circle-outline';
      case 'payment': return 'card-outline';
      default: return 'information-circle-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'success';
      case 'pending': return 'warning';
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      default: return 'medium';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'warning': return 'warning-outline';
      case 'danger': return 'alert-circle-outline';
      case 'info': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  }

  getAlertColor(type: string): string {
    switch (type) {
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      case 'info': return 'primary';
      default: return 'medium';
    }
  }

  formatCurrency(amount: number): string {
    if (amount >= 100000) {
      return (amount / 100000).toFixed(1) + 'L';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toString();
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  showNotifications() {
    this.router.navigate(['/notifications']);
  }

  async refreshDashboard() {
    const loading = await this.loadingController.create({
      message: 'Refreshing dashboard...',
      duration: 2000
    });
    await loading.present();
    
    await this.loadDashboardData();
    await loading.dismiss();
  }

  async refreshData(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  viewAllActivity() {
    this.router.navigate(['/admin/activity']);
  }

  async showQuickActions() {
    // Implementation for quick actions FAB
    this.showToast('Quick actions coming soon', 'primary');
  }

  dismissAlert(alert: any) {
    this.systemAlerts = this.systemAlerts.filter(a => a.id !== alert.id);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}