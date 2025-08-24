import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonSpinner,
  IonSearchbar, IonSegment, IonSegmentButton, IonToggle, IonAlert,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { FirebaseService, UserData } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  personOutline, medicalOutline, shieldCheckmarkOutline, searchOutline,
  toggleOutline, trashOutline, createOutline, eyeOutline, filterOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.page.html',
  styleUrls: ['./user-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonSpinner,
    IonSearchbar, IonSegment, IonSegmentButton, IonToggle, IonAlert
  ]
})
export class UserManagementPage implements OnInit {
  
  users: UserData[] = [];
  filteredUsers: UserData[] = [];
  selectedRole: 'all' | 'patient' | 'doctor' | 'admin' = 'all';
  searchTerm = '';
  isLoading = false;

  constructor(
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      personOutline, medicalOutline, shieldCheckmarkOutline, searchOutline,
      toggleOutline, trashOutline, createOutline, eyeOutline, filterOutline
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.isLoading = true;
    try {
      this.users = await this.firebaseService.getAllUsers();
      this.filterUsers();
    } catch (error) {
      console.error('Error loading users:', error);
      this.showToast('Error loading users', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  filterUsers() {
    let filtered = this.users;

    // Filter by role
    if (this.selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = filtered;
  }

  onRoleChange(event: any) {
    this.selectedRole = event.detail.value;
    this.filterUsers();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterUsers();
  }

  async toggleUserStatus(user: UserData) {
    const alert = await this.alertController.create({
      header: `${user.isActive ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: user.isActive ? 'Deactivate' : 'Activate',
          handler: async () => {
            try {
              await this.firebaseService.toggleUserStatus(user.uid, !user.isActive);
              user.isActive = !user.isActive;
              this.showToast(
                `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
                'success'
              );
            } catch (error) {
              console.error('Error toggling user status:', error);
              this.showToast('Error updating user status', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'doctor': return 'medical-outline';
      case 'admin': return 'shield-checkmark-outline';
      case 'patient': return 'person-outline';
      default: return 'person-outline';
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'doctor': return 'success';
      case 'admin': return 'danger';
      case 'patient': return 'primary';
      default: return 'medium';
    }
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
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
