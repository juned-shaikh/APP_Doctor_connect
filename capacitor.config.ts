import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Js.DoctorConnect',
  appName: 'Doctor Connect',
  webDir: 'www',
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#28a745',
      overlaysWebView: false
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#28a745',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1041888734011-tivpcn8efo5723ks6q6vs1rh8e87teh2.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;