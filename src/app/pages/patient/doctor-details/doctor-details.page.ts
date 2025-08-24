import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonChip,
  IonLabel, IonBadge, IonItem, IonAvatar, IonGrid, IonRow, IonCol,
  IonBackButton, IonButtons, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  starOutline, locationOutline, timeOutline, cashOutline, 
  checkmarkCircleOutline, schoolOutline, languageOutline,
  calendarOutline, chatbubbleOutline, callOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  location: string;
  avatar: string;
  isOnline: boolean;
  nextAvailable: string;
  languages: string[];
  qualifications: string[];
  verified: boolean;
  about: string;
  clinicName: string;
  clinicAddress: string;
  workingHours: string;
  services: string[];
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

@Component({
  selector: 'app-doctor-details',
  template: `
    <ion-content>
      <ion-header [translucent]="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button></ion-back-button>
          </ion-buttons>
          <ion-title>Doctor Details</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="doctor-details-container" *ngIf="doctor">
        <!-- Doctor Profile Header -->
        <ion-card class="profile-card">
          <ion-card-content>
            <div class="doctor-header">
              <ion-avatar size="large">
                <img [src]="doctor.avatar" [alt]="doctor.name">
              </ion-avatar>
              <div class="doctor-info">
                <div class="name-verification">
                  <h2>Dr. {{ doctor.name }}</h2>
                  <ion-icon *ngIf="doctor.verified" name="checkmark-circle-outline" color="success"></ion-icon>
                </div>
                <p class="specialization">{{ doctor.specialization }}</p>
                <p class="experience">{{ doctor.experience }} years experience</p>
                
                <div class="stats-row">
                  <div class="stat">
                    <ion-icon name="star-outline" color="warning"></ion-icon>
                    <span>{{ doctor.rating }} ({{ doctor.reviewCount }})</span>
                  </div>
                  <div class="stat">
                    <ion-icon name="cash-outline" color="primary"></ion-icon>
                    <span>₹{{ doctor.consultationFee }}</span>
                  </div>
                  <div class="stat">
                    <ion-icon name="location-outline" color="medium"></ion-icon>
                    <span>{{ doctor.location }}</span>
                  </div>
                </div>

                <div class="availability" *ngIf="doctor.isOnline">
                  <ion-badge color="success">Available Now</ion-badge>
                  <span class="next-slot">Next: {{ doctor.nextAvailable }}</span>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <ion-button expand="block" (click)="bookAppointment()" class="book-button">
            <ion-icon name="calendar-outline" slot="start"></ion-icon>
            Book Appointment
          </ion-button>
          
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-button expand="block" fill="outline" (click)="startChat()">
                  <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
                  Chat
                </ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button expand="block" fill="outline" (click)="callDoctor()" *ngIf="doctor.isOnline">
                  <ion-icon name="call-outline" slot="start"></ion-icon>
                  Call Now
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>

        <!-- Content Segments -->
        <ion-segment [(ngModel)]="selectedSegment" (ionChange)="segmentChanged($event)">
          <ion-segment-button value="about">
            <ion-label>About</ion-label>
          </ion-segment-button>
          <ion-segment-button value="reviews">
            <ion-label>Reviews</ion-label>
          </ion-segment-button>
          <ion-segment-button value="location">
            <ion-label>Location</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- About Section -->
        <div *ngIf="selectedSegment === 'about'" class="content-section">
          <ion-card>
            <ion-card-header>
              <ion-card-title>About Dr. {{ doctor.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ doctor.about }}</p>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="school-outline"></ion-icon>
                Qualifications
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="qualifications">
                <ion-chip *ngFor="let qualification of doctor.qualifications" color="primary">
                  <ion-label>{{ qualification }}</ion-label>
                </ion-chip>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="language-outline"></ion-icon>
                Languages
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="languages">
                <ion-chip *ngFor="let language of doctor.languages" color="secondary">
                  <ion-label>{{ language }}</ion-label>
                </ion-chip>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>Services</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="services">
                <div *ngFor="let service of doctor.services" class="service-item">
                  <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
                  <span>{{ service }}</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Reviews Section -->
        <div *ngIf="selectedSegment === 'reviews'" class="content-section">
          <ion-card class="rating-summary">
            <ion-card-content>
              <div class="rating-overview">
                <div class="rating-score">
                  <h1>{{ doctor.rating }}</h1>
                  <div class="stars">
                    <ion-icon *ngFor="let star of getStarArray(doctor.rating)" name="star" color="warning"></ion-icon>
                  </div>
                  <p>{{ doctor.reviewCount }} reviews</p>
                </div>
                <div class="rating-breakdown">
                  <div class="rating-bar" *ngFor="let rating of ratingBreakdown">
                    <span>{{ rating.stars }} star</span>
                    <div class="bar">
                      <div class="fill" [style.width.%]="rating.percentage"></div>
                    </div>
                    <span>{{ rating.count }}</span>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <div class="reviews-list">
            <ion-card *ngFor="let review of reviews" class="review-card">
              <ion-card-content>
                <div class="review-header">
                  <div class="reviewer-info">
                    <h4>{{ review.patientName }}</h4>
                    <div class="review-rating">
                      <ion-icon *ngFor="let star of getStarArray(review.rating)" name="star" color="warning"></ion-icon>
                    </div>
                  </div>
                  <div class="review-meta">
                    <span class="date">{{ review.date }}</span>
                    <ion-badge *ngIf="review.verified" color="success" size="small">Verified</ion-badge>
                  </div>
                </div>
                <p class="review-comment">{{ review.comment }}</p>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <!-- Location Section -->
        <div *ngIf="selectedSegment === 'location'" class="content-section">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Clinic Information</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="clinic-info">
                <h4>{{ doctor.clinicName }}</h4>
                <p class="address">{{ doctor.clinicAddress }}</p>
                <div class="working-hours">
                  <ion-icon name="time-outline" color="primary"></ion-icon>
                  <span>{{ doctor.workingHours }}</span>
                </div>
              </div>
              
              <ion-button expand="block" fill="outline" (click)="getDirections()">
                <ion-icon name="location-outline" slot="start"></ion-icon>
                Get Directions
              </ion-button>
            </ion-card-content>
          </ion-card>

          <!-- Map placeholder -->
          <ion-card class="map-card">
            <ion-card-content>
              <div class="map-placeholder">
                <ion-icon name="location-outline" size="large" color="medium"></ion-icon>
                <p>Map will be displayed here</p>
                <small>Integration with Google Maps pending</small>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .doctor-details-container {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .profile-card {
      margin-bottom: 1rem;
    }
    .doctor-header {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .doctor-info {
      flex: 1;
    }
    .name-verification {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .name-verification h2 {
      margin: 0;
      font-weight: bold;
    }
    .specialization {
      margin: 0 0 0.25rem 0;
      color: var(--ion-color-primary);
      font-weight: 500;
      font-size: 1.1rem;
    }
    .experience {
      margin: 0 0 1rem 0;
      opacity: 0.7;
    }
    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.9rem;
    }
    .availability {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .next-slot {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    .action-buttons {
      margin-bottom: 1rem;
    }
    .book-button {
      --background: #4CAF50;
      --background-hover: #45a049;
      margin-bottom: 1rem;
      font-weight: bold;
    }
    .content-section {
      margin-top: 1rem;
    }
    .qualifications, .languages {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .services {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .service-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .rating-summary {
      margin-bottom: 1rem;
    }
    .rating-overview {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    .rating-score {
      text-align: center;
    }
    .rating-score h1 {
      margin: 0;
      font-size: 3rem;
      font-weight: bold;
      color: var(--ion-color-warning);
    }
    .stars {
      margin: 0.5rem 0;
    }
    .rating-score p {
      margin: 0;
      opacity: 0.7;
    }
    .rating-breakdown {
      flex: 1;
    }
    .rating-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    .rating-bar span {
      min-width: 60px;
      font-size: 0.9rem;
    }
    .bar {
      flex: 1;
      height: 8px;
      background-color: var(--ion-color-light);
      border-radius: 4px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      background-color: var(--ion-color-warning);
      transition: width 0.3s ease;
    }
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .review-card {
      margin: 0;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .reviewer-info h4 {
      margin: 0 0 0.25rem 0;
      font-weight: bold;
    }
    .review-rating {
      display: flex;
      gap: 0.1rem;
    }
    .review-meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .date {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    .review-comment {
      margin: 0;
      line-height: 1.5;
    }
    .clinic-info h4 {
      margin: 0 0 0.5rem 0;
      font-weight: bold;
    }
    .address {
      margin: 0 0 1rem 0;
      opacity: 0.8;
      line-height: 1.4;
    }
    .working-hours {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .map-card {
      margin-top: 1rem;
    }
    .map-placeholder {
      text-align: center;
      padding: 2rem;
      opacity: 0.6;
    }
    .map-placeholder p {
      margin: 1rem 0 0.5rem 0;
    }
    .map-placeholder small {
      font-size: 0.8rem;
    }
    @media (max-width: 768px) {
      .doctor-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .stats-row {
        justify-content: center;
      }
      .rating-overview {
        flex-direction: column;
        text-align: center;
      }
      .review-header {
        flex-direction: column;
        gap: 0.5rem;
      }
      .review-meta {
        text-align: left;
      }
    }
  `],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonChip,
    IonLabel, IonBadge, IonItem, IonAvatar, IonGrid, IonRow, IonCol,
    IonBackButton, IonButtons, IonSegment, IonSegmentButton
  ],
  standalone: true
})
export class DoctorDetailsPage implements OnInit {
  doctorId: string = '';
  doctor: Doctor | null = null;
  selectedSegment = 'about';

  ratingBreakdown = [
    { stars: 5, count: 45, percentage: 60 },
    { stars: 4, count: 25, percentage: 33 },
    { stars: 3, count: 8, percentage: 11 },
    { stars: 2, count: 3, percentage: 4 },
    { stars: 1, count: 1, percentage: 1 }
  ];

  reviews: Review[] = [
    {
      id: '1',
      patientName: 'Anita Sharma',
      rating: 5,
      comment: 'Excellent doctor! Very patient and thorough in examination. Explained everything clearly and the treatment was very effective.',
      date: '2 days ago',
      verified: true
    },
    {
      id: '2',
      patientName: 'Rohit Kumar',
      rating: 4,
      comment: 'Good consultation experience. Doctor was knowledgeable and prescribed the right medication. Clinic was clean and well-maintained.',
      date: '1 week ago',
      verified: true
    },
    {
      id: '3',
      patientName: 'Meera Patel',
      rating: 5,
      comment: 'Dr. Kumar is amazing! He took time to listen to all my concerns and provided excellent care. Highly recommend!',
      date: '2 weeks ago',
      verified: false
    }
  ];

  // Mock doctor data - in real app this would come from a service
  mockDoctors: Doctor[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      specialization: 'Cardiology',
      experience: 15,
      rating: 4.8,
      reviewCount: 234,
      consultationFee: 800,
      location: 'Mumbai',
      avatar: 'assets/doctor1.jpg',
      isOnline: true,
      nextAvailable: 'Today 3:00 PM',
      languages: ['English', 'Hindi', 'Marathi'],
      qualifications: ['MBBS', 'MD Cardiology', 'DM Cardiology'],
      verified: true,
      about: 'Dr. Rajesh Kumar is a highly experienced cardiologist with over 15 years of practice. He specializes in interventional cardiology and has performed over 2000 successful cardiac procedures. He is known for his patient-centric approach and excellent diagnostic skills.',
      clinicName: 'Heart Care Clinic',
      clinicAddress: 'Shop No. 12, Ground Floor, Sunshine Complex, Andheri West, Mumbai - 400058',
      workingHours: 'Mon-Sat: 9:00 AM - 6:00 PM',
      services: [
        'ECG & Echo Cardiography',
        'Cardiac Catheterization',
        'Angioplasty',
        'Pacemaker Implantation',
        'Heart Disease Prevention',
        'Cholesterol Management'
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ 
      starOutline, locationOutline, timeOutline, cashOutline, 
      checkmarkCircleOutline, schoolOutline, languageOutline,
      calendarOutline, chatbubbleOutline, callOutline
    });
  }

  ngOnInit() {
    this.doctorId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDoctorDetails();
  }

  loadDoctorDetails() {
    // In real app, this would be an API call
    this.doctor = this.mockDoctors.find(d => d.id === this.doctorId) || null;
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  bookAppointment() {
    this.router.navigate(['/patient/book-appointment', this.doctorId]);
  }

  startChat() {
    // Navigate to chat with doctor
    console.log('Start chat with doctor:', this.doctorId);
  }

  callDoctor() {
    // Initiate call with doctor
    console.log('Call doctor:', this.doctorId);
  }

  getDirections() {
    // Open maps with clinic location
    console.log('Get directions to clinic');
  }
}
