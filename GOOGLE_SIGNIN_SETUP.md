# Google Sign-In Setup Instructions

## Prerequisites
1. Firebase project with Google Sign-In enabled
2. Android app registered in Firebase Console
3. `google-services.json` file in `android/app/` directory

## Configuration Steps

### 1. Get Your Web Client ID
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Authentication > Sign-in method
4. Click on Google provider
5. Copy the "Web client ID" (not the Android client ID)

### 2. Update Capacitor Configuration
Replace `YOUR_WEB_CLIENT_ID_HERE` in the following files with your actual web client ID:

**File: `capacitor.config.ts`**
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
  forceCodeForRefreshToken: true
}
```

**File: `src/app/services/google-auth.service.ts`**
```typescript
await GoogleAuth.initialize({
  clientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});
```

### 3. Build and Sync
```bash
npm run build
npx cap sync android
```

### 4. Test on Device
- The native Google Sign-In will only work on a physical device or emulator with Google Play Services
- Web version will work in browser during development

## Troubleshooting

### Error: "Unable to process request due to missing initial state"
This error occurs when using web-based `signInWithPopup` on mobile. The solution implemented uses native Google Sign-In for mobile devices.

### Error: "Developer Error"
- Check that your SHA-1 fingerprint is added to Firebase Console
- Ensure you're using the correct Web Client ID (not Android Client ID)
- Make sure `google-services.json` is in the correct location

### Error: "Sign-in cancelled"
- User cancelled the sign-in process
- This is normal behavior and should be handled gracefully

## How It Works

1. **Web/Browser**: Uses Firebase Auth `signInWithPopup`
2. **Mobile/Capacitor**: Uses native Google Sign-In plugin
3. **Platform Detection**: Automatically detects platform and uses appropriate method
4. **Unified Interface**: Same API for both platforms

The `GoogleAuthService` handles platform detection and provides a unified interface for Google authentication across web and mobile platforms.