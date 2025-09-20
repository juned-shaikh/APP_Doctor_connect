import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoCallService, CallState } from '../../services/video-call.service';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonText, IonCard, IonCardContent, IonSpinner, IonButtons, IonBackButton,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  videocam, videocamOff, mic, micOff, call, callOutline,
  person, personCircle, arrowBack
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-consultation',
  templateUrl: './video-consultation.page.html',
  styleUrls: ['./video-consultation.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButton,
    IonIcon, IonText, IonCard, IonCardContent, IonSpinner, IonButtons, IonBackButton
  ]
})
export class VideoConsultationPage implements OnInit, OnDestroy {
  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideo!: ElementRef<HTMLVideoElement>;

  callState: CallState = { isInCall: false, isConnecting: false };
  appointmentId: string = '';
  callId: string = '';
  isDoctor: boolean = false;
  participantName: string = '';
  isVideoEnabled: boolean = true;
  isAudioEnabled: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private videoCallService: VideoCallService,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      videocam, videocamOff, mic, micOff, call, callOutline,
      person, personCircle, arrowBack
    });
  }

  ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('appointmentId') || '';

    if (!this.appointmentId) {
      this.showError('Invalid appointment ID');
      return;
    }

    this.initializeCall();
    this.subscribeToCallState();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.videoCallService.endCall();
  }

  private async initializeCall() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.showError('User not authenticated');
        return;
      }

      // Get appointment details
      const appointment = await this.firebaseService.getAppointmentById(this.appointmentId).pipe().toPromise();
      if (!appointment) {
        this.showError('Appointment not found');
        return;
      }

      // Determine if current user is doctor or patient
      this.isDoctor = currentUser.uid === appointment.doctorId;
      this.participantName = this.isDoctor ? appointment.patientName : appointment.doctorName;

      // Create or join video call
      if (this.isDoctor) {
        // Doctor creates the call
        this.callId = await this.firebaseService.createVideoCall(
          this.appointmentId,
          appointment.doctorId,
          appointment.patientId
        );
        await this.videoCallService.initializeCall(this.callId, true);
      } else {
        // Patient joins existing call
        // In a real app, you'd get the callId from the appointment or notification
        // For now, we'll create it with a predictable pattern
        this.callId = `call_${this.appointmentId}`;
        await this.videoCallService.initializeCall(this.callId, false);
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      this.showError('Failed to initialize video call');
    }
  }

  private subscribeToCallState() {
    const callStateSub = this.videoCallService.callState$.subscribe(state => {
      this.callState = state;

      // Update video elements when streams are available
      if (state.localStream && this.localVideo) {
        this.localVideo.nativeElement.srcObject = state.localStream;
      }

      if (state.remoteStream && this.remoteVideo) {
        this.remoteVideo.nativeElement.srcObject = state.remoteStream;
      }

      if (state.error) {
        this.showError(state.error);
      }
    });

    this.subscriptions.push(callStateSub);
  }

  async toggleVideo() {
    try {
      await this.videoCallService.toggleVideo();
      this.isVideoEnabled = !this.isVideoEnabled;
    } catch (error) {
      console.error('Error toggling video:', error);
      this.showError('Failed to toggle video');
    }
  }

  async toggleAudio() {
    try {
      await this.videoCallService.toggleAudio();
      this.isAudioEnabled = !this.isAudioEnabled;
    } catch (error) {
      console.error('Error toggling audio:', error);
      this.showError('Failed to toggle audio');
    }
  }

  async endCall() {
    const alert = await this.alertController.create({
      header: 'End Call',
      message: 'Are you sure you want to end this video consultation?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'End Call',
          handler: async () => {
            try {
              await this.videoCallService.endCall();

              // Update appointment status if doctor
              if (this.isDoctor) {
                await this.firebaseService.updateAppointment(this.appointmentId, {
                  status: 'completed',
                  completedAt: new Date()
                });
              }

              this.router.navigate([this.isDoctor ? '/doctor/dashboard' : '/patient/dashboard']);
            } catch (error) {
              console.error('Error ending call:', error);
              this.showError('Failed to end call properly');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  get connectionStatus(): string {
    if (this.callState.isConnecting) return 'Connecting...';
    if (this.callState.isInCall && this.callState.remoteStream) return 'Connected';
    if (this.callState.isInCall) return 'Waiting for participant...';
    return 'Not connected';
  }

  get showVideoControls(): boolean {
    return this.callState.isInCall || this.callState.isConnecting;
  }
}