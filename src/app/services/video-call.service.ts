import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private firebaseService: FirebaseService) {}

  async initializeCall(callId: string, isInitiator: boolean = false): Promise<void> {
    try {
      this.updateCallState({ isConnecting: true, callId });
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.configuration);
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        this.updateCallState({ remoteStream });
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.firebaseService.addIceCandidate(callId, event.candidate);
        }
      };

      // Listen for remote ICE candidates
      this.firebaseService.getIceCandidates(callId).subscribe(candidates => {
        candidates.forEach(candidate => {
          if (this.peerConnection) {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });
      });

      if (isInitiator) {
        await this.createOffer(callId);
      } else {
        await this.listenForOffer(callId);
      }

      this.updateCallState({ 
        isInCall: true, 
        isConnecting: false, 
        localStream: this.localStream 
      });

    } catch (error) {
      console.error('Error initializing call:', error);
      this.updateCallState({ 
        error: 'Failed to initialize video call', 
        isConnecting: false 
      });
    }
  }

  private async createOffer(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    await this.firebaseService.setCallOffer(callId, offer);
    await this.listenForAnswer(callId);
  }

  private async listenForOffer(callId: string): Promise<void> {
    this.firebaseService.getCallOffer(callId).subscribe(async (offer) => {
      if (offer && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        await this.createAnswer(callId);
      }
    });
  }

  private async createAnswer(callId: string): Promise<void> {
    if (!this.peerConnection) return;

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    await this.firebaseService.setCallAnswer(callId, answer);
  }

  private async listenForAnswer(callId: string): Promise<void> {
    this.firebaseService.getCallAnswer(callId).subscribe(async (answer) => {
      if (answer && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
  }

  async endCall(): Promise<void> {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

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
}