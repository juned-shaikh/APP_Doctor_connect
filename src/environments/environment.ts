// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    // Add your Firebase configuration here
    apiKey: "AIzaSyDj0H_g8tSM2QuXhLqSdJFNKuoseLAPbJM",
    authDomain: "doctorconnect-f0aa0.firebaseapp.com",
    projectId: "doctorconnect-f0aa0",
    storageBucket: "doctorconnect-f0aa0.firebasestorage.app",
    messagingSenderId: "1041888734011",
    appId: "1:1041888734011:web:6b79cc7f8918327cce251e",
    measurementId: "G-6T7XKPM016",
    vapidKey: "BHvw2_FPHr7iNTsFk1KdmUI7o-ycC--HsFHSMKeQrALKT28JTBVdaTlW6ADCppkAuKqKAU9v1PtprmxxQFAvH34" // Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
