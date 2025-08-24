import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonSpinner,
  IonSearchbar, IonSegment, IonSegmentButton, IonModal, IonTextarea,
  ToastController, AlertController, ModalController
} from '@ionic/angular/standalone';
import { FirebaseService, UserData } from '../../../services/firebase.service';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircleOutline, closeCircleOutline, documentTextOutline, 
  eyeOutline, searchOutline, filterOutline, personOutline, medicalOutline,
  schoolOutline, businessOutline, timeOutline, warningOutline
} from 'ionicons/icons';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-verification',
  templateUrl: './doctor-verification.page.html',
  styleUrls: ['./doctor-verification.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonSpinner,
    IonSearchbar, IonSegment, IonSegmentButton, IonModal, IonTextarea
  ],
})
export class DoctorVerificationPage implements OnInit, OnDestroy {
  
  doctors: UserData[] = [];
  filteredDoctors: UserData[] = [];
  selectedStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  searchTerm = '';
  isLoading = false;
  selectedDoctor: UserData | null = null;
  isModalOpen = false;
  verificationNotes = '';
  private doctorsSub?: Subscription;

  constructor(
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController
  ) {
    addIcons({
      checkmarkCircleOutline, closeCircleOutline, documentTextOutline,
      eyeOutline, searchOutline, filterOutline, personOutline, medicalOutline,
      schoolOutline, businessOutline, timeOutline, warningOutline
    });
  }

  ngOnInit() {
    this.loadDoctorsByStatus(this.selectedStatus);
  }

  ngOnDestroy(): void {
    if (this.doctorsSub) {
      this.doctorsSub.unsubscribe();
    }
  }

  loadDoctorsByStatus(status: 'pending' | 'approved' | 'rejected') {
    this.isLoading = true;
    if (this.doctorsSub) {
      this.doctorsSub.unsubscribe();
    }
    this.doctorsSub = this.firebaseService.getDoctorsByStatusStream(status).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.filterDoctors();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading doctors (stream):', err);
        this.showToast('Error loading doctors', 'danger');
        this.isLoading = false;
      }
    });
  }

  filterDoctors() {
    let filtered = this.doctors;

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(term) ||
        doctor.email.toLowerCase().includes(term) ||
        doctor.specialization?.toLowerCase().includes(term)
      );
    }

    this.filteredDoctors = filtered;
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value as 'pending' | 'approved' | 'rejected';
    this.loadDoctorsByStatus(this.selectedStatus);
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterDoctors();
  }

  async viewDoctorDetails(doctor: UserData) {
    this.selectedDoctor = doctor;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedDoctor = null;
    this.verificationNotes = '';
  }

  async approveDoctor(doctor: UserData) {
    const alert = await this.alertController.create({
      header: 'Approve Doctor',
      message: `Are you sure you want to approve Dr. ${doctor.name}?`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Add approval notes (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          handler: async (data) => {
            await this.updateDoctorStatus(doctor, 'approved', data.notes);
          }
        }
      ]
    });

    await alert.present();
  }

  async rejectDoctor(doctor: UserData) {
    const alert = await this.alertController.create({
      header: 'Reject Doctor',
      message: `Are you sure you want to reject Dr. ${doctor.name}?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Reason for rejection (required)',
          attributes: {
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          handler: async (data) => {
            if (!data.reason?.trim()) {
              this.showToast('Please provide a reason for rejection', 'warning');
              return false;
            }
            await this.updateDoctorStatus(doctor, 'rejected', data.reason);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async updateDoctorStatus(doctor: UserData, status: 'approved' | 'rejected', notes?: string) {
    try {
      // Use Firestore document ID when available; fallback to uid if your docs are keyed by uid
      const docId = (doctor as any).id || doctor.uid;
      await this.firebaseService.updateDoctorVerificationStatus(docId, status, notes);
      
      // Update local data
      const index = this.doctors.findIndex(d => d.uid === doctor.uid);
      if (index !== -1) {
        this.doctors[index].kycStatus = status;
        this.doctors[index].isActive = status === 'approved';
      }
      
      this.filterDoctors();
      this.closeModal();
      
      const message = status === 'approved' 
        ? `Dr. ${doctor.name} has been approved successfully`
        : `Dr. ${doctor.name} has been rejected`;
      
      this.showToast(message, status === 'approved' ? 'success' : 'warning');
      
    } catch (error) {
      console.error('Error updating doctor status:', error);
      this.showToast('Error updating doctor status', 'danger');
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return 'checkmark-circle-outline';
      case 'rejected': return 'close-circle-outline';
      case 'pending': return 'time-outline';
      default: return 'warning-outline';
    }
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
