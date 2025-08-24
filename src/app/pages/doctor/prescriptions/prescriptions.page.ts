import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonSearchbar,
  IonSegment, IonSegmentButton, IonLabel, IonItem, IonAvatar, IonNote,
  IonChip, IonSpinner, IonRefresher, IonRefresherContent, IonFab, IonFabButton,
  ModalController, AlertController, ToastController, ActionSheetController,
  IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonDatetime,
  IonCheckbox, IonList, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  documentTextOutline, searchOutline, addOutline, personOutline,
  calendarOutline, timeOutline, medicalOutline, eyeOutline, createOutline,
  trashOutline, downloadOutline, shareOutline, printOutline, closeOutline,
  checkmarkCircleOutline, warningOutline, refreshOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-doctor-prescriptions',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Prescriptions</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="prescriptions-container">
        <ion-card>
          <ion-card-content>
            <div class="prescriptions-info">
              <ion-icon name="document-text-outline" size="large" color="primary"></ion-icon>
              <h2>Prescriptions</h2>
              <p>Manage patient prescriptions</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .prescriptions-container {
      padding: 1rem;
    }
    .prescriptions-info {
      text-align: center;
      padding: 2rem;
    }
    .prescriptions-info h2 {
      margin: 1rem 0 0.5rem 0;
    }
  `],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonBackButton, IonButtons, IonSearchbar,
    IonSegment, IonSegmentButton, IonLabel, IonItem, IonAvatar, IonNote,
    IonChip, IonSpinner, IonRefresher, IonRefresherContent, IonFab, IonFabButton,
    IonModal, IonInput, IonTextarea, IonSelect, IonSelectOption, IonDatetime,
    IonCheckbox, IonList, IonItemSliding, IonItemOptions, IonItemOption
  ],
  standalone: true
})
export class DoctorPrescriptionsPage implements OnInit {
  prescriptions: any[] = [];
  filteredPrescriptions: any[] = [];
  patients: any[] = [];
  searchTerm = '';
  selectedFilter = 'all';
  isLoading = true;
  isModalOpen = false;
  modalTitle = '';
  editingPrescription: any = null;
  prescriptionForm!: FormGroup;
  today = new Date().toISOString();

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {
    addIcons({ 
      documentTextOutline, searchOutline, addOutline, personOutline,
      calendarOutline, timeOutline, medicalOutline, eyeOutline, createOutline,
      trashOutline, downloadOutline, shareOutline, printOutline, closeOutline,
      checkmarkCircleOutline, warningOutline, refreshOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.loadPrescriptions();
    this.loadPatients();
  }

  initializeForm() {
    this.prescriptionForm = this.formBuilder.group({
      patientId: ['', Validators.required],
      diagnosis: ['', Validators.required],
      medications: this.formBuilder.array([]),
      notes: [''],
      followUpDate: ['']
    });
  }

  get medicationsArray() {
    return this.prescriptionForm.get('medications') as FormArray;
  }

  async loadPrescriptions() {
    this.isLoading = true;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.prescriptions = [
        {
          id: '1',
          patientId: 'pat1',
          patientName: 'John Smith',
          age: 35,
          gender: 'Male',
          diagnosis: 'Hypertension',
          medications: [
            {
              name: 'Amlodipine',
              dosage: '5mg',
              frequency: 'Once daily',
              duration: '30 days',
              instructions: 'Take in the morning'
            }
          ],
          notes: 'Monitor blood pressure weekly',
          status: 'completed',
          createdAt: new Date('2024-08-15T10:30:00')
        }
      ];
      
      this.filterPrescriptions();
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadPatients() {
    this.patients = [
      { id: 'pat1', name: 'John Smith', age: 35, gender: 'Male' },
      { id: 'pat2', name: 'Sarah Johnson', age: 28, gender: 'Female' }
    ];
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.filterPrescriptions();
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.filterPrescriptions();
  }

  filterPrescriptions() {
    let filtered = [...this.prescriptions];
    
    if (this.selectedFilter !== 'all') {
      if (this.selectedFilter === 'recent') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => new Date(p.createdAt) >= weekAgo);
      } else {
        filtered = filtered.filter(p => p.status === this.selectedFilter);
      }
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.patientName.toLowerCase().includes(term) ||
        p.diagnosis.toLowerCase().includes(term)
      );
    }
    
    this.filteredPrescriptions = filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async refreshPrescriptions(event?: any) {
    await this.loadPrescriptions();
    if (event) event.target.complete();
  }

  getEmptyStateMessage(): string {
    if (this.searchTerm) return 'No prescriptions match your search.';
    switch (this.selectedFilter) {
      case 'recent': return 'No recent prescriptions found.';
      case 'pending': return 'No pending prescriptions.';
      case 'completed': return 'No completed prescriptions.';
      default: return 'No prescriptions found. Create your first prescription.';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'checkmark-circle-outline';
      case 'pending': return 'time-outline';
      default: return 'document-text-outline';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  createPrescription() {
    this.editingPrescription = null;
    this.modalTitle = 'Create New Prescription';
    this.initializeForm();
    this.addMedication();
    this.isModalOpen = true;
  }

  editPrescription(prescription: any) {
    this.editingPrescription = prescription;
    this.modalTitle = 'Edit Prescription';
    this.isModalOpen = true;
  }

  addMedication() {
    const medicationGroup = this.formBuilder.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      instructions: ['']
    });
    this.medicationsArray.push(medicationGroup);
  }

  removeMedication(index: number) {
    this.medicationsArray.removeAt(index);
  }

  async savePrescription() {
    if (!this.prescriptionForm.valid) {
      this.showToast('Please fill all required fields', 'warning');
      return;
    }

    const formValue = this.prescriptionForm.value;
    const selectedPatient = this.patients.find(p => p.id === formValue.patientId);
    
    const prescriptionData = {
      ...formValue,
      patientName: selectedPatient?.name,
      age: selectedPatient?.age,
      gender: selectedPatient?.gender,
      status: 'completed',
      createdAt: new Date()
    };

    if (this.editingPrescription) {
      const index = this.prescriptions.findIndex(p => p.id === this.editingPrescription.id);
      if (index !== -1) {
        this.prescriptions[index] = { ...this.editingPrescription, ...prescriptionData };
      }
      this.showToast('Prescription updated successfully', 'success');
    } else {
      const newPrescription = {
        id: Date.now().toString(),
        ...prescriptionData
      };
      this.prescriptions.unshift(newPrescription);
      this.showToast('Prescription created successfully', 'success');
    }
    
    this.filterPrescriptions();
    this.closeModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingPrescription = null;
    this.prescriptionForm.reset();
  }

  viewPrescription(prescription: any) {
    console.log('View prescription:', prescription);
  }

  async deletePrescription(prescription: any) {
    const alert = await this.alertController.create({
      header: 'Delete Prescription',
      message: `Delete prescription for ${prescription.patientName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            const index = this.prescriptions.findIndex(p => p.id === prescription.id);
            if (index !== -1) {
              this.prescriptions.splice(index, 1);
              this.filterPrescriptions();
              this.showToast('Prescription deleted', 'success');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  downloadPrescription(prescription: any) {
    console.log('Download prescription:', prescription);
    this.showToast('Download feature coming soon', 'primary');
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
