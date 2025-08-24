import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonText, IonProgressBar } from '@ionic/angular/standalone';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-splash',
  template: `
    <ion-content fullscreen class="splash">
      <div class="splash__bg"></div>
      <div class="splash__container">
        <div class="logo-card">
          <div class="logo-ring"></div>
          <div class="logo">
            <ion-text color="light">
              <h1 class="logo__emoji" aria-label="Doctor App">🏥</h1>
            </ion-text>
          </div>
        </div>

        <div class="title-block">
          <ion-text color="light">
            <h1 class="app-title">Doctor Connect</h1>
          </ion-text>
          <p class="app-subtitle">Your healthcare companion — book, manage, and consult with ease</p>
        </div>

        <div class="progress">
          <ion-progress-bar type="indeterminate" color="light"></ion-progress-bar>
          <span class="loading-text">Preparing your experience…</span>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* Container layout */
    .splash {
      --background: transparent;
    }
    .splash__bg {
      position: fixed;
      inset: 0;
      background: radial-gradient(1200px 800px at 20% 10%, rgba(255,255,255,0.10), transparent 60%),
                  radial-gradient(1000px 700px at 80% 90%, rgba(255,255,255,0.08), transparent 60%),
                  linear-gradient(135deg, #28a745 0%, #20c997 100%);
      animation: gradientShift 10s ease-in-out infinite alternate;
    }
    .splash__container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2.25rem;
      text-align: center;
      position: relative;
      z-index: 1;
      padding: 0 24px;
    }

    /* Logo card */
    .logo-card {
      position: relative;
      width: 108px;
      height: 108px;
      display: grid;
      place-items: center;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transform: translateZ(0);
      animation: float 4.5s ease-in-out infinite;
    }
    .logo-ring {
      position: absolute;
      inset: -2px;
      border-radius: 26px;
      background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.15));
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
              mask-composite: exclude;
      padding: 2px;
      pointer-events: none;
      opacity: 0.7;
    }
    .logo {
      width: 92px;
      height: 92px;
      display: grid;
      place-items: center;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255,255,255,0.15);
      animation: pulse 2.4s ease-in-out infinite;
    }
    .logo__emoji {
      margin: 0;
      font-size: 42px;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.25));
    }

    /* Titles */
    .title-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: #ffffff;
    }
    .app-title {
      margin: 0;
      font-weight: 800;
      font-size: 32px;
      letter-spacing: 0.3px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.25);
    }
    .app-subtitle {
      margin: 0;
      font-size: 14px;
      opacity: 0.92;
      color: rgba(255,255,255,0.95);
    }

    /* Progress */
    .progress {
      width: min(340px, 80vw);
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }
    ion-progress-bar {
      width: 100%;
      --background: rgba(255,255,255,0.25);
      --buffer-background: rgba(255,255,255,0.25);
      --progress-background: #ffffff;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .loading-text {
      color: rgba(255,255,255,0.95);
      font-size: 12px;
      letter-spacing: 0.2px;
    }

    /* Animations */
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
    @keyframes gradientShift {
      0% { filter: hue-rotate(0deg) brightness(1); }
      100% { filter: hue-rotate(-6deg) brightness(1.02); }
    }
  `],
  imports: [IonContent, IonText, IonProgressBar],
  standalone: true
})
export class SplashPage implements OnInit {
  constructor(
    private router: Router,
    private auth: Auth,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    // On app start, read auth state and route accordingly
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
          const role = (userDoc.exists() ? (userDoc.data() as any).userType : 'patient') as 'doctor' | 'patient' | 'admin';
          const target = role === 'doctor' ? '/doctor' : role === 'admin' ? '/admin' : '/patient';
          this.router.navigate([target]);
        } catch {
          this.router.navigate(['/patient']);
        }
      } else {
        this.router.navigate(['/user-type']);
      }
    });
  }
}