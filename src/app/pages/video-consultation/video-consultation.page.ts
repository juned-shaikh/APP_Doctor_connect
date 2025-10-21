import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoCallService, CallState } from '../../services/video-call.service';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { AndroidPermissionsService, PermissionStatus } from '../../services/android-permissions.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
  IonText, IonCard, IonCardContent, IonSpinner, IonButtons, IonBackButton,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  videocam, videocamOff, mic, micOff, call, callOutline,
  person, personCircle, arrowBack, settings, refresh, checkmarkCircle,
  helpCircle, bug, chevronDown
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { Capacitor } from '@capacitor/core';

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
  isNativeApp: boolean = false;
  permissionStatus: PermissionStatus = { camera: false, microphone: false, hasPermissions: false };
  showAdvancedOptions: boolean = false;
  hasCallEnded: boolean = false;
  
  // Call quality and duration tracking
  callDuration: string = '';
  connectionQualityIcon: string = 'wifi';
  connectionQualityColor: string = 'medium';
  connectionQualityText: string = 'Good';
  private callStartTime: Date | null = null;
  private durationInterval: any = null;
  private qualityCheckInterval: any = null;

  // Track video element states to prevent conflicts
  private localVideoPlaying: boolean = false;
  private remoteVideoPlaying: boolean = false;
  private lastLocalStreamId: string = '';
  private lastRemoteStreamId: string = '';
  
  // Debounce timers to prevent rapid stream changes
  private localVideoTimeout: any = null;
  private remoteVideoTimeout: any = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private videoCallService: VideoCallService,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private androidPermissions: AndroidPermissionsService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      videocam, videocamOff, mic, micOff, call, callOutline,
      person, personCircle, arrowBack, settings, refresh, checkmarkCircle,
      helpCircle, bug, chevronDown
    });
  }

  async ngOnInit() {
    this.appointmentId = this.route.snapshot.paramMap.get('appointmentId') || '';

    if (!this.appointmentId) {
      this.showError('Invalid appointment ID');
      return;
    }

    // Check if running as native app
    this.isNativeApp = await this.androidPermissions.isNativeApp();
    console.log('Is native app:', this.isNativeApp);

    if (this.isNativeApp) {
      const deviceInfo = await this.androidPermissions.getPlatformInfo();
      console.log('Device info:', deviceInfo);
    }

    // Check current permissions
    await this.checkCurrentPermissions();

    // Don't auto-initialize call, wait for user action
    this.subscribeToCallState();
  }

  async requestPermissionsAndStart() {
    // Clear any existing error state
    this.videoCallService.clearError();

    console.log('=== Permission Request Debug ===');
    console.log('Is native app:', this.isNativeApp);
    console.log('Current permissions:', this.permissionStatus);
    console.log('Is rejoining call:', this.hasCallEnded);

    if (this.isNativeApp) {
      await this.requestNativePermissions();
    } else {
      await this.requestWebPermissions();
    }
  }

  private async requestNativePermissions() {
    try {
      console.log('Requesting native Android permissions...');

      // First, check if permissions are already granted
      const currentStatus = await this.androidPermissions.checkPermissions();
      console.log('Current permission status before request:', currentStatus);

      if (currentStatus.hasPermissions) {
        console.log('Permissions already granted, starting call directly');
        this.permissionStatus = currentStatus;
        await this.initializeCall();
        return;
      }

      // Show subtle loading state in UI
      this.callState = { ...this.callState, isConnecting: true };

      // Request permissions using native Android APIs
      const permissions = await this.androidPermissions.requestPermissions();
      console.log('Permission result:', permissions);

      this.permissionStatus = permissions;

      if (permissions.hasPermissions) {
        await this.initializeCall();
      } else {
        // Show native Android permission instructions
        await this.showNativePermissionInstructions();
      }

    } catch (error: any) {
      console.error('Native permission request failed:', error);

      // If the error is that permissions are already granted, try to proceed
      if (error.message && error.message.includes('already granted')) {
        console.log('Permissions were already granted, proceeding with call');
        await this.initializeCall();
      } else {
        await this.showNativePermissionInstructions();
      }
    }
  }

  private async requestWebPermissions() {
    // Fallback to web permissions for browser/PWA
    try {
      const permissions = await this.androidPermissions.requestPermissions();
      this.permissionStatus = permissions;

      if (permissions.hasPermissions) {
        await this.initializeCall();
      } else {
        this.showPermissionInstructions();
      }
    } catch (error) {
      console.error('Web permission request failed:', error);
      this.showPermissionInstructions();
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clear any pending video timeouts
    if (this.localVideoTimeout) {
      clearTimeout(this.localVideoTimeout);
    }
    if (this.remoteVideoTimeout) {
      clearTimeout(this.remoteVideoTimeout);
    }
    
    // Clear duration and quality intervals
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
    }

    // Only end call if we're actually in a call, not just navigating back
    if (this.callState.isInCall || this.callState.isConnecting) {
      this.cleanupVideoCall();
    }
  }

  private async cleanupVideoCall() {
    try {
      // Stop local stream only
      if (this.videoCallService.getCurrentCallState().localStream) {
        const localStream = this.videoCallService.getCurrentCallState().localStream;
        localStream?.getTracks().forEach(track => track.stop());
      }

      // Don't call endCall() which might affect other parts of the app
      // Just clean up the local resources
    } catch (error) {
      console.error('Error cleaning up video call:', error);
    }
  }

  private async initializeCall() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.showError('User not authenticated');
        return;
      }

      // Remove pre-check and let the actual media request handle permissions

      // Get appointment details using firstValueFrom instead of deprecated toPromise
      const appointment = await new Promise((resolve, reject) => {
        const subscription = this.firebaseService.getAppointmentById(this.appointmentId).subscribe({
          next: (data) => {
            subscription.unsubscribe();
            resolve(data);
          },
          error: (error) => {
            subscription.unsubscribe();
            reject(error);
          }
        });
      });

      if (!appointment) {
        this.showError('Appointment not found');
        return;
      }

      // Determine if current user is doctor or patient
      this.isDoctor = currentUser.uid === (appointment as any).doctorId;
      this.participantName = this.isDoctor ? (appointment as any).patientName : (appointment as any).doctorName;

      // Debug logging
      console.log('User role determination:');
      console.log('Current user ID:', currentUser.uid);
      console.log('Appointment doctor ID:', (appointment as any).doctorId);
      console.log('Appointment patient ID:', (appointment as any).patientId);
      console.log('Is doctor (by appointment):', this.isDoctor);

      // Additional check: try to get user role from auth service or user data
      try {
        const userRole = currentUser.role || currentUser.userType;
        console.log('User role from auth:', userRole);

        // If we have role info, use it as backup
        if (userRole === 'doctor' && !this.isDoctor) {
          console.log('Correcting isDoctor based on user role');
          this.isDoctor = true;
        }
      } catch (error) {
        console.log('Could not get user role from auth service');
      }

      // Use consistent call ID pattern for both doctor and patient
      this.callId = `call_${this.appointmentId}`;

      // Check if video call document exists, create if not
      try {
        const existingCall = await new Promise((resolve) => {
          const subscription = this.firebaseService.getVideoCall(this.callId).subscribe({
            next: (data) => {
              subscription.unsubscribe();
              resolve(data);
            },
            error: () => {
              subscription.unsubscribe();
              resolve(null);
            }
          });
        });

        if (!existingCall) {
          // Create video call document
          await this.firebaseService.createVideoCall(
            this.appointmentId,
            (appointment as any).doctorId,
            (appointment as any).patientId
          );
        }
      } catch (error) {
        console.log('Creating new video call document');
        await this.firebaseService.createVideoCall(
          this.appointmentId,
          (appointment as any).doctorId,
          (appointment as any).patientId
        );
      }

      // Initialize the video call - doctor is always the initiator
      console.log('Initializing video call - isDoctor:', this.isDoctor, 'callId:', this.callId);
      console.log('Is rejoining:', this.hasCallEnded);

      // Use rejoin method if this is a rejoin scenario
      if (this.hasCallEnded) {
        console.log('Using rejoin method for fresh connection');
        await this.videoCallService.rejoinCall(this.callId, this.isDoctor);
      } else {
        await this.videoCallService.initializeCall(this.callId, this.isDoctor);
      }

      // Set up periodic video element verification for rejoin scenarios
      if (this.hasCallEnded) {
        this.setupRejoinVideoVerification();
      }

      // Wait a moment for streams to be established, then refresh video elements
      setTimeout(() => {
        this.refreshVideoElements();
      }, 2000);

      // Additional refresh for rejoining calls
      if (this.hasCallEnded) {
        setTimeout(() => {
          console.log('Additional refresh for rejoined call');
          this.refreshVideoElements();
        }, 4000);

        // Force refresh after a longer delay to ensure streams are established
        setTimeout(() => {
          console.log('Force refresh for rejoined call');
          this.forceRefreshVideo();
        }, 6000);
      }

    } catch (error) {
      console.error('Error initializing call:', error);

      if ((error as any).message === 'PERMISSION_DENIED') {
        this.showPermissionInstructions();
      } else {
        this.showError('Failed to initialize video call: ' + (error as any).message);
      }
    }
  }

  private refreshVideoElements() {
    console.log('Refreshing video elements...');

    // Force update video elements with current streams
    const currentState = this.videoCallService.getCurrentCallState();

    console.log('Current call state:', currentState);
    console.log('Local video element available:', !!this.localVideo);
    console.log('Remote video element available:', !!this.remoteVideo);

    if (currentState.localStream && this.localVideo) {
      console.log('Refreshing local video with stream:', currentState.localStream);
      console.log('Local stream tracks:', currentState.localStream?.getTracks());

      // Ensure the video element is ready
      const localVideoEl = this.localVideo.nativeElement;
      
      // Check if this is the same stream to avoid conflicts
      if (localVideoEl.srcObject !== currentState.localStream) {
        this.setVideoElementStream(localVideoEl, currentState.localStream, 'local');
      }
    } else {
      console.log('Local stream or video element not available');
    }

    if (currentState.remoteStream && this.remoteVideo) {
      console.log('Refreshing remote video with stream:', currentState.remoteStream);
      console.log('Remote stream tracks:', currentState.remoteStream?.getTracks());

      // Ensure the video element is ready
      const remoteVideoEl = this.remoteVideo.nativeElement;
      
      // Check if this is the same stream to avoid conflicts
      if (remoteVideoEl.srcObject !== currentState.remoteStream) {
        this.setVideoElementStream(remoteVideoEl, currentState.remoteStream, 'remote');
      }
    } else {
      console.log('Remote stream or video element not available');
    }
  }

  private async setVideoElementStream(videoElement: HTMLVideoElement, stream: MediaStream, type: 'local' | 'remote'): Promise<void> {
    try {
      console.log(`Setting ${type} video element stream`);
      
      // Remove any existing event listeners to prevent conflicts
      videoElement.onloadedmetadata = null;
      videoElement.oncanplay = null;
      
      // Pause and clear current stream
      if (!videoElement.paused) {
        videoElement.pause();
      }
      videoElement.srcObject = null;
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set video element properties to prevent artifacts
      videoElement.style.objectFit = 'cover';
      videoElement.style.transform = 'scaleX(1)'; // Ensure no mirroring issues
      
      // Set new stream
      videoElement.srcObject = stream;
      
      // Disable context menu and other interactions that might show controls
      videoElement.oncontextmenu = (e) => e.preventDefault();
      videoElement.ondblclick = (e) => e.preventDefault();
      videoElement.onmousedown = (e) => {
        if (e.button === 2) e.preventDefault(); // Right click
      };
      
      // Add error handling for video rendering issues
      videoElement.onerror = (error) => {
        console.error(`${type} video element error:`, error);
        // Try to recover from video rendering errors
        setTimeout(() => {
          if (videoElement.srcObject === stream) {
            console.log(`Attempting to recover ${type} video from rendering error`);
            videoElement.load();
          }
        }, 1000);
      };
      
      // Set up event handlers for better control
      videoElement.onloadedmetadata = () => {
        console.log(`${type} video metadata loaded`);
        this.playVideoElement(videoElement, type);
      };
      
      videoElement.oncanplay = () => {
        console.log(`${type} video can play`);
        this.playVideoElement(videoElement, type);
      };
      
      // Force load the video
      videoElement.load();
      
      // Try to play immediately as well
      setTimeout(() => {
        this.playVideoElement(videoElement, type);
      }, 200);
      
    } catch (error) {
      console.error(`Error setting ${type} video stream:`, error);
    }
  }

  private async playVideoElement(videoElement: HTMLVideoElement, type: 'local' | 'remote'): Promise<void> {
    try {
      // Ensure video is ready to play
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        await videoElement.play();
        console.log(`${type} video playing successfully`);
        
        // Update control states for local video
        if (type === 'local' && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          this.isVideoEnabled = stream.getVideoTracks().some(track => track.enabled);
          this.isAudioEnabled = stream.getAudioTracks().some(track => track.enabled);
        }
      }
    } catch (error: any) {
      console.error(`Error playing ${type} video:`, error);
      
      // Don't retry for AbortError as it means interrupted by new load
      if (error.name !== 'AbortError') {
        // Retry once after a delay
        setTimeout(async () => {
          try {
            if (videoElement.readyState >= 2) {
              await videoElement.play();
              console.log(`${type} video retry successful`);
            }
          } catch (retryError: any) {
            if (retryError.name !== 'AbortError') {
              console.error(`${type} video retry failed:`, retryError);
            }
          }
        }, 1000);
      }
    }
  }

  private subscribeToCallState() {
    const callStateSub = this.videoCallService.callState$.subscribe(state => {
      console.log('Call state updated:', state);

      // Track if call has ended (was in call but now isn't)
      if (this.callState.isInCall && !state.isInCall && !state.isConnecting) {
        this.hasCallEnded = true;
        console.log('Call has ended, enabling rejoin functionality');
      }

      // Track if we're rejoining (was ended, now connecting/in call)
      if (this.hasCallEnded && (state.isConnecting || state.isInCall)) {
        console.log('Rejoining call detected');
      }

      this.callState = state;

      // Handle call start/end for duration tracking
      if (state.isInCall && !this.callStartTime) {
        this.startCallDurationTracking();
      } else if (!state.isInCall && this.callStartTime) {
        this.stopCallDurationTracking();
      }

      // Update video elements when streams are available with enhanced handling
      if (state.localStream && this.localVideo) {
        console.log('Setting local video stream from call state:', state.localStream);
        const localVideoEl = this.localVideo.nativeElement;
        
        // Always refresh video element during rejoin or if stream is different
        if (localVideoEl.srcObject !== state.localStream || this.hasCallEnded) {
          this.setVideoElementStream(localVideoEl, state.localStream, 'local');
        }
      }

      if (state.remoteStream && this.remoteVideo) {
        console.log('Setting remote video stream from call state:', state.remoteStream);
        const remoteVideoEl = this.remoteVideo.nativeElement;
        
        // Always refresh video element during rejoin or if stream is different
        if (remoteVideoEl.srcObject !== state.remoteStream || this.hasCallEnded) {
          this.setVideoElementStream(remoteVideoEl, state.remoteStream, 'remote');
        }
      }

      // Special handling for rejoin scenarios - force refresh all video elements
      if (this.hasCallEnded && state.isInCall && (state.localStream || state.remoteStream)) {
        console.log('Rejoin detected with streams - forcing video refresh');
        setTimeout(() => {
          this.forceRefreshAllVideoElements();
        }, 1000);
      }

      // Start quality monitoring when both streams are available
      if (state.isInCall && state.localStream && state.remoteStream && !this.qualityCheckInterval) {
        this.startQualityMonitoring();
      }

      if (state.error) {
        // Handle permission errors specially
        if (state.error === 'PERMISSION_DENIED' || state.error.includes('Camera and microphone access denied')) {
          this.showPermissionInstructions();
        } else {
          this.showError(state.error);
        }
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
            await this.endVideoCall();
          }
        }
      ]
    });

    await alert.present();
  }

  async goBack() {
    // Handle back navigation without ending the call
    const alert = await this.alertController.create({
      header: 'Leave Call',
      message: 'Do you want to end the call or just minimize it?',
      buttons: [
        {
          text: 'Minimize',
          handler: () => {
            // Just navigate back without ending call
            this.navigateToDashboard();
          }
        },
        {
          text: 'End Call',
          handler: async () => {
            await this.endVideoCall();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async setVideoStreamDebounced(videoElement: HTMLVideoElement, stream: MediaStream, streamType: 'local' | 'remote'): Promise<void> {
    const isLocal = streamType === 'local';
    const timeoutRef = isLocal ? 'localVideoTimeout' : 'remoteVideoTimeout';
    
    // Clear any existing timeout to debounce rapid calls
    if (this[timeoutRef as keyof this]) {
      clearTimeout(this[timeoutRef as keyof this] as any);
    }
    
    // Set new timeout
    this[timeoutRef as keyof this] = setTimeout(async () => {
      await this.setVideoStream(videoElement, stream, streamType);
    }, 200) as any;
  }

  private async setVideoStream(videoElement: HTMLVideoElement, stream: MediaStream, streamType: 'local' | 'remote'): Promise<void> {
    const streamId = stream.id;
    const isLocal = streamType === 'local';
    
    // Check if this is the same stream we already have
    const lastStreamId = isLocal ? this.lastLocalStreamId : this.lastRemoteStreamId;
    if (lastStreamId === streamId && videoElement.srcObject === stream) {
      console.log(`${streamType} stream already set, skipping`);
      return;
    }

    console.log(`Setting ${streamType} video stream:`, streamId);

    try {
      // Pause current video if playing to prevent conflicts
      if (!videoElement.paused) {
        videoElement.pause();
      }

      // Wait a moment for any ongoing operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set the new stream
      videoElement.srcObject = stream;

      // Update tracking
      if (isLocal) {
        this.lastLocalStreamId = streamId;
      } else {
        this.lastRemoteStreamId = streamId;
      }

      // Attempt to play with proper error handling
      try {
        await videoElement.play();
        console.log(`${streamType} video playing successfully`);
        
        if (isLocal) {
          this.localVideoPlaying = true;
          // Update control states for local stream
          this.isVideoEnabled = stream.getVideoTracks().some(track => track.enabled);
          this.isAudioEnabled = stream.getAudioTracks().some(track => track.enabled);
        } else {
          this.remoteVideoPlaying = true;
        }
      } catch (playError: any) {
        console.error(`Error playing ${streamType} video:`, playError);
        
        // Handle AbortError specifically - don't retry as it means interrupted by new load
        if (playError.name === 'AbortError') {
          console.log(`${streamType} video play was interrupted by new load request - this is expected behavior`);
          return; // Don't retry for AbortError
        }
        
        // For other errors, retry once after a longer delay
        setTimeout(async () => {
          try {
            // Only retry if the stream is still the same
            if (videoElement.srcObject === stream && !videoElement.paused) {
              await videoElement.play();
              console.log(`${streamType} video retry successful`);
            }
          } catch (retryError: any) {
            if (retryError.name !== 'AbortError') {
              console.error(`${streamType} video retry failed:`, retryError);
            }
          }
        }, 1500);
      }
    } catch (error) {
      console.error(`Error setting ${streamType} video stream:`, error);
    }
  }



  private navigateToDashboard() {
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser?.role || currentUser?.userType;

    console.log('Navigating to dashboard - isDoctor:', this.isDoctor, 'userRole:', userRole);

    // Determine dashboard route with fallback logic
    let dashboardRoute = '/patient/dashboard'; // default

    if (this.isDoctor || userRole === 'doctor') {
      dashboardRoute = '/doctor/dashboard';
    }

    console.log('Navigation route:', dashboardRoute);
    this.router.navigate([dashboardRoute]);
  }

  private async endVideoCall() {
    try {
      await this.videoCallService.endCall();

      // Navigate back to dashboard
      this.navigateToDashboard();
    } catch (error) {
      console.error('Error ending call:', error);
      this.showError('Failed to end call properly');
    }
  }

  async markAppointmentCompleted() {
    const alert = await this.alertController.create({
      header: 'Mark as Present',
      message: 'Are you sure you want to mark this patient as present and complete the appointment? This will end the call and mark the consultation as completed.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Mark Present & Complete',
          handler: async () => {
            try {
              // End the video call first
              await this.videoCallService.endCall();

              // Update appointment status
              await this.firebaseService.updateAppointment(this.appointmentId, {
                status: 'completed',
                completedAt: new Date()
              });

              const toast = await this.toastController.create({
                message: 'Patient marked as present - Appointment completed',
                duration: 2000,
                color: 'success'
              });
              await toast.present();

              // Navigate back to dashboard
              this.navigateToDashboard();
            } catch (error) {
              console.error('Error marking appointment as completed:', error);
              this.showError('Failed to update appointment status');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async checkCurrentPermissions() {
    try {
      this.permissionStatus = await this.androidPermissions.checkPermissions();
      console.log('Current permission status:', this.permissionStatus);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 5000,
      color: 'danger',
      position: 'top',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private async showNativePermissionInstructions() {
    const alert = await this.alertController.create({
      header: 'Camera & Microphone Permissions Required',
      message: `This app needs access to your camera and microphone for video calls.

**To enable permissions:**
1. Tap "Open Settings" below
2. Find "Permissions" in the app settings
3. Enable Camera and Microphone permissions
4. Return to the app and try again

**Or:**
- Tap "Try Again" to request permissions again
- Some devices may show permission dialogs automatically`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.navigateToDashboard();
          }
        },
        {
          text: 'Open Settings',
          handler: async () => {
            await this.openNativeSettings();
          }
        },
        {
          text: 'Try Again',
          handler: () => {
            this.requestPermissionsAndStart();
          }
        }
      ]
    });
    await alert.present();
  }

  async openNativeSettings() {
    try {
      await this.androidPermissions.openAppSettings();

      // Show a message that they should return after enabling permissions
      const toast = await this.toastController.create({
        message: 'Enable Camera permission in the settings, then return to this app and tap "Refresh Status".',
        duration: 5000,
        color: 'primary',
        position: 'top'
      });
      await toast.present();

    } catch (error) {
      // Fallback: show manual instructions
      const toast = await this.toastController.create({
        message: 'Please manually open your device Settings > Apps > Doctor Connect > Permissions and enable Camera and Microphone.',
        duration: 8000,
        color: 'warning',
        position: 'top',
        buttons: [
          {
            text: 'Got It',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }

  async refreshPermissions() {
    console.log('Refreshing permission status...');

    const loading = await this.toastController.create({
      message: 'Checking permissions...',
      duration: 1000,
      color: 'primary'
    });
    await loading.present();

    await this.checkCurrentPermissions();

    if (this.permissionStatus.hasPermissions) {
      const toast = await this.toastController.create({
        message: 'Great! All permissions are now granted. You can start the video call.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } else {
      const missing = [];
      if (!this.permissionStatus.camera) missing.push('Camera');
      if (!this.permissionStatus.microphone) missing.push('Microphone');

      const toast = await this.toastController.create({
        message: `Still missing: ${missing.join(', ')} permissions. Please enable them in Settings.`,
        duration: 4000,
        color: 'warning'
      });
      await toast.present();
    }
  }

  private async showPermissionAlert() {
    const alert = await this.alertController.create({
      header: 'Permissions Required',
      message: 'This app needs access to your camera and microphone for video calls. Please allow permissions when prompted.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.navigateToDashboard();
          }
        },
        {
          text: 'Try Again',
          handler: () => {
            this.initializeCall();
          }
        }
      ]
    });
    await alert.present();
  }

  private async showPermissionInstructions() {
    const alert = await this.alertController.create({
      header: 'Camera & Microphone Access Denied',
      message: `To enable video calls, please follow these steps:

**For Chrome Mobile:**
1. Tap the lock icon (🔒) or site info icon next to the address bar
2. Tap "Permissions" or "Site settings"
3. Enable Camera and Microphone
4. Refresh this page

**For Safari Mobile:**
1. Go to Settings > Safari > Camera/Microphone
2. Allow access for this website
3. Refresh this page

**Alternative:**
- Clear browser data for this site and try again
- Use a different browser (Chrome recommended)`,
      buttons: [
        {
          text: 'Go Back',
          handler: () => {
            this.navigateToDashboard();
          }
        },
        {
          text: 'Open Settings',
          handler: () => {
            // Try to open browser settings (limited support)
            this.openBrowserSettings();
          }
        },
        {
          text: 'Try Force Request',
          handler: () => {
            this.forcePermissionRequest();
          }
        },
        {
          text: 'Try Incognito',
          handler: () => {
            this.tryIncognitoSuggestion();
          }
        },
        {
          text: 'Refresh Page',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }

  private async openBrowserSettings() {
    const userAgent = navigator.userAgent.toLowerCase();

    // Show a toast with manual instructions since programmatic opening is limited
    const toast = await this.toastController.create({
      message: 'Please manually tap the lock icon (🔒) in your browser address bar and enable Camera & Microphone permissions.',
      duration: 6000,
      position: 'top',
      color: 'warning',
      buttons: [
        {
          text: 'Got It',
          role: 'cancel'
        }
      ]
    });
    await toast.present();

    // Try to open settings programmatically (may not work on mobile)
    try {
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        // This usually doesn't work on mobile Chrome, but worth trying
        setTimeout(() => {
          window.open('chrome://settings/content/camera', '_blank');
        }, 1000);
      }
    } catch (error) {
      console.log('Could not open browser settings programmatically');
    }
  }

  private async showSafariInstructions() {
    const alert = await this.alertController.create({
      header: 'Safari Settings',
      message: `To enable camera and microphone in Safari:

1. Tap the "aA" icon in the address bar
2. Tap "Website Settings"
3. Enable Camera and Microphone
4. Refresh this page

Or go to Settings > Safari > Camera/Microphone and allow access for this site.`,
      buttons: [
        {
          text: 'Got It',
          handler: () => {
            // Optionally refresh the page
          }
        },
        {
          text: 'Refresh Page',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }

  private async showManualSettingsInstructions() {
    const toast = await this.toastController.create({
      message: 'Please manually open your browser settings and enable camera/microphone permissions for this site.',
      duration: 5000,
      position: 'top',
      color: 'warning'
    });
    await toast.present();
  }

  private async forcePermissionRequest() {
    // Show loading indicator
    const loading = await this.toastController.create({
      message: 'Attempting to request permissions...',
      duration: 2000,
      color: 'primary'
    });
    await loading.present();

    try {
      console.log('Attempting force permission request...');

      // Clear any existing error state first
      this.videoCallService.clearError();

      // Check if permissions are permanently blocked
      if ('permissions' in navigator) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

          if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
            throw new Error('PERMANENTLY_BLOCKED');
          }
        } catch (permError) {
          console.log('Permissions API check failed, proceeding with request');
        }
      }

      // Try multiple approaches to request permissions
      let stream: MediaStream | null = null;
      let lastError: any = null;

      // Approach 1: Try audio only first (more likely to succeed)
      try {
        console.log('Step 1: Requesting audio permission...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach(track => track.stop());
        console.log('Audio permission granted');

        // Now try video
        console.log('Step 2: Requesting video permission...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true
        });
      } catch (error1: any) {
        lastError = error1;
        console.log('Audio-first approach failed:', error1.name);

        // Approach 2: Try minimal video constraints
        try {
          console.log('Step 3: Trying minimal video constraints...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
            audio: true
          });
        } catch (error2: any) {
          lastError = error2;
          console.log('Minimal video failed:', error2.name);

          // Approach 3: Try just audio
          try {
            console.log('Step 4: Trying audio-only...');
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true
            });
          } catch (error3) {
            lastError = error3;
            throw error3; // Give up
          }
        }
      }

      if (stream) {
        // Success! Stop the test stream
        stream.getTracks().forEach(track => track.stop());

        const toast = await this.toastController.create({
          message: 'Permissions granted! Starting video call...',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // Wait a moment then initialize the call
        setTimeout(() => {
          this.initializeCall();
        }, 1000);
      }

    } catch (error: any) {
      console.error('Force permission request failed:', error);

      // Show specific error based on the type
      let errorMessage = 'Unable to access camera/microphone.';
      let showInstructions = false;

      if (error.message === 'PERMANENTLY_BLOCKED' || error.name === 'NotAllowedError') {
        errorMessage = 'Permissions are permanently blocked. You must manually enable them in browser settings.';
        showInstructions = true;
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found on your device.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error. Please ensure you are using HTTPS.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Permission request was cancelled.';
      }

      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 5000,
        color: 'danger',
        buttons: [
          {
            text: 'Dismiss',
            role: 'cancel'
          }
        ]
      });
      await toast.present();

      // Show manual instructions for blocked permissions
      if (showInstructions) {
        setTimeout(() => {
          this.showManualPermissionSteps();
        }, 2000);
      }
    }
  }

  async showPermissionHelp() {
    this.showPermissionInstructions();
  }

  private async detectPrivateBrowsing(): Promise<boolean> {
    try {
      // Try to detect private browsing mode
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.quota !== undefined && estimate.quota < 120000000; // Less than ~120MB suggests private mode
      }
      return false;
    } catch {
      return false;
    }
  }

  async tryIncognitoSuggestion() {
    const isPrivate = await this.detectPrivateBrowsing();

    const alert = await this.alertController.create({
      header: 'Try Private/Incognito Mode',
      message: isPrivate
        ? 'You are already in private browsing mode. Try opening this link in a regular browser window instead.'
        : 'Try opening this link in an incognito/private browsing window. This bypasses cached permission settings and may prompt for permissions again.',
      buttons: [
        {
          text: 'Copy Link',
          handler: () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
              this.showError('Link copied! Open it in incognito/private mode.');
            });
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  get connectionStatus(): string {
    if (this.callState.isConnecting) return 'Connecting...';
    if (this.callState.isInCall && this.callState.remoteStream) return 'Connected';
    if (this.callState.isInCall && this.callState.localStream) return 'Waiting for participant...';
    return 'Not connected';
  }

  get showVideoControls(): boolean {
    return this.callState.isInCall || this.callState.isConnecting;
  }

  private async showManualPermissionSteps() {
    const alert = await this.alertController.create({
      header: 'Manual Permission Setup',
      message: `Since permissions are blocked, please follow these exact steps:

1. Look for a lock icon (🔒) or site info icon in your browser's address bar
2. Tap on it
3. Find "Camera" and "Microphone" settings
4. Change both from "Block" to "Allow"
5. Refresh this page

If you don't see the lock icon, try accessing this page in a different browser or incognito mode.`,
      buttons: [
        {
          text: 'Copy Current URL',
          handler: () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
              this.showError('URL copied! Open it in a different browser or incognito mode.');
            });
          }
        },
        {
          text: 'Refresh Page',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }

  async debugPermissions() {
    let debugInfo = '=== Debug Information ===\n\n';

    // Basic info
    debugInfo += `User Agent: ${navigator.userAgent}\n`;
    debugInfo += `Protocol: ${location.protocol}\n`;
    debugInfo += `Host: ${location.host}\n`;
    debugInfo += `Is HTTPS: ${location.protocol === 'https:'}\n\n`;

    // Media devices support
    debugInfo += `MediaDevices API: ${!!navigator.mediaDevices}\n`;
    debugInfo += `getUserMedia: ${!!navigator.mediaDevices?.getUserMedia}\n\n`;

    // Check permissions if available
    if ('permissions' in navigator) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        debugInfo += `Camera Permission: ${cameraPermission.state}\n`;
        debugInfo += `Microphone Permission: ${microphonePermission.state}\n\n`;
      } catch (error) {
        debugInfo += `Permissions API Error: ${error}\n\n`;
      }
    } else {
      debugInfo += 'Permissions API not available\n\n';
    }

    // Device enumeration
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      const microphones = devices.filter(d => d.kind === 'audioinput');
      debugInfo += `Cameras found: ${cameras.length}\n`;
      debugInfo += `Microphones found: ${microphones.length}\n`;
    } catch (error) {
      debugInfo += `Device enumeration error: ${error}\n`;
    }

    const alert = await this.alertController.create({
      header: 'Debug Information',
      message: debugInfo,
      buttons: [
        {
          text: 'Copy to Clipboard',
          handler: () => {
            navigator.clipboard.writeText(debugInfo);
          }
        },
        {
          text: 'Close'
        }
      ]
    });
    await alert.present();
  }

  async showResetInstructions() {
    const alert = await this.alertController.create({
      header: 'Reset Site Permissions',
      message: `To completely reset permissions for this site:

**Chrome Mobile:**
1. Tap the three dots (⋮) in the browser
2. Go to Settings > Site Settings
3. Find this website and tap it
4. Tap "Clear & Reset"
5. Refresh this page

**Safari Mobile:**
1. Go to Settings > Safari > Privacy & Security
2. Tap "Manage Website Data"
3. Find and delete this website's data
4. Refresh this page

This will clear all cached permissions and allow fresh permission requests.`,
      buttons: [
        {
          text: 'Got It',
          handler: () => {
            // Optionally refresh after user reads instructions
          }
        },
        {
          text: 'Refresh Now',
          handler: () => {
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }

  async skipPermissionCheck() {
    console.log('Skipping permission check and trying to start call directly...');

    const alert = await this.alertController.create({
      header: 'Skip Permission Check',
      message: 'This will try to start the video call directly, bypassing the permission check. Use this if you\'ve already granted permissions but the app isn\'t detecting them.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Try Call',
          handler: async () => {
            try {
              await this.initializeCall();
            } catch (error) {
              console.error('Direct call failed:', error);
              this.showError('Failed to start call. Please ensure camera and microphone permissions are granted in Android Settings.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async rejoinCall() {
    console.log('Manual rejoin call triggered');
    
    const loading = await this.toastController.create({
      message: 'Rejoining call...',
      duration: 3000,
      color: 'primary'
    });
    await loading.present();

    try {
      // Mark as rejoining
      this.hasCallEnded = true;
      
      // Clear any error state
      this.videoCallService.clearError();
      
      // Rejoin the call
      await this.videoCallService.rejoinCall(this.callId, this.isDoctor);
      
      // Set up verification for the rejoin
      this.setupRejoinVideoVerification();
      
      const successToast = await this.toastController.create({
        message: 'Successfully rejoined the call',
        duration: 2000,
        color: 'success'
      });
      await successToast.present();
      
    } catch (error) {
      console.error('Manual rejoin failed:', error);
      
      const errorToast = await this.toastController.create({
        message: 'Failed to rejoin call. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await errorToast.present();
    }
  }

  async fixVideoQuality() {
    console.log('Attempting to fix video quality issues');
    
    const loading = await this.toastController.create({
      message: 'Fixing video quality...',
      duration: 2000,
      color: 'primary'
    });
    await loading.present();

    try {
      // Get current streams
      const currentState = this.videoCallService.getCurrentCallState();
      
      // Reset video elements with better settings
      if (currentState.localStream && this.localVideo) {
        const localEl = this.localVideo.nativeElement;
        
        // Reset video element properties
        localEl.style.imageRendering = 'auto';
        localEl.style.filter = 'none';
        localEl.style.transform = 'scaleX(-1)'; // Mirror for local video
        
        await this.forceSetVideoStream(localEl, currentState.localStream, 'local');
      }
      
      if (currentState.remoteStream && this.remoteVideo) {
        const remoteEl = this.remoteVideo.nativeElement;
        
        // Reset video element properties
        remoteEl.style.imageRendering = 'auto';
        remoteEl.style.filter = 'none';
        remoteEl.style.transform = 'none'; // No mirroring for remote video
        
        await this.forceSetVideoStream(remoteEl, currentState.remoteStream, 'remote');
      }
      
      const successToast = await this.toastController.create({
        message: 'Video quality improved',
        duration: 2000,
        color: 'success'
      });
      await successToast.present();
      
    } catch (error) {
      console.error('Failed to fix video quality:', error);
      
      const errorToast = await this.toastController.create({
        message: 'Could not fix video quality. Try rejoining the call.',
        duration: 3000,
        color: 'warning'
      });
      await errorToast.present();
    }
  }

  async forceRefreshVideo() {
    console.log('Force refreshing video elements...');

    // Clear any pending timeouts
    if (this.localVideoTimeout) {
      clearTimeout(this.localVideoTimeout);
      this.localVideoTimeout = null;
    }
    if (this.remoteVideoTimeout) {
      clearTimeout(this.remoteVideoTimeout);
      this.remoteVideoTimeout = null;
    }

    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get current state
    const currentState = this.videoCallService.getCurrentCallState();
    console.log('Current state for force refresh:', currentState);

    // Show loading indicator during refresh
    const toast = await this.toastController.create({
      message: 'Refreshing video connection...',
      duration: 3000,
      color: 'primary'
    });
    await toast.present();

    try {
      // Force refresh all video elements using the comprehensive method
      await this.forceRefreshAllVideoElements();

      // If we still don't have remote stream but we're in a call, try to renegotiate
      const updatedState = this.videoCallService.getCurrentCallState();
      if (!updatedState.remoteStream && updatedState.isInCall) {
        console.log('No remote stream after refresh, attempting renegotiation...');
        
        // Try to rejoin the call completely
        try {
          await this.videoCallService.rejoinCall(this.callId, this.isDoctor);
          
          // Wait a bit and check again
          setTimeout(async () => {
            const finalState = this.videoCallService.getCurrentCallState();
            if (finalState.remoteStream && this.remoteVideo) {
              console.log('Remote stream restored after rejoin, setting video element');
              await this.forceSetVideoStream(this.remoteVideo.nativeElement, finalState.remoteStream, 'remote');
            }
          }, 2000);
          
        } catch (error) {
          console.error('Rejoin during refresh failed:', error);
          
          // Last resort: try to create new offer
          if (this.isDoctor) {
            try {
              await this.videoCallService.createNewOffer(this.callId);
            } catch (offerError) {
              console.error('New offer creation failed:', offerError);
            }
          }
        }
      }

      // Success message
      setTimeout(async () => {
        const finalState = this.videoCallService.getCurrentCallState();
        if (finalState.remoteStream || finalState.localStream) {
          const successToast = await this.toastController.create({
            message: 'Video connection refreshed successfully',
            duration: 2000,
            color: 'success'
          });
          await successToast.present();
        }
      }, 1500);

    } catch (error) {
      console.error('Force refresh failed:', error);
      
      const errorToast = await this.toastController.create({
        message: 'Failed to refresh video. Try rejoining the call.',
        duration: 3000,
        color: 'warning'
      });
      await errorToast.present();
    }
  }

  async debugVideoElements() {
    console.log('=== Video Elements Debug ===');
    console.log('Local video element:', this.localVideo);
    console.log('Remote video element:', this.remoteVideo);
    console.log('Call state:', this.callState);

    if (this.localVideo) {
      console.log('Local video nativeElement:', this.localVideo.nativeElement);
      console.log('Local video srcObject:', this.localVideo.nativeElement.srcObject);
      console.log('Local video readyState:', this.localVideo.nativeElement.readyState);
      console.log('Local video videoWidth:', this.localVideo.nativeElement.videoWidth);
      console.log('Local video videoHeight:', this.localVideo.nativeElement.videoHeight);
    }

    if (this.remoteVideo) {
      console.log('Remote video nativeElement:', this.remoteVideo.nativeElement);
      console.log('Remote video srcObject:', this.remoteVideo.nativeElement.srcObject);
      console.log('Remote video readyState:', this.remoteVideo.nativeElement.readyState);
      console.log('Remote video videoWidth:', this.remoteVideo.nativeElement.videoWidth);
      console.log('Remote video videoHeight:', this.remoteVideo.nativeElement.videoHeight);
    }

    // Try to manually set streams if they exist
    if (this.callState.localStream && this.localVideo) {
      console.log('Manually setting local stream...');
      this.localVideo.nativeElement.srcObject = this.callState.localStream;
      await this.localVideo.nativeElement.play();
    }

    if (this.callState.remoteStream && this.remoteVideo) {
      console.log('Manually setting remote stream...');
      this.remoteVideo.nativeElement.srcObject = this.callState.remoteStream;
      await this.remoteVideo.nativeElement.play();
    }
  }

  private setupRejoinVideoVerification(): void {
    console.log('Setting up rejoin video verification');
    
    // Check video elements every 3 seconds for the first 30 seconds after rejoin
    let checkCount = 0;
    const maxChecks = 10;
    
    const verificationInterval = setInterval(() => {
      checkCount++;
      console.log(`Rejoin verification check ${checkCount}/${maxChecks}`);
      
      const currentState = this.videoCallService.getCurrentCallState();
      
      // Check if we have streams but video elements are not playing
      if (currentState.localStream && this.localVideo) {
        const localEl = this.localVideo.nativeElement;
        if (localEl.srcObject !== currentState.localStream || localEl.paused) {
          console.log('Local video needs refresh during rejoin verification');
          this.setVideoElementStream(localEl, currentState.localStream, 'local');
        }
      }
      
      if (currentState.remoteStream && this.remoteVideo) {
        const remoteEl = this.remoteVideo.nativeElement;
        if (remoteEl.srcObject !== currentState.remoteStream || remoteEl.paused) {
          console.log('Remote video needs refresh during rejoin verification');
          this.setVideoElementStream(remoteEl, currentState.remoteStream, 'remote');
        }
      }
      
      // Stop checking after max checks or if both streams are working
      if (checkCount >= maxChecks || 
          (currentState.localStream && currentState.remoteStream && 
           this.localVideo && this.remoteVideo &&
           !this.localVideo.nativeElement.paused && !this.remoteVideo.nativeElement.paused)) {
        console.log('Rejoin verification complete');
        clearInterval(verificationInterval);
      }
    }, 3000);
  }

  private async forceRefreshAllVideoElements(): Promise<void> {
    console.log('Force refreshing all video elements for rejoin');
    
    const currentState = this.videoCallService.getCurrentCallState();
    
    // Force refresh both video elements
    const refreshPromises: Promise<void>[] = [];
    
    if (currentState.localStream && this.localVideo) {
      console.log('Force refreshing local video element');
      refreshPromises.push(this.forceSetVideoStream(this.localVideo.nativeElement, currentState.localStream, 'local'));
    }
    
    if (currentState.remoteStream && this.remoteVideo) {
      console.log('Force refreshing remote video element');
      refreshPromises.push(this.forceSetVideoStream(this.remoteVideo.nativeElement, currentState.remoteStream, 'remote'));
    }
    
    try {
      await Promise.all(refreshPromises);
      console.log('All video elements refreshed successfully');
    } catch (error) {
      console.error('Error refreshing video elements:', error);
    }
  }

  private async forceSetVideoStream(videoElement: HTMLVideoElement, stream: MediaStream, type: 'local' | 'remote'): Promise<void> {
    try {
      console.log(`Force setting ${type} video stream`);
      
      // Completely reset the video element
      videoElement.pause();
      videoElement.srcObject = null;
      videoElement.load();
      
      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Set the stream
      videoElement.srcObject = stream;
      
      // Remove any existing event listeners
      videoElement.onloadedmetadata = null;
      videoElement.oncanplay = null;
      videoElement.onplay = null;
      
      // Set up fresh event listeners
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        const cleanup = () => {
          videoElement.onloadedmetadata = null;
          videoElement.oncanplay = null;
          videoElement.onerror = null;
        };
        
        const tryPlay = async () => {
          try {
            await videoElement.play();
            console.log(`${type} video playing after force refresh`);
            if (!resolved) {
              resolved = true;
              cleanup();
              resolve();
            }
          } catch (error) {
            console.error(`Error playing ${type} video after force refresh:`, error);
            if (!resolved) {
              resolved = true;
              cleanup();
              reject(error);
            }
          }
        };
        
        videoElement.onloadedmetadata = () => {
          console.log(`${type} video metadata loaded - attempting play`);
          tryPlay();
        };
        
        videoElement.oncanplay = () => {
          console.log(`${type} video can play - attempting play`);
          tryPlay();
        };
        
        videoElement.onerror = (error) => {
          console.error(`${type} video error:`, error);
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(error);
          }
        };
        
        // Force load and try to play immediately
        videoElement.load();
        
        // Fallback timeout
        setTimeout(() => {
          if (!resolved) {
            console.log(`${type} video force play timeout - trying anyway`);
            tryPlay();
          }
        }, 1000);
      });
      
    } catch (error) {
      console.error(`Error force setting ${type} video stream:`, error);
      throw error;
    }
  }

  private startCallDurationTracking(): void {
    this.callStartTime = new Date();
    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        const now = new Date();
        const diff = now.getTime() - this.callStartTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        this.callDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private stopCallDurationTracking(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.callStartTime = null;
    this.callDuration = '';
  }

  private startQualityMonitoring(): void {
    this.qualityCheckInterval = setInterval(async () => {
      await this.checkConnectionQuality();
    }, 3000);
  }

  private async checkConnectionQuality(): Promise<void> {
    try {
      // This is a simplified quality check - in a real app you'd get actual WebRTC stats
      const currentState = this.videoCallService.getCurrentCallState();
      
      if (!currentState.isInCall) {
        this.connectionQualityIcon = 'wifi-outline';
        this.connectionQualityColor = 'medium';
        this.connectionQualityText = 'Disconnected';
        return;
      }

      // Check if both streams are active
      const hasLocalStream = !!currentState.localStream;
      const hasRemoteStream = !!currentState.remoteStream;
      
      if (hasLocalStream && hasRemoteStream) {
        // Check video elements are playing
        const localPlaying = this.localVideo && !this.localVideo.nativeElement.paused;
        const remotePlaying = this.remoteVideo && !this.remoteVideo.nativeElement.paused;
        
        if (localPlaying && remotePlaying) {
          this.connectionQualityIcon = 'wifi';
          this.connectionQualityColor = 'success';
          this.connectionQualityText = 'Excellent';
        } else {
          this.connectionQualityIcon = 'wifi';
          this.connectionQualityColor = 'warning';
          this.connectionQualityText = 'Good';
        }
      } else if (hasLocalStream || hasRemoteStream) {
        this.connectionQualityIcon = 'wifi-outline';
        this.connectionQualityColor = 'warning';
        this.connectionQualityText = 'Poor';
      } else {
        this.connectionQualityIcon = 'wifi-outline';
        this.connectionQualityColor = 'danger';
        this.connectionQualityText = 'Bad';
      }
    } catch (error) {
      console.error('Error checking connection quality:', error);
      this.connectionQualityIcon = 'wifi-outline';
      this.connectionQualityColor = 'medium';
      this.connectionQualityText = 'Unknown';
    }
  }

  async optimizeForNetwork() {
    console.log('Optimizing for network conditions');
    
    const loading = await this.toastController.create({
      message: 'Optimizing for your network...',
      duration: 2000,
      color: 'primary'
    });
    await loading.present();

    try {
      // Get current network information if available
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      let networkType = 'unknown';
      let effectiveType = '4g';
      
      if (connection) {
        networkType = connection.type || 'unknown';
        effectiveType = connection.effectiveType || '4g';
        console.log('Network info:', { type: networkType, effectiveType });
      }

      // Optimize based on network conditions
      const currentState = this.videoCallService.getCurrentCallState();
      
      if (currentState.localStream) {
        const videoTrack = currentState.localStream.getVideoTracks()[0];
        if (videoTrack) {
          // Apply constraints based on network
          const constraints = this.getOptimizedConstraints(effectiveType);
          await videoTrack.applyConstraints(constraints);
          console.log('Applied optimized constraints:', constraints);
        }
      }

      // Show success message
      const successToast = await this.toastController.create({
        message: `Optimized for ${effectiveType} network`,
        duration: 2000,
        color: 'success'
      });
      await successToast.present();

    } catch (error) {
      console.error('Network optimization failed:', error);
      
      const errorToast = await this.toastController.create({
        message: 'Could not optimize network settings',
        duration: 2000,
        color: 'warning'
      });
      await errorToast.present();
    }
  }

  private getOptimizedConstraints(networkType: string): MediaTrackConstraints {
    switch (networkType) {
      case 'slow-2g':
      case '2g':
        return {
          width: { ideal: 320, max: 480 },
          height: { ideal: 240, max: 360 },
          frameRate: { ideal: 10, max: 15 }
        };
      
      case '3g':
        return {
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 20 }
        };
      
      case '4g':
      default:
        return {
          width: { ideal: 640, max: 854 },
          height: { ideal: 480, max: 640 },
          frameRate: { ideal: 20, max: 25 }
        };
    }
  }
}