import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Device } from '@capacitor/device';

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  hasPermissions: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AndroidPermissionsService {

  constructor() { }

  async isNativeApp(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  async getPlatformInfo() {
    if (Capacitor.isNativePlatform()) {
      return await Device.getInfo();
    }
    return null;
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      // For web, use the existing web API approach
      return this.checkWebPermissions();
    }

    try {
      console.log('Checking native Android permissions...');

      // For native Android, we need to test actual media access
      // The Camera plugin permissions might not reflect getUserMedia permissions
      let hasCamera = false;
      let hasMicrophone = false;

      try {
        // Test camera access directly
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        hasCamera = true;
        videoStream.getTracks().forEach(track => track.stop());
        console.log('Camera permission: granted');
      } catch (error) {
        console.log('Camera permission: denied or not available', error);
        hasCamera = false;
      }

      try {
        // Test microphone access directly
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        hasMicrophone = true;
        audioStream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission: granted');
      } catch (error) {
        console.log('Microphone permission: denied or not available', error);
        hasMicrophone = false;
      }

      const result = {
        camera: hasCamera,
        microphone: hasMicrophone,
        hasPermissions: hasCamera && hasMicrophone
      };

      console.log('Permission check result:', result);
      return result;

    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        camera: false,
        microphone: false,
        hasPermissions: false
      };
    }
  }

  async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      // For web, use the existing web API approach
      return this.requestWebPermissions();
    }

    try {
      console.log('Requesting native Android permissions...');

      // For native Android, directly request media access
      // This will trigger the native Android permission dialogs
      let hasCamera = false;
      let hasMicrophone = false;

      try {
        // Request both camera and microphone together
        console.log('Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true
        });

        // Check what we actually got
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        hasCamera = videoTracks.length > 0;
        hasMicrophone = audioTracks.length > 0;

        console.log('Media stream obtained:', {
          videoTracks: videoTracks.length,
          audioTracks: audioTracks.length
        });

        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());

      } catch (error: any) {
        console.error('Media access request failed:', error);

        // Try to get more specific information about what failed
        if (error.name === 'NotAllowedError') {
          console.log('User denied permissions');
        } else if (error.name === 'NotFoundError') {
          console.log('No camera/microphone found');
        } else if (error.name === 'SecurityError') {
          console.log('Security error - HTTPS required');
        }

        throw error;
      }

      const result = {
        camera: hasCamera,
        microphone: hasMicrophone,
        hasPermissions: hasCamera && hasMicrophone
      };

      console.log('Permission request result:', result);
      return result;

    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  private async checkWebPermissions(): Promise<PermissionStatus> {
    if (!navigator.permissions) {
      return { camera: false, microphone: false, hasPermissions: false };
    }

    try {
      const [cameraPermission, microphonePermission] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName })
      ]);

      const hasCamera = cameraPermission.state === 'granted';
      const hasMicrophone = microphonePermission.state === 'granted';

      return {
        camera: hasCamera,
        microphone: hasMicrophone,
        hasPermissions: hasCamera && hasMicrophone
      };
    } catch (error) {
      return { camera: false, microphone: false, hasPermissions: false };
    }
  }

  private async requestWebPermissions(): Promise<PermissionStatus> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());

      return {
        camera: true,
        microphone: true,
        hasPermissions: true
      };
    } catch (error) {
      throw error;
    }
  }

  async openAppSettings(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // For web, show instructions
      throw new Error('WEB_PLATFORM');
    }

    try {
      // For Android, we'll use a different approach
      // Try to open app settings using Android intent
      if (Capacitor.getPlatform() === 'android') {
        // Use window.open with Android settings intent
        const packageName = 'com.Js.DoctorConnect'; // Your app package name
        const settingsUrl = `android-app://com.android.settings/.application.AppInfoSettings?package=${packageName}`;

        // Try to open settings
        window.open(settingsUrl, '_system');

        // If that doesn't work, try alternative method
        setTimeout(() => {
          window.open('app-settings:', '_system');
        }, 1000);
      }

    } catch (error) {
      console.log('Could not open app settings programmatically:', error);
      // Fallback to manual instructions
      throw new Error('MANUAL_SETTINGS_REQUIRED');
    }
  }

  async showNativePermissionDialog(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // Request permissions step by step
      console.log('Requesting camera permission...');
      const cameraResult = await Camera.requestPermissions();

      if (cameraResult.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }

      // Test microphone access
      console.log('Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Native permission dialog failed:', error);
      return false;
    }
  }
}