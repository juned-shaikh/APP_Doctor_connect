import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol, IonButton, IonIcon,
  IonItem, IonLabel, IonList, IonBadge, IonButtons, IonBackButton, IonText, IonNote,
  ActionSheetController, AlertController
} from '@ionic/angular/standalone';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, UserData } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  analyticsOutline, peopleOutline, medicalOutline, documentTextOutline,
  cardOutline, settingsOutline, checkmarkCircleOutline, warningOutline,
  trendingUpOutline, calendarOutline, personAddOutline, shieldCheckmarkOutline,
  ellipsisVerticalOutline, logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Admin Dashboard</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" (click)="showUserMenu()">
              <ion-icon name="ellipsis-vertical-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <div class="dashboard-container">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <ion-text color="primary">
            <h2>Welcome, Admin!</h2>
            <p>Manage users, appointments, and system settings</p>
          </ion-text>
        </div>

        <!-- Quick Stats -->
        <div class="stats-section">
          <ion-grid>
            <ion-row>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="people-outline" color="primary"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ dashboardStats[0].value }}</h3>
                        <p>Total Users</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="medical-outline" color="success"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ dashboardStats[1].value }}</h3>
                        <p>Doctors</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="person-add-outline" color="warning"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ dashboardStats[2].value }}</h3>
                        <p>Patients</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="3">
                <ion-card class="stat-card">
                  <ion-card-content>
                    <div class="stat-info">
                      <ion-icon name="calendar-outline" color="tertiary"></ion-icon>
                      <div class="stat-details">
                        <h3>{{ dashboardStats[3].value }}</h3>
                        <p>Appointments</p>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <ion-text color="dark">
            <h3>Quick Actions</h3>
          </ion-text>
          <ion-grid>
            <ion-row>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="manageUsers()">
                  <ion-card-content>
                    <ion-icon name="people-outline" color="primary"></ion-icon>
                    <p>Manage Users</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="verifyDoctors()">
                  <ion-card-content>
                    <ion-icon name="shield-checkmark-outline" color="success"></ion-icon>
                    <p>Verify Doctors</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="viewAnalytics()">
                  <ion-card-content>
                    <ion-icon name="analytics-outline" color="tertiary"></ion-icon>
                    <p>Analytics</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="systemSettings()">
                  <ion-card-content>
                    <ion-icon name="settings-outline" color="medium"></ion-icon>
                    <p>System Settings</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="viewReports()">
                  <ion-card-content>
                    <ion-icon name="document-text-outline" color="warning"></ion-icon>
                    <p>Reports</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6" size-md="4">
                <ion-card class="action-card" (click)="manageRevenue()">
                  <ion-card-content>
                    <ion-icon name="card-outline" color="success"></ion-icon>
                    <p>Revenue</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section">
          <ion-text color="dark">
            <h3>Recent Activity</h3>
          </ion-text>
          <ion-card>
            <ion-card-content>
              <ion-list>
                <ion-item *ngFor="let activity of recentActivities">
                  <ion-icon [name]="activity.icon" [color]="activity.color" slot="start"></ion-icon>
                  <ion-label>
                    <h3>{{ activity.title }}</h3>
                    <p>{{ activity.description }}</p>
                    <ion-note>{{ activity.timestamp | date:'short' }}</ion-note>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .dashboard-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .welcome-section {
      margin-bottom: 2rem;
      text-align: center;
    }
    .welcome-section h2 {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
    }
    .welcome-section p {
      opacity: 0.8;
      margin: 0;
    }
    .stats-section {
      margin-bottom: 2rem;
    }
    .stat-card {
      margin: 0;
      height: 100%;
    }
    .stat-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-info ion-icon {
      font-size: 2rem;
    }
    .stat-details h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
      font-weight: bold;
    }
    .stat-details p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    .actions-section {
      margin-bottom: 2rem;
    }
    .actions-section h3 {
      margin: 0 0 1rem 0;
      font-weight: bold;
    }
    .action-card {
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
      margin: 0.25rem;
      height: 100%;
    }
    .action-card:hover {
      transform: translateY(-2px);
    }
    .action-card ion-card-content {
      padding: 1rem;
    }
    .action-card ion-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .action-card p {
      margin: 0;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .activity-section {
      margin-bottom: 2rem;
    }
    .activity-section h3 {
      margin: 0 0 1rem 0;
      font-weight: bold;
    }
  `],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonGrid, IonRow, IonCol,
    IonItem, IonLabel, IonBadge, IonList, IonCardHeader, IonCardTitle, IonNote
  ],
  standalone: true
})
export class AdminDashboardPage implements OnInit {
  // Dashboard stats
  dashboardStats = [
    { title: 'Total Users', value: 245, icon: 'people-outline', color: 'primary' },
    { title: 'Doctors', value: 89, icon: 'medical-outline', color: 'success' },
    { title: 'Patients', value: 156, icon: 'person-outline', color: 'warning' },
    { title: 'Appointments', value: 1234, icon: 'calendar-outline', color: 'tertiary' }
  ];

  recentActivities = [
    {
      title: 'New Doctor Registration',
      description: 'Dr. John Smith submitted KYC documents',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: 'person-add-outline',
      color: 'success'
    },
    {
      title: 'Appointment Completed',
      description: '15 appointments completed today',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      icon: 'checkmark-circle-outline',
      color: 'primary'
    },
    {
      title: 'System Update',
      description: 'Platform updated to version 2.1.0',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: 'settings-outline',
      color: 'medium'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController
  ) {
    addIcons({ 
      analyticsOutline, peopleOutline, medicalOutline, documentTextOutline,
      cardOutline, settingsOutline, checkmarkCircleOutline, warningOutline,
      trendingUpOutline, calendarOutline, personAddOutline, shieldCheckmarkOutline,
      ellipsisVerticalOutline, logOutOutline
    });
  }

  ngOnInit() {
    this.loadDashboardStats();
  }

  async loadDashboardStats() {
    try {
      // Load real stats from Firebase
      const analytics = await this.firebaseService.getAdminAnalytics();
      this.dashboardStats = [
        {
          title: 'Total Users',
          value: analytics.totalUsers,
          icon: 'people-outline',
          color: 'primary'
        },
        {
          title: 'Doctors',
          value: analytics.totalDoctors,
          icon: 'medical-outline',
          color: 'success'
        },
        {
          title: 'Patients',
          value: analytics.totalPatients,
          icon: 'person-outline',
          color: 'warning'
        },
        {
          title: 'Appointments',
          value: analytics.totalAppointments,
          icon: 'calendar-outline',
          color: 'tertiary'
        }
      ];
      console.log('Dashboard statistics loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }

  manageUsers() {
    // Navigate to user management page
    this.router.navigate(['/admin/user-management']);
  }

  verifyDoctors() {
    // Navigate to doctor verification page
    this.router.navigate(['/admin/doctor-verification']);
  }

  viewAnalytics() {
    // Navigate to analytics page
    this.router.navigate(['/admin/analytics']);
  }

  systemSettings() {
    // Navigate to system settings
    console.log('Navigate to system settings');
  }

  viewReports() {
    // Navigate to reports page
    console.log('Navigate to reports');
  }

  manageRevenue() {
    // Navigate to revenue management
    this.router.navigate(['/admin/revenue']);
  }

  async showUserMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Admin Options',
      buttons: [
        {
          text: 'System Settings',
          icon: 'settings-outline',
          handler: () => {
            this.systemSettings();
          }
        },
        {
          text: 'View Reports',
          icon: 'document-text-outline',
          handler: () => {
            this.viewReports();
          }
        },
        {
          text: 'Logout',
          icon: 'log-out-outline',
          role: 'destructive',
          handler: () => {
            this.confirmLogout();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: async () => {
            try {
              await this.authService.signOut();
              // Navigate to login page
              this.router.navigate(['/auth/login'], { replaceUrl: true });
              console.log('Admin logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
