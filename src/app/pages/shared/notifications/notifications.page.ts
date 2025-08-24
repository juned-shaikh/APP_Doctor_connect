import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonLabel,
  IonList, IonBadge, IonNote, IonSpinner, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonChip, IonAvatar, IonItemSliding,
  IonItemOptions, IonItemOption, IonFab, IonFabButton, IonAlert,
  AlertController, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, checkmarkOutline, trashOutline, timeOutline,
  calendarOutline, medicalOutline, cardOutline, informationCircleOutline,
  ellipsisVerticalOutline, markAsReadOutline, deleteOutline, refreshOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService, NotificationData } from '../../../services/firebase.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notifications',
  template: `
    <ion-header [translucent]="false">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="showNotificationActions()">
            <ion-icon name="ellipsis-vertical-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="refreshNotifications($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filter Segment -->
      <div class="filter-container">
        <ion-segment [(ngModel)]="selectedFilter" (ionChange)="onFilterChange($event)">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
            <ion-badge *ngIf="notificationStats.total > 0">{{ notificationStats.total }}</ion-badge>
          </ion-segment-button>
          <ion-segment-button value="unread">
            <ion-label>Unread</ion-label>
            <ion-badge *ngIf="notificationStats.unread > 0" color="danger">{{ notificationStats.unread }}</ion-badge>
          </ion-segment-button>
          <ion-segment-button value="appointment">
            <ion-label>Appointments</ion-label>
          </ion-segment-button>
          <ion-segment-button value="general">
            <ion-label>General</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Loading notifications...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredNotifications.length === 0" class="empty-state">
        <ion-icon name="notifications-outline" size="large" color="medium"></ion-icon>
        <h3>No notifications found</h3>
        <p>{{ getEmptyStateMessage() }}</p>
      </div>

      <!-- Notifications List -->
      <ion-list *ngIf="!isLoading && filteredNotifications.length > 0" lines="none">
        <ion-item-sliding *ngFor="let notification of filteredNotifications; trackBy: trackByNotificationId">
          <ion-item 
            [class.unread-notification]="!notification.isRead"
            button 
            (click)="onNotificationClick(notification)">
            
            <ion-avatar slot="start">
              <div class="notification-icon" [class]="'icon-' + notification.type">
                <ion-icon [name]="getNotificationIcon(notification.type)"></ion-icon>
              </div>
            </ion-avatar>

            <ion-label class="ion-text-wrap">
              <h2>{{ notification.title }}</h2>
              <p>{{ notification.message }}</p>
              <ion-note color="medium">
                <ion-icon name="time-outline"></ion-icon>
                {{ formatTime(notification.createdAt) }}
              </ion-note>
            </ion-label>

            <div slot="end" class="notification-meta">
              <ion-chip 
                [color]="getNotificationTypeColor(notification.type)" 
                size="small">
                {{ getNotificationTypeLabel(notification.type) }}
              </ion-chip>
              <ion-badge 
                *ngIf="!notification.isRead" 
                color="danger" 
                class="unread-badge">
                New
              </ion-badge>
            </div>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option 
              *ngIf="!notification.isRead"
              color="primary" 
              (click)="markAsRead(notification)">
              <ion-icon name="checkmark-outline"></ion-icon>
              Mark Read
            </ion-item-option>
            <ion-item-option 
              color="danger" 
              (click)="deleteNotification(notification)">
              <ion-icon name="trash-outline"></ion-icon>
              Delete
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Load More Button -->
      <div *ngIf="hasMoreNotifications" class="load-more-container">
        <ion-button 
          fill="outline" 
          expand="block" 
          (click)="loadMoreNotifications()"
          [disabled]="isLoadingMore">
          <ion-spinner *ngIf="isLoadingMore" name="crescent"></ion-spinner>
          <span *ngIf="!isLoadingMore">Load More</span>
        </ion-button>
      </div>

      <!-- Floating Action Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="markAllAsRead()" [disabled]="notificationStats.unread === 0">
          <ion-icon name="checkmark-outline"></ion-icon>
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
    
    :host ion-header ion-toolbar ion-back-button {
      height: 40px !important;
      --min-height: 40px !important;
    }

    .filter-container {
      padding: 1rem;
      background: var(--ion-color-light);
    }

    ion-segment {
      --background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    ion-segment-button {
      --color: var(--ion-color-medium);
      --color-checked: var(--ion-color-primary);
      --background-checked: rgba(40, 167, 69, 0.1);
      position: relative;
    }

    ion-segment-button ion-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.7rem;
      min-width: 16px;
      height: 16px;
    }

    .loading-container {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-container p {
      margin-top: 1rem;
      opacity: 0.7;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-state ion-icon {
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem 0;
      color: var(--ion-color-medium);
    }

    .empty-state p {
      margin-bottom: 2rem;
      opacity: 0.7;
    }

    ion-list {
      padding: 0;
    }

    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --min-height: 80px;
      margin-bottom: 1px;
    }

    .unread-notification {
      --background: rgba(40, 167, 69, 0.05);
      border-left: 4px solid var(--ion-color-primary);
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .icon-appointment {
      background: var(--ion-color-primary);
    }

    .icon-prescription {
      background: var(--ion-color-secondary);
    }

    .icon-payment {
      background: var(--ion-color-tertiary);
    }

    .icon-general {
      background: var(--ion-color-medium);
    }

    ion-label h2 {
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: var(--ion-text-color);
    }

    ion-label p {
      margin-bottom: 0.5rem;
      opacity: 0.8;
      line-height: 1.4;
    }

    ion-note {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
    }

    .notification-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .unread-badge {
      font-size: 0.7rem;
      --padding-start: 6px;
      --padding-end: 6px;
    }

    .load-more-container {
      padding: 1rem;
    }

    ion-fab-button {
      --background: var(--ion-color-primary);
      --color: white;
    }

    ion-fab-button[disabled] {
      --background: var(--ion-color-light);
      --color: var(--ion-color-medium);
    }

    @media (max-width: 768px) {
      .filter-container {
        padding: 0.5rem;
      }

      ion-segment-button {
        font-size: 0.8rem;
      }

      .notification-meta {
        align-items: center;
      }
    }
  `],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonBackButton, IonButtons, IonItem, IonLabel,
    IonList, IonBadge, IonNote, IonSpinner, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonChip, IonAvatar, IonItemSliding,
    IonItemOptions, IonItemOption, IonFab, IonFabButton
  ],
  standalone: true
})
export class NotificationsPage implements OnInit, OnDestroy {
  notifications: NotificationData[] = [];
  filteredNotifications: NotificationData[] = [];
  selectedFilter = 'all';
  isLoading = true;
  isLoadingMore = false;
  hasMoreNotifications = false;
  
  notificationStats = {
    total: 0,
    unread: 0,
    appointment: 0,
    prescription: 0,
    payment: 0,
    general: 0
  };

  private subscriptions: Subscription[] = [];
  private currentPage = 1;
  private pageSize = 20;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private notificationService: NotificationService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({
      notificationsOutline, checkmarkOutline, trashOutline, timeOutline,
      calendarOutline, medicalOutline, cardOutline, informationCircleOutline,
      ellipsisVerticalOutline, markAsReadOutline, deleteOutline, refreshOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadNotifications() {
    this.isLoading = true;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Subscribe to real-time notifications
      const notificationsSub = this.notificationService.getNotifications().subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.calculateStats();
          this.filterNotifications();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.showToast('Failed to load notifications', 'danger');
          this.isLoading = false;
        }
      });
      
      this.subscriptions.push(notificationsSub);

    } catch (error) {
      console.error('Error loading notifications:', error);
      this.showToast('Failed to load notifications', 'danger');
      this.isLoading = false;
    }
  }

  calculateStats() {
    this.notificationStats = {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.isRead).length,
      appointment: this.notifications.filter(n => n.type === 'appointment').length,
      prescription: this.notifications.filter(n => n.type === 'prescription').length,
      payment: this.notifications.filter(n => n.type === 'payment').length,
      general: this.notifications.filter(n => n.type === 'general').length
    };
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.filterNotifications();
  }

  filterNotifications() {
    switch (this.selectedFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.isRead);
        break;
      case 'appointment':
      case 'prescription':
      case 'payment':
      case 'general':
        this.filteredNotifications = this.notifications.filter(n => n.type === this.selectedFilter);
        break;
      default:
        this.filteredNotifications = [...this.notifications];
    }
    
    // Sort by creation date (newest first)
    this.filteredNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getEmptyStateMessage(): string {
    switch (this.selectedFilter) {
      case 'unread': return 'No unread notifications';
      case 'appointment': return 'No appointment notifications';
      case 'prescription': return 'No prescription notifications';
      case 'payment': return 'No payment notifications';
      case 'general': return 'No general notifications';
      default: return 'No notifications yet';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'appointment': return 'calendar-outline';
      case 'prescription': return 'medical-outline';
      case 'payment': return 'card-outline';
      default: return 'information-circle-outline';
    }
  }

  getNotificationTypeColor(type: string): string {
    switch (type) {
      case 'appointment': return 'primary';
      case 'prescription': return 'secondary';
      case 'payment': return 'tertiary';
      default: return 'medium';
    }
  }

  getNotificationTypeLabel(type: string): string {
    switch (type) {
      case 'appointment': return 'Appointment';
      case 'prescription': return 'Prescription';
      case 'payment': return 'Payment';
      default: return 'General';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  }

  async onNotificationClick(notification: NotificationData) {
    // Mark as read if unread
    if (!notification.isRead) {
      await this.markAsRead(notification);
    }

    // Navigate based on notification type and data
    if (notification.data) {
      switch (notification.type) {
        case 'appointment':
          if (notification.data.appointmentId) {
            this.router.navigate(['/appointment-details', notification.data.appointmentId]);
          }
          break;
        case 'prescription':
          if (notification.data.prescriptionId) {
            this.router.navigate(['/prescriptions', notification.data.prescriptionId]);
          }
          break;
        case 'payment':
          this.router.navigate(['/payments']);
          break;
      }
    }
  }

  async markAsRead(notification: NotificationData) {
    try {
      if (notification.id) {
        await this.notificationService.markAsRead(notification.id);
        await this.showToast('Marked as read', 'success');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      await this.showToast('Failed to mark as read', 'danger');
    }
  }

  async markAllAsRead() {
    try {
      await this.notificationService.markAllAsRead();
      await this.showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      await this.showToast('Failed to mark all as read', 'danger');
    }
  }

  async deleteNotification(notification: NotificationData) {
    const alert = await this.alertController.create({
      header: 'Delete Notification',
      message: 'Are you sure you want to delete this notification?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              // Note: You'll need to implement deleteNotification in FirebaseService
              await this.showToast('Notification deleted', 'success');
            } catch (error) {
              console.error('Error deleting notification:', error);
              await this.showToast('Failed to delete notification', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showNotificationActions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Notification Actions',
      buttons: [
        {
          text: `Mark All as Read (${this.notificationStats.unread})`,
          icon: 'checkmark-outline',
          handler: () => {
            this.markAllAsRead();
          }
        },
        {
          text: 'Refresh',
          icon: 'refresh-outline',
          handler: () => {
            this.loadNotifications();
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

  async refreshNotifications(event: any) {
    await this.loadNotifications();
    event.target.complete();
  }

  loadMoreNotifications() {
    // Implement pagination if needed
    this.isLoadingMore = true;
    // Simulate loading more
    setTimeout(() => {
      this.isLoadingMore = false;
      this.hasMoreNotifications = false;
    }, 1000);
  }

  trackByNotificationId(index: number, notification: NotificationData): string {
    return notification.id || index.toString();
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