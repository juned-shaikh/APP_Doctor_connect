import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonCard, 
  IonCardContent, IonButton, IonIcon, IonText, IonChip, IonLabel,
  IonItem, IonAvatar, IonBadge, IonGrid, IonRow, IonCol, IonSelect,
  IonSelectOption, IonRange, IonCheckbox, IonModal, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  searchOutline, locationOutline, starOutline, timeOutline,
  cashOutline, filterOutline, closeOutline, checkmarkOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { FirebaseService, UserData } from '../../../services/firebase.service';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  location: string;
  distance: number;
  avatar: string;
  isOnline: boolean;
  nextAvailable: string;
  languages: string[];
  qualifications: string[];
  verified: boolean;
}

@Component({
  selector: 'app-search-doctors',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-title>Find Doctors</ion-title>
          <ion-button slot="end" fill="clear" (click)="openFilters()">
            <ion-icon name="filter-outline"></ion-icon>
          </ion-button>
        </ion-toolbar>
      </ion-header>

      <div class="search-container">
        <!-- Search Bar -->
        <div class="search-section">
          <ion-searchbar
            [formControl]="searchControl"
            placeholder="Search doctors, specializations..."
            show-clear-button="focus"
            debounce="300">
          </ion-searchbar>
        </div>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <ion-chip 
            *ngFor="let specialization of popularSpecializations" 
            [color]="selectedSpecialization === specialization ? 'primary' : 'light'"
            (click)="selectSpecialization(specialization)">
            <ion-label>{{ specialization }}</ion-label>
          </ion-chip>
        </div>

        <!-- Active Filters -->
        <div class="active-filters" *ngIf="hasActiveFilters()">
          <ion-text color="medium">
            <small>Active filters:</small>
          </ion-text>
          <div class="filter-chips">
            <ion-chip color="primary" *ngIf="filters.location" (click)="clearFilter('location')">
              <ion-label>{{ filters.location }}</ion-label>
              <ion-icon name="close-outline"></ion-icon>
            </ion-chip>
            <ion-chip color="primary" *ngIf="filters.maxFee" (click)="clearFilter('maxFee')">
              <ion-label>Under ₹{{ filters.maxFee }}</ion-label>
              <ion-icon name="close-outline"></ion-icon>
            </ion-chip>
            <ion-chip color="primary" *ngIf="filters.onlineOnly" (click)="clearFilter('onlineOnly')">
              <ion-label>Online Only</ion-label>
              <ion-icon name="close-outline"></ion-icon>
            </ion-chip>
            <ion-chip color="primary" *ngIf="filters.minRating" (click)="clearFilter('minRating')">
              <ion-label>{{ filters.minRating }}+ Rating</ion-label>
              <ion-icon name="close-outline"></ion-icon>
            </ion-chip>
          </div>
        </div>

        <!-- Results Count -->
        <div class="results-info">
          <ion-text color="medium">
            <p>{{ filteredDoctors.length }} doctors found</p>
          </ion-text>
        </div>

        <!-- Doctor Cards -->
        <div class="doctors-list">
          <ion-card *ngFor="let doctor of filteredDoctors" class="doctor-card" (click)="viewDoctorDetails(doctor.id)">
            <ion-card-content>
              <div class="doctor-info">
                <div class="doctor-header">
                  <ion-avatar>
                    <img [src]="doctor.avatar" [alt]="doctor.name">
                  </ion-avatar>
                  <div class="doctor-basic">
                    <div class="name-verification">
                      <h3>Dr. {{ doctor.name }}</h3>
                      <ion-icon *ngIf="doctor.verified" name="checkmark-outline" color="success" class="verified-icon"></ion-icon>
                    </div>
                    <p class="specialization">{{ doctor.specialization }}</p>
                    <p class="experience">{{ doctor.experience }} years experience</p>
                  </div>
                  <div class="online-status" *ngIf="doctor.isOnline">
                    <ion-badge color="success">Online</ion-badge>
                  </div>
                </div>

                <div class="doctor-stats">
                  <div class="stat-item">
                    <ion-icon name="star-outline" color="warning"></ion-icon>
                    <span>{{ doctor.rating }} ({{ doctor.reviewCount }})</span>
                  </div>
                  <div class="stat-item">
                    <ion-icon name="cash-outline" color="primary"></ion-icon>
                    <span>₹{{ doctor.consultationFee }}</span>
                  </div>
                  <div class="stat-item">
                    <ion-icon name="location-outline" color="medium"></ion-icon>
                    <span>{{ doctor.distance }}km away</span>
                  </div>
                </div>

                <div class="doctor-details">
                  <div class="languages">
                    <ion-chip *ngFor="let language of doctor.languages.slice(0, 2)" color="light" size="small">
                      <ion-label>{{ language }}</ion-label>
                    </ion-chip>
                    <span *ngIf="doctor.languages.length > 2" class="more-languages">
                      +{{ doctor.languages.length - 2 }} more
                    </span>
                  </div>
                  
                  <div class="availability">
                    <ion-icon name="time-outline" color="success"></ion-icon>
                    <span>Next available: {{ doctor.nextAvailable }}</span>
                  </div>
                </div>

                <div class="action-buttons">
                  <ion-button fill="outline" size="small" (click)="bookAppointment(doctor.id); $event.stopPropagation()">
                    Book Appointment
                  </ion-button>
                  <ion-button fill="clear" size="small" (click)="viewDoctorDetails(doctor.id); $event.stopPropagation()">
                    View Profile
                  </ion-button>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- No Results -->
        <div class="no-results" *ngIf="filteredDoctors.length === 0">
          <ion-text color="medium">
            <h3>No doctors found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </ion-text>
          <ion-button fill="outline" (click)="clearAllFilters()">
            Clear All Filters
          </ion-button>
        </div>
      </div>

      <!-- Filter Modal -->
      <ion-modal #filterModal [isOpen]="showFilters" (didDismiss)="closeFilters()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Filter Doctors</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeFilters()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <ion-content class="filter-content">
            <div class="filter-section">
              <h4>Location</h4>
              <ion-select [(ngModel)]="filters.location" placeholder="Select location">
                <ion-select-option value="">All Locations</ion-select-option>
                <ion-select-option value="Mumbai">Mumbai</ion-select-option>
                <ion-select-option value="Delhi">Delhi</ion-select-option>
                <ion-select-option value="Bangalore">Bangalore</ion-select-option>
                <ion-select-option value="Chennai">Chennai</ion-select-option>
                <ion-select-option value="Pune">Pune</ion-select-option>
              </ion-select>
            </div>

            <div class="filter-section">
              <h4>Consultation Fee</h4>
              <ion-range 
                [(ngModel)]="filters.maxFee" 
                min="0" 
                max="2000" 
                step="100"
                pin="true"
                snaps="true">
                <ion-label slot="start">₹0</ion-label>
                <ion-label slot="end">₹2000+</ion-label>
              </ion-range>
              <p class="range-value">Up to ₹{{ filters.maxFee || 2000 }}</p>
            </div>

            <div class="filter-section">
              <h4>Minimum Rating</h4>
              <ion-range 
                [(ngModel)]="filters.minRating" 
                min="0" 
                max="5" 
                step="0.5"
                pin="true"
                snaps="true">
                <ion-label slot="start">0</ion-label>
                <ion-label slot="end">5</ion-label>
              </ion-range>
              <p class="range-value">{{ filters.minRating || 0 }}+ stars</p>
            </div>

            <div class="filter-section">
              <h4>Availability</h4>
              <ion-item>
                <ion-checkbox [(ngModel)]="filters.onlineOnly"></ion-checkbox>
                <ion-label class="ion-margin-start">Online consultations only</ion-label>
              </ion-item>
              <ion-item>
                <ion-checkbox [(ngModel)]="filters.todayAvailable"></ion-checkbox>
                <ion-label class="ion-margin-start">Available today</ion-label>
              </ion-item>
            </div>

            <div class="filter-section">
              <h4>Specialization</h4>
              <ion-select [(ngModel)]="filters.specialization" placeholder="All specializations">
                <ion-select-option value="">All Specializations</ion-select-option>
                <ion-select-option *ngFor="let spec of allSpecializations" [value]="spec">
                  {{ spec }}
                </ion-select-option>
              </ion-select>
            </div>

            <div class="filter-actions">
              <ion-button expand="block" (click)="applyFilters()">
                Apply Filters
              </ion-button>
              <ion-button expand="block" fill="outline" (click)="clearAllFilters()">
                Clear All
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .search-container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .search-section {
      margin-bottom: 1rem;
    }
    .quick-filters {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    .quick-filters::-webkit-scrollbar {
      display: none;
    }
    .active-filters {
      margin-bottom: 1rem;
    }
    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .results-info {
      margin-bottom: 1rem;
    }
    .results-info p {
      margin: 0;
      font-size: 0.9rem;
    }
    .doctors-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .doctor-card {
      cursor: pointer;
      transition: transform 0.2s;
      margin: 0;
    }
    .doctor-card:hover {
      transform: translateY(-2px);
    }
    .doctor-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .doctor-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      position: relative;
    }
    .doctor-basic {
      flex: 1;
    }
    .name-verification {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .name-verification h3 {
      margin: 0;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .verified-icon {
      font-size: 1rem;
    }
    .specialization {
      margin: 0.25rem 0;
      color: var(--ion-color-primary);
      font-weight: 500;
    }
    .experience {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    .online-status {
      position: absolute;
      top: 0;
      right: 0;
    }
    .doctor-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.9rem;
    }
    .stat-item ion-icon {
      font-size: 1rem;
    }
    .doctor-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .languages {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .more-languages {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    .availability {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .no-results {
      text-align: center;
      padding: 2rem;
    }
    .no-results h3 {
      margin: 0 0 0.5rem 0;
    }
    .no-results p {
      margin: 0 0 1rem 0;
    }
    .filter-content {
      padding: 1rem;
    }
    .filter-section {
      margin-bottom: 2rem;
    }
    .filter-section h4 {
      margin: 0 0 1rem 0;
      font-weight: bold;
    }
    .range-value {
      text-align: center;
      margin: 0.5rem 0 0 0;
      font-weight: 500;
      color: var(--ion-color-primary);
    }
    .filter-actions {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .doctor-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .online-status {
        position: static;
        margin-top: 0.5rem;
      }
      .doctor-stats {
        justify-content: center;
      }
      .action-buttons {
        flex-direction: column;
      }
    }
  `],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonCard, 
    IonCardContent, IonButton, IonIcon, IonText, IonChip, IonLabel,
    IonItem, IonAvatar, IonBadge, IonGrid, IonRow, IonCol, IonSelect,
    IonSelectOption, IonRange, IonCheckbox, IonModal, IonButtons
  ],
  standalone: true
})
export class SearchDoctorsPage implements OnInit {
  searchControl = new FormControl('');
  showFilters = false;
  selectedSpecialization = '';
  private doctorsSub?: Subscription;

  popularSpecializations = [
    'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'
  ];

  allSpecializations = [
    'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology',
    'Psychiatry', 'Gynecology', 'Urology', 'ENT', 'Ophthalmology',
    'General Medicine', 'Gastroenterology', 'Pulmonology', 'Endocrinology'
  ];

  filters = {
    location: '',
    maxFee: 2000,
    minRating: 0,
    onlineOnly: false,
    todayAvailable: false,
    specialization: ''
  };

  doctors: Doctor[] = [];

  filteredDoctors: Doctor[] = [];

  constructor(private router: Router, private firebaseService: FirebaseService) {
    addIcons({ 
      searchOutline, locationOutline, starOutline, timeOutline,
      cashOutline, filterOutline, closeOutline, checkmarkOutline
    });
  }

  ngOnInit() {
    // Subscribe to live registered doctors (approved + active)
    this.doctorsSub = this.firebaseService.getUsersByRole('doctor').subscribe((users: UserData[]) => {
      const approvedActive = users.filter(u => u.isActive);
      this.doctors = approvedActive.map(u => ({
        id: (u.id || (u as any).uid || ''),
        name: (u as any).name || 'Unnamed',
        specialization: (u as any).specialization || 'General Medicine',
        experience: (u as any).experience || 0,
        rating: (u as any).rating || 0,
        reviewCount: (u as any).reviewCount || 0,
        consultationFee: (u as any).consultationFee || 0,
        location: (u as any).location || '',
        distance: 0,
        avatar: (u as any).avatar || 'assets/icon/favicon.png',
        isOnline: !!((u as any).isOnline),
        nextAvailable: 'Today',
        languages: Array.isArray((u as any).languages) ? (u as any).languages : [],
        qualifications: Array.isArray((u as any).qualifications) ? (u as any).qualifications : [],
        verified: u.kycStatus === 'approved'
      }));
      this.filteredDoctors = [...this.doctors];
      this.filterDoctors();
    });
    this.setupSearch();
  }

  ngOnDestroy() {
    this.doctorsSub?.unsubscribe();
  }

  setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filterDoctors();
      });
  }

  selectSpecialization(specialization: string) {
    if (this.selectedSpecialization === specialization) {
      this.selectedSpecialization = '';
    } else {
      this.selectedSpecialization = specialization;
    }
    this.filterDoctors();
  }

  filterDoctors() {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    
    this.filteredDoctors = this.doctors.filter(doctor => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        doctor.name.toLowerCase().includes(searchTerm) ||
        doctor.specialization.toLowerCase().includes(searchTerm);

      // Specialization filter
      const matchesSpecialization = !this.selectedSpecialization || 
        doctor.specialization === this.selectedSpecialization;

      // Location filter
      const matchesLocation = !this.filters.location || 
        doctor.location === this.filters.location;

      // Fee filter
      const matchesFee = !this.filters.maxFee || 
        doctor.consultationFee <= this.filters.maxFee;

      // Rating filter
      const matchesRating = !this.filters.minRating || 
        doctor.rating >= this.filters.minRating;

      // Online only filter
      const matchesOnline = !this.filters.onlineOnly || doctor.isOnline;

      // Specialization from filters
      const matchesFilterSpecialization = !this.filters.specialization || 
        doctor.specialization === this.filters.specialization;

      return matchesSearch && matchesSpecialization && matchesLocation && 
             matchesFee && matchesRating && matchesOnline && matchesFilterSpecialization;
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.location || this.filters.maxFee < 2000 || 
              this.filters.minRating > 0 || this.filters.onlineOnly || 
              this.filters.specialization);
  }

  clearFilter(filterType: string) {
    switch (filterType) {
      case 'location':
        this.filters.location = '';
        break;
      case 'maxFee':
        this.filters.maxFee = 2000;
        break;
      case 'minRating':
        this.filters.minRating = 0;
        break;
      case 'onlineOnly':
        this.filters.onlineOnly = false;
        break;
      case 'specialization':
        this.filters.specialization = '';
        break;
    }
    this.filterDoctors();
  }

  clearAllFilters() {
    this.filters = {
      location: '',
      maxFee: 2000,
      minRating: 0,
      onlineOnly: false,
      todayAvailable: false,
      specialization: ''
    };
    this.selectedSpecialization = '';
    this.searchControl.setValue('');
    this.filterDoctors();
  }

  openFilters() {
    this.showFilters = true;
  }

  closeFilters() {
    this.showFilters = false;
  }

  applyFilters() {
    this.filterDoctors();
    this.closeFilters();
  }

  viewDoctorDetails(doctorId: string) {
    this.router.navigate(['/patient/doctor-details', doctorId]);
  }

  bookAppointment(doctorId: string) {
    this.router.navigate(['/patient/book-appointment', doctorId]);
  }
}
