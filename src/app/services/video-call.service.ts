import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';

export interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  callId?: string;
  participantName?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private callStateSubject = new BehaviorSubject<CallState>({ isInCall: false, isConnecting: false });

  public callState$ = this.callStateSubject.asObservable();

  private getConfiguration(isMobile: boolean = false): RTCConfiguration {
    const baseConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
      ],
      iceCandidatePoolSize: isMobile ? 5 : 10,
      bundlePolicy: 'max-bundle' as RTCBundlePolicy,
      rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
    };

    // Mobile-specific optimizations
    if (isMobile) {
      return {
        ...baseConfig,
        iceTransportPolicy: 'all' as RTCIceTransportPolicy,
        // Add more aggressive ICE gathering for mobile
        iceCandidatePoolSize: 3
      };
    }

    return baseConfig;
  }

  constructor(private firebaseService: FirebaseService) { }



  async initializeCall(callId: string, isInitiator: boolean = false): Promise<void> {
    try {
      console.log('Initializing call:', callId, 'isInitiator:', isInitiator);

      // Check if we're rejoining an existing call
      const currentState = this.callStateSubject.value;
      const isRejoining = currentState.callId === callId && !currentState.isInCall;

      console.log('Is rejoining call:', isRejoining);

      // Clean up any existing connection first
      if (this.peerConnection || this.localStream) {
        console.log('Cleaning up existing connection before rejoining');
        await this.cleanupConnection();
      }

      this.updateCallState({ isConnecting: true, callId });

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support video calls. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      // Check mobile browser compatibility
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
      console.log('Is mobile device:', isMobile, 'User agent:', userAgent);

      if (isMobile) {
        console.log('Mobile browser detected:', userAgent);

        // Check for known problematic browsers
        if (userAgent.includes('facebook') || userAgent.includes('instagram') || userAgent.includes('twitter')) {
          throw new Error('Video calls may not work in social media app browsers. Please open this link in Chrome, Safari, or your default browser.');
        }

        if (userAgent.includes('wechat')) {
          throw new Error('Video calls are not supported in WeChat browser. Please open this link in Chrome or Safari.');
        }
      }

      // Check if running on HTTPS (required for mobile)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Video calls require a secure connection (HTTPS). Please access the app via HTTPS.');
      }

      // Get user media with mobile-optimized constraints
      try {
        const constraints = isMobile ? {
          video: {
            width: { ideal: 480, max: 640 },
            height: { ideal: 640, max: 480 },
            frameRate: { ideal: 15, max: 24 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        } : {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 15, max: 30 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };

        console.log('Requesting media with constraints:', constraints);
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got local stream:', this.localStream);
        console.log('Local stream tracks:', this.localStream.getTracks());
        console.log('Local stream active:', this.localStream.active);
      } catch (mediaError: any) {
        console.error('Media access error:', mediaError);
        console.error('Error name:', mediaError.name);
        console.error('Error message:', mediaError.message);

        // Try with more basic constraints if the above fails
        try {
          console.log('Trying with basic constraints...');
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: isMobile ? { facingMode: 'user' } : true,
            audio: true
          });
          console.log('Got local stream with basic constraints');
        } catch (basicError: any) {
          console.error('Basic media access failed:', basicError);
          console.error('Basic error name:', basicError.name);
          console.error('Basic error message:', basicError.message);

          // Try audio-only as last resort
          try {
            console.log('Trying audio-only...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true
            });
            console.log('Got audio-only stream');
          } catch (audioError: any) {
            console.error('Audio-only failed:', audioError);

            // Provide specific error messages based on the error
            if (basicError.name === 'NotAllowedError' || basicError.name === 'PermissionDeniedError') {
              throw new Error('PERMISSION_DENIED');
            } else if (basicError.name === 'NotFoundError' || basicError.name === 'DevicesNotFoundError') {
              throw new Error('No camera or microphone found. Please check your device.');
            } else if (basicError.name === 'NotReadableError' || basicError.name === 'TrackStartError') {
              throw new Error('Camera or microphone is already in use by another application.');
            } else if (basicError.name === 'OverconstrainedError' || basicError.name === 'ConstraintNotSatisfiedError') {
              throw new Error('Camera or microphone constraints not supported by your device.');
            } else if (basicError.name === 'SecurityError') {
              throw new Error('Security error: Please ensure you are using HTTPS and have granted permissions.');
            } else {
              throw new Error('Failed to access camera and microphone: ' + basicError.message + ' (Error: ' + basicError.name + ')');
            }
          }
        }
      }

      // Create peer connection with mobile-optimized config
      const config = this.getConfiguration(isMobile);
      console.log('Creating peer connection with config:', config);
      this.peerConnection = new RTCPeerConnection(config);
      console.log('Created peer connection for mobile:', isMobile);

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Setup peer connection event handlers
      this.setupPeerConnectionHandlers(callId);

      // Mobile-specific logging for remote stream handling
      if (isMobile) {
        const originalOnTrack = this.peerConnection.ontrack;
        this.peerConnection.ontrack = (event) => {
          console.log('Mobile: Received remote stream:', event.streams[0]);
          console.log('Mobile: Remote stream tracks:', event.streams[0].getTracks());
          const remoteStream = event.streams[0];

          // Ensure the stream has active tracks
          const activeTracks = remoteStream.getTracks().filter(track => track.readyState === 'live');
          console.log('Mobile: Active remote tracks:', activeTracks);

          // Mobile-specific: ensure tracks are enabled
          remoteStream.getTracks().forEach(track => {
            console.log(`Mobile: Remote track ${track.kind} enabled:`, track.enabled, 'ready state:', track.readyState);
          });

          // Call the original handler
          if (originalOnTrack && this.peerConnection) {
            originalOnTrack.call(this.peerConnection, event);
          }
        };
      }

      // Store ICE candidates that arrive before remote description is set
      const pendingCandidates: RTCIceCandidateInit[] = [];

      // Listen for remote ICE candidates
      this.firebaseService.getIceCandidates(callId).subscribe(newCandidates => {
        console.log('Received new ICE candidates:', newCandidates);
        newCandidates.forEach(async (candidate) => {
          if (this.peerConnection) {
            try {
              if (this.peerConnection.remoteDescription) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('Added ICE candidate');
              } else {
                // Store for later if remote description not ready
                pendingCandidates.push(candidate);
                console.log('Stored ICE candidate for later');
              }
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
        });
      });

      // Function to add pending candidates after remote description is set
      const addPendingCandidates = async () => {
        for (const candidate of pendingCandidates) {
          try {
            if (this.peerConnection) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('Added pending ICE candidate');
            }
          } catch (error) {
            console.error('Error adding pending ICE candidate:', error);
          }
        }
        pendingCandidates.length = 0; // Clear the array
      };

      if (isInitiator) {
        console.log('Creating offer as initiator');
        this.listenForAnswer(callId, addPendingCandidates);

        // Clear any existing offer/answer before creating new one
        try {
          await this.firebaseService.endCall(callId);
          console.log('Cleared existing call data');
          // Wait a moment for the clear to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log('No existing call data to clear or error clearing:', error);
        }

        // Create offer immediately
        await this.createOffer(callId);
      } else {
        console.log('Listening for offer as joiner');
        this.listenForOffer(callId, addPendingCandidates);
      }

      this.updateCallState({
        isInCall: true,
        localStream: this.localStream
      });

    } catch (error) {
      console.error('Error initializing call:', error);

      // Don't set error state for permission issues - let the component handle it
      if ((error as any).message === 'PERMISSION_DENIED') {
        this.updateCallState({ isConnecting: false });
        throw error; // Re-throw so component can handle it
      } else {
        this.updateCallState({
          error: 'Failed to initialize video call: ' + (error as any).message,
          isConnecting: false
        });
      }
    }
  }

  private async createOffer(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('Created and set local offer:', offer);

      await this.firebaseService.setCallOffer(callId, offer);
      console.log('Sent offer to Firebase');

      this.listenForAnswer(callId);
    } catch (error) {
      console.error('Error creating offer:', error);
      if (error instanceof Error && error.message.includes('permissions')) {
        this.updateCallState({
          error: 'Video call setup failed. Please ensure Firestore permissions are configured correctly.',
          isConnecting: false
        });
      } else {
        this.updateCallState({
          error: 'Failed to create video call offer',
          isConnecting: false
        });
      }
    }
  }

  private listenForOffer(callId: string, addPendingCandidates?: () => Promise<void>): void {
    this.firebaseService.getCallOffer(callId).subscribe(async (offer) => {
      console.log('Received offer:', offer);
      if (offer && this.peerConnection) {
        try {
          // Check peer connection state before proceeding
          console.log('Peer connection state:', this.peerConnection.signalingState);

          // Check if we already have a remote description or if we're in stable state
          if (this.peerConnection.remoteDescription) {
            console.log('Already have remote description, skipping offer');
            return;
          }

          // Only proceed if we're in the right state to receive an offer
          if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
            console.log('Peer connection not in correct state for offer, current state:', this.peerConnection.signalingState);
            return;
          }

          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          console.log('Set remote description from offer');

          // Add any pending ICE candidates
          if (addPendingCandidates) {
            await addPendingCandidates();
          }

          await this.createAnswer(callId);
        } catch (error) {
          console.error('Error handling offer:', error);
          // If setting remote description fails, try to recover
          if (error instanceof Error && error.message.includes('InvalidStateError')) {
            console.log('Peer connection in invalid state, attempting to recover');
            await this.recoverPeerConnection(callId, false);
          }
        }
      }
    });
  }

  private async createAnswer(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('Created and set local answer:', answer);

      await this.firebaseService.setCallAnswer(callId, answer);
      console.log('Sent answer to Firebase');
    } catch (error) {
      console.error('Error creating answer:', error);
      if (error instanceof Error && error.message.includes('permissions')) {
        this.updateCallState({
          error: 'Video call setup failed. Please ensure Firestore permissions are configured correctly.',
          isConnecting: false
        });
      } else {
        this.updateCallState({
          error: 'Failed to create video call answer',
          isConnecting: false
        });
      }
    }
  }

  private listenForAnswer(callId: string, addPendingCandidates?: () => Promise<void>): void {
    this.firebaseService.getCallAnswer(callId).subscribe(async (answer) => {
      console.log('Received answer:', answer);
      if (answer && this.peerConnection) {
        try {
          // Check peer connection state before proceeding
          console.log('Peer connection state:', this.peerConnection.signalingState);

          // Check if we already have a remote description or if we're in stable state
          if (this.peerConnection.remoteDescription) {
            console.log('Already have remote description, skipping answer');
            return;
          }

          // Only proceed if we're in the right state to receive an answer
          if (this.peerConnection.signalingState !== 'have-local-offer') {
            console.log('Peer connection not in correct state for answer, current state:', this.peerConnection.signalingState);
            return;
          }

          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('Set remote description from answer');

          // Add any pending ICE candidates
          if (addPendingCandidates) {
            await addPendingCandidates();
          }
        } catch (error) {
          console.error('Error handling answer:', error);
          // If setting remote description fails, try to recover
          if (error instanceof Error && error.message.includes('InvalidStateError')) {
            console.log('Peer connection in invalid state, attempting to recover');
            await this.recoverPeerConnection(callId, true);
          }
        }
      }
    });
  }

  private async recoverPeerConnection(callId: string, isInitiator: boolean): Promise<void> {
    console.log('Attempting to recover peer connection...');

    try {
      // Close the current peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reinitialize the peer connection
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
      const config = this.getConfiguration(isMobile);
      this.peerConnection = new RTCPeerConnection(config);

      // Re-add local stream if available
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      // Re-setup event handlers
      this.setupPeerConnectionHandlers(callId);

      // Clear Firebase call data and restart negotiation
      await this.firebaseService.endCall(callId);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isInitiator) {
        await this.createOffer(callId);
      } else {
        this.listenForOffer(callId);
      }

      console.log('Peer connection recovery completed');
    } catch (error) {
      console.error('Failed to recover peer connection:', error);
      this.updateCallState({
        error: 'Connection failed. Please try refreshing the page.',
        isConnecting: false
      });
    }
  }

  private setupPeerConnectionHandlers(callId: string): void {
    if (!this.peerConnection) return;

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      const remoteStream = event.streams[0];
      this.updateCallState({ remoteStream, isConnecting: false });
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        this.firebaseService.addIceCandidate(callId, event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'connected') {
        this.updateCallState({ isConnecting: false });
      } else if (this.peerConnection?.connectionState === 'failed') {
        console.error('Peer connection failed');
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', this.peerConnection?.iceConnectionState);
    };
  }

  private async cleanupConnection(): Promise<void> {
    console.log('Cleaning up existing connection');

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      console.log('Closing peer connection');
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  async endCall(): Promise<void> {
    await this.cleanupConnection();

    // Clean up call state
    const callId = this.callStateSubject.value.callId;
    if (callId) {
      await this.firebaseService.endCall(callId);
    }

    this.updateCallState({
      isInCall: false,
      isConnecting: false,
      localStream: undefined,
      remoteStream: undefined,
      callId: undefined,
      participantName: undefined,
      error: undefined
    });
  }

  async toggleVideo(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  async toggleAudio(): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  private updateCallState(updates: Partial<CallState>): void {
    const currentState = this.callStateSubject.value;
    this.callStateSubject.next({ ...currentState, ...updates });
  }

  getCurrentCallState(): CallState {
    return this.callStateSubject.value;
  }

  clearError(): void {
    const currentState = this.callStateSubject.value;
    if (currentState.error) {
      this.updateCallState({ error: undefined });
    }
  }

  // Method specifically for rejoining calls
  async rejoinCall(callId: string, isInitiator: boolean = false): Promise<void> {
    console.log('Rejoining call:', callId);

    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    console.log('Rejoining on mobile:', isMobile);

    // Force cleanup of any existing state
    await this.cleanupConnection();

    // Clear any error state
    this.clearError();

    // Mobile devices need longer cleanup time
    const cleanupDelay = isMobile ? 2000 : 1000;
    console.log('Waiting for cleanup to complete:', cleanupDelay + 'ms');
    await new Promise(resolve => setTimeout(resolve, cleanupDelay));

    // For mobile rejoining, we need to ensure Firebase call data is completely cleared
    if (isMobile) {
      console.log('Mobile rejoin: clearing Firebase call data');
      try {
        await this.firebaseService.endCall(callId);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log('Error clearing Firebase data:', error);
      }
    }

    // Initialize the call fresh
    try {
      await this.initializeCall(callId, isInitiator);

      // For mobile, add additional verification after initialization
      if (isMobile) {
        setTimeout(() => {
          this.verifyMobileConnection(callId, isInitiator);
        }, 5000);
      }
    } catch (error) {
      console.error('Error during rejoin initialization:', error);

      // Mobile fallback: try one more time with different approach
      if (isMobile) {
        console.log('Mobile rejoin failed, trying fallback approach');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.mobileRejoinFallback(callId, isInitiator);
      } else {
        throw error;
      }
    }
  }

  private async verifyMobileConnection(callId: string, isInitiator: boolean): Promise<void> {
    console.log('Verifying mobile connection...');

    const currentState = this.getCurrentCallState();
    const hasLocalStream = !!currentState.localStream;
    const hasRemoteStream = !!currentState.remoteStream;

    console.log('Mobile connection check - Local:', hasLocalStream, 'Remote:', hasRemoteStream);

    // If we don't have remote stream after 5 seconds on mobile, try to renegotiate
    if (hasLocalStream && !hasRemoteStream && this.peerConnection) {
      console.log('Mobile: Missing remote stream, attempting renegotiation');

      if (isInitiator) {
        try {
          await this.createOffer(callId);
        } catch (error) {
          console.error('Mobile renegotiation failed:', error);
        }
      }
    }
  }

  private async mobileRejoinFallback(callId: string, isInitiator: boolean): Promise<void> {
    console.log('Attempting mobile rejoin fallback');

    // Complete reset for mobile
    await this.cleanupConnection();
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try with more conservative settings
    await this.initializeCall(callId, isInitiator);
  }

  async testMediaDevices(): Promise<{ hasCamera: boolean; hasMicrophone: boolean; devices: MediaDeviceInfo[] }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');

      console.log('Available media devices:', devices);
      console.log('Has camera:', hasCamera);
      console.log('Has microphone:', hasMicrophone);

      return { hasCamera, hasMicrophone, devices };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return { hasCamera: false, hasMicrophone: false, devices: [] };
    }
  }

  // Method to pause call without ending it (for navigation)
  pauseCall(): void {
    // Stop local stream tracks but don't close peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Update state to show call is paused
    this.updateCallState({
      localStream: undefined,
      isConnecting: false
    });
  }

  // Method to resume call
  async resumeCall(): Promise<void> {
    try {
      // Get user media again
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Add tracks back to peer connection if it exists
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      this.updateCallState({ localStream: this.localStream });
    } catch (error) {
      console.error('Error resuming call:', error);
      this.updateCallState({ error: 'Failed to resume video call' });
    }
  }
}