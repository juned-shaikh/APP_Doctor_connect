import { Component, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-patient-tabs',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, RouterLinkActive],
  template: `
    <div class="tabs-container">
      <a 
        *ngFor="let tab of tabs" 
        [routerLink]="tab.path" 
        routerLinkActive="tab-selected"
        class="tab-button"
      >
        <span class="material-icons">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </a>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      width: 100%;
      height: 60px;
      background: #ffffff;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      contain: layout size style;
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.95);
      padding-bottom: env(safe-area-inset-bottom, 0);
      box-sizing: border-box;
    }

    .tabs-container {
      display: flex;
      height: 100%;
      align-items: center;
      justify-content: space-around;
      padding: 0 8px;
      max-width: 600px;
      margin: 0 auto;
    }

    .tab-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 8px 12px;
      color: #666;
      text-decoration: none;
      transition: all 0.2s ease;
      flex: 1;
      max-width: 120px;
      position: relative;
      font-size: 0.8rem;
      
      .material-icons {
        font-size: 24px;
        margin-bottom: 4px;
        transition: all 0.2s ease;
        color: inherit;
      }

      .tab-label {
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      &:active {
        opacity: 0.7;
      }

      &.tab-selected {
        color: #28a745;
        
        .material-icons {
          transform: translateY(-2px);
          font-weight: bold;
        }
        
        .tab-label {
          font-weight: 600;
        }
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 3px;
          background: #28a745;
          border-radius: 3px 3px 0 0;
        }
      }
    }
    `
  ]
})
export class PatientTabsComponent {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  
  tabs = [
    { path: '/patient/dashboard', icon: 'home', label: 'Home' },
    { path: '/patient/appointments', icon: 'event', label: 'Appointments' },
    { path: '/patient/profile', icon: 'person', label: 'Profile' }
  ];

  constructor() {
    // Force change detection when route changes to update active tab
    this.router.events.subscribe(() => {
      this.ngZone.run(() => {
        // Trigger change detection
      });
    });
  }
}
