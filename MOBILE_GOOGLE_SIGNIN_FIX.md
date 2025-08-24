# Mobile Google Sign-In Fix

## Problem
The error "Unable to process request due to missing initial state" occurs when using `signInWithPopup` on mobile devices. This happens because mobile browsers don't support popups the same way desktop browsers do.

## Solution
Your app already has the correct setup with platform-aware Google Sign-In! You just need to configure the actual Google Client ID.

## Steps to Fix

### 1. Get Your Google Web Client ID
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Copy the **Web client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### 2. Update Configuration Files

**File: `capacitor.config.ts`**
Replace `YOUR_ACTUAL_WEB_CLIENT_ID` with your actual web client ID:
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: '123456789-abcdefg.apps.googleusercontent.com', // Your actual web client ID
  forceCodeForRefreshToken: true
}
```

**File: `src/app/services/google-auth.service.ts`**
Replace `YOUR_ACTUAL_WEB_CLIENT_ID` with your actual web client ID:
```typescript
await GoogleAuth.initialize({
  clientId: '123456789-abcdefg.apps.googleusercontent.com', // Your actual web client ID
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
- **Important**: Native Google Sign-In only works on physical devices or emulators with Google Play Services
- Web version will work in browser during development

## How It Works

Your app already has the correct implementation:

1. **Web/Browser**: Uses Firebase Auth `signInWithPopup`
2. **Mobile/Capacitor**: Uses native Google Sign-In plugin via `@codetrix-studio/capacitor-google-auth`
3. **Platform Detection**: `GoogleAuthService` automatically detects platform and uses appropriate method
4. **Unified Interface**: Same API for both platforms

## Verification

After updating the client IDs:

1. Test in browser - should work with popup
2. Build and test on Android device - should use native Google Sign-In
3. Check console logs for "Using native Google Sign-In for mobile" or "Using web Google Sign-In for browser"

## Troubleshooting

### Still getting "missing initial state" error?
- Make sure you replaced BOTH client ID placeholders
- Ensure you're testing on a physical device for mobile
- Check that google-services.json is in android/app/ directory

### "Developer Error" on mobile?
- Verify SHA-1 fingerprint is added to Firebase Console
- Make sure you're using Web Client ID (not Android Client ID)
- Ensure google-services.json matches your Firebase project

### Sign-in works in browser but not mobile?
- This is expected during development
- Native Google Sign-In requires physical device or emulator with Google Play Services
- Build and install APK on device to test properly

## Current Status
✅ Platform detection implemented
✅ Native Google Auth plugin installed
✅ Unified GoogleAuthService created
✅ AuthService updated to use GoogleAuthService
✅ google-services.json configured
⚠️ Need to replace placeholder client IDs with actual values