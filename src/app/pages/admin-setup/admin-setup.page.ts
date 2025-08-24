import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AdminSetupService } from '../../services/admin-setup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-setup',
  templateUrl: './admin-setup.page.html',
  styleUrls: ['./admin-setup.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AdminSetupPage {

  adminCredentials = {
    email: 'admin@doctorapp.com',
    password: 'Admin123!'
  };

  constructor(
    private adminSetupService: AdminSetupService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  async setupAdmin() {
    const loading = await this.loadingController.create({
      message: 'Setting up super admin account...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.adminSetupService.createSuperAdmin();
      
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: '✅ Super admin account created successfully!',
        duration: 4000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Navigate to login after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);

    } catch (error: any) {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: error.message || 'Failed to create admin account',
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      const toast = await this.toastController.create({
        message: 'Copied to clipboard!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
}
