import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PatientTabsComponent } from '../../components/patient-tabs/patient-tabs.component';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    PatientTabsComponent
  ],
  template: `
    <ion-app class="safe-top-md">
      <div class="page-wrapper">
        <div class="content-wrapper">
          <ion-router-outlet></ion-router-outlet>
        </div>
        <app-patient-tabs></app-patient-tabs>
      </div>
    </ion-app>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom:0;
      contain: layout size style;
      overflow: hidden;
    }
    
    .page-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      position: relative;
    }
    
    .content-wrapper {
      flex: 1;
      width: 100%;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-top: var(--ion-safe-area-top, 0);
     
    }
    
    ion-router-outlet {
      display: block;
      width: 100%;
      height: 100%;
      contain: layout size style;
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
export class PatientShellComponent {
  private platform = inject(Platform);

  constructor() {
    this.platform.ready().then(() => {
      // Add any platform-specific initialization here
    });
  }
}
