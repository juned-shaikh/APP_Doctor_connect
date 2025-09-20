import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DoctorTabsComponent } from '../../../components/doctor-tabs/doctor-tabs.component';

@Component({
  selector: 'app-doctor-shell',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DoctorTabsComponent
  ],
  template: `
    <ion-app class="safe-top-md">
      <div class="page-wrapper">
        <div class="content-wrapper">
          <ion-router-outlet></ion-router-outlet>
        </div>
        <app-doctor-tabs></app-doctor-tabs>
      </div>
    </ion-app>
  `,
  styles: [`
    :host {
      --tabs-height: 60px;
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      contain: layout size style;
    }
    
    ion-app {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .page-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
      padding-bottom: var(--tabs-height);
    }
    
    .content-wrapper {
      flex: 1;
      width: 100%;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      position: relative;
    }
    
    ion-router-outlet {
      display: block;
      width: 100%;
      min-height: 100%;
      contain: layout size style;
    }
    
    app-patient-tabs {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--tabs-height);
      z-index: 10;
      background: white;
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
    }
    
    app-patient-tabs {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      z-index: 10;
      background: white;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      padding-bottom: var(--ion-safe-area-bottom, 0);
    }
    
    /* Add safe area for notched devices */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      :host {
        --ion-safe-area-bottom: env(safe-area-inset-bottom);
      }
      
      app-patient-tabs {
        padding-bottom: env(safe-area-inset-bottom);
        height: calc(60px + env(safe-area-inset-bottom));
      }
      
      ion-content {
        --padding-bottom: calc(60px + env(safe-area-inset-bottom));
      }
    }
  `]
})
export class DoctorShellComponent {}
