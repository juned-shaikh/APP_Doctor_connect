import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonButton, IonIcon, IonToggle, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol, IonList, IonItemDivider, IonNote,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  settingsOutline, notificationsOutline, cardOutline, timeOutline,
  shieldCheckmarkOutline, mailOutline, phonePortraitOutline, globeOutline,
  saveOutline, refreshOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.page.html',
  styleUrls: ['./system-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonIcon, IonToggle, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonGrid, IonRow, IonCol, IonList, IonItemDivider, IonNote
  ]
})
export class SystemSettingsPage implements OnInit {
  
  // General Settings
  appSettings = {
    appName: 'Doctor Appointment App',
    appVersion: '1.0.0',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    requirePhoneVerification: false
  };

  // Notification Settings
  notificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    appointmentReminders: true,
    reminderHours: 24
  };

  // Payment Settings
  paymentSettings = {
    enableOnlinePayments: true,
    paymentGateway: 'razorpay',
    currency: 'INR',
    taxRate: 18,
    refundPolicy: 'full',
    refundDays: 7
  };

  // Doctor Settings
  doctorSettings = {
    autoApproveKyc: false,
    requireMedicalLicense: true,
    maxSlotsPerDay: 20,
    slotDuration: 30,
    advanceBookingDays: 30
  };

  // System Limits
  systemLimits = {
    maxUsersPerDay: 1000,
    maxAppointmentsPerDay: 500,
    maxFileUploadSize: 10, // MB
    sessionTimeout: 60 // minutes
  };

  constructor(
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      settingsOutline, notificationsOutline, cardOutline, timeOutline,
      shieldCheckmarkOutline, mailOutline, phonePortraitOutline, globeOutline,
      saveOutline, refreshOutline
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // Load settings from Firebase or local storage
    // This would typically fetch from your backend
    console.log('Loading system settings...');
  }

  async saveSettings() {
    const alert = await this.alertController.create({
      header: 'Save Settings',
      message: 'Are you sure you want to save these system settings?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async () => {
            try {
              // Save settings to Firebase
              await this.saveToBackend();
              this.showToast('Settings saved successfully', 'success');
            } catch (error) {
              console.error('Error saving settings:', error);
              this.showToast('Error saving settings', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async saveToBackend() {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Settings saved:', {
          appSettings: this.appSettings,
          notificationSettings: this.notificationSettings,
          paymentSettings: this.paymentSettings,
          doctorSettings: this.doctorSettings,
          systemLimits: this.systemLimits
        });
        resolve(true);
      }, 1000);
    });
  }

  async resetToDefaults() {
    const alert = await this.alertController.create({
      header: 'Reset Settings',
      message: 'This will reset all settings to their default values. This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: () => {
            this.resetSettings();
            this.showToast('Settings reset to defaults', 'warning');
          }
        }
      ]
    });

    await alert.present();
  }

  resetSettings() {
    // Reset to default values
    this.appSettings = {
      appName: 'Doctor Appointment App',
      appVersion: '1.0.0',
      maintenanceMode: false,
      allowNewRegistrations: true,
      requireEmailVerification: true,
      requirePhoneVerification: false
    };

    this.notificationSettings = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      appointmentReminders: true,
      reminderHours: 24
    };

    this.paymentSettings = {
      enableOnlinePayments: true,
      paymentGateway: 'razorpay',
      currency: 'INR',
      taxRate: 18,
      refundPolicy: 'full',
      refundDays: 7
    };

    this.doctorSettings = {
      autoApproveKyc: false,
      requireMedicalLicense: true,
      maxSlotsPerDay: 20,
      slotDuration: 30,
      advanceBookingDays: 30
    };

    this.systemLimits = {
      maxUsersPerDay: 1000,
      maxAppointmentsPerDay: 500,
      maxFileUploadSize: 10,
      sessionTimeout: 60
    };
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
