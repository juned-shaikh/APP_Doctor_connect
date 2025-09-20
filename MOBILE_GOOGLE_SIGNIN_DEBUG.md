# Mobile Google Sign-In Debug Guide

## Current Issue
Getting "Google signin failed: Something went wrong" on mobile device.

## Debug Steps

### 1. Check Device Logs
Connect your device and run:
```bash
# For Android
adb logcat | grep -i google

# Or filter for your app specifically
adb logcat | grep -i "DoctorConnect"
```

### 2. Common Issues & Solutions

#### Issue A: SHA-1 Fingerprint Missing
**Symptoms**: "DEVELOPER_ERROR" or "Something went wrong"
**Solution**: Add SHA-1 fingerprint to Firebase Console

Get your SHA-1:
```bash
# Debug keystore (for development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Or using Gradle
cd android
./gradlew signingReport
```

Add the SHA-1 to Firebase Console:
1. Go to Firebase Console → Project Settings
2. Select your Android app
3. Add the SHA-1 fingerprint
4. Download new google-services.json
5. Replace the file in android/app/

#### Issue B: Google Play Services Missing
**Symptoms**: "Google Play Services not available"
**Solution**: Test on physical device with Google Play Services installed

#### Issue C: Client ID Mismatch
**Symptoms**: "Invalid client ID" or authentication errors
**Solution**: Verify client IDs match between:
- capacitor.config.ts
- google-services.json
- Firebase Console

#### Issue D: Package Name Mismatch
**Symptoms**: "Package name mismatch"
**Solution**: Ensure package names match:
- capacitor.config.ts: `appId: 'com.Js.DoctorConnect'`
- android/app/build.gradle: `applicationId "com.Js.DoctorConnect"`
- google-services.json: `package_name: "com.Js.DoctorConnect"`

### 3. Enhanced Error Logging

Add this to your GoogleAuthService for better debugging:

```typescript
async signInWithFirebase(): Promise<any> {
  try {
    console.log('🔍 Debug Info:');
    console.log('Platform:', this.platform.platforms());
    console.log('Is Capacitor:', this.platform.is('capacitor'));
    console.log('Is Android:', this.platform.is('android'));
    console.log('Is iOS:', this.platform.is('ios'));
    
    if (this.platform.is('capacitor')) {
      console.log('📱 Starting mobile Google Sign-In...');
      
      // Check if Google Auth is available
      const isAvailable = await GoogleAuth.isAvailable();
      console.log('Google Auth available:', isAvailable);
      
      const result = await GoogleAuth.signIn();
      console.log('✅ Google Auth successful:', {
        id: result.id,
        email: result.email,
        name: result.name,
        hasIdToken: !!result.authentication?.idToken,
        hasAccessToken: !!result.authentication?.accessToken
      });
      
      // Rest of your code...
    }
  } catch (error: any) {
    console.error('❌ Detailed Error Info:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      platform: this.platform.platforms(),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
```

### 4. Test Checklist

- [ ] Physical Android device (not emulator)
- [ ] Google Play Services installed and updated
- [ ] Correct SHA-1 fingerprint in Firebase Console
- [ ] Package names match across all config files
- [ ] Latest google-services.json downloaded
- [ ] App built and synced after config changes
- [ ] Internet connection available
- [ ] Google account signed in on device

### 5. Alternative Testing Method

If native Google Sign-In continues to fail, you can temporarily test with web-based sign-in on mobile:

```typescript
// In GoogleAuthService.signInWithFirebase()
// Force web sign-in for testing
if (false) { // Change to 'if (this.platform.is('capacitor'))' to re-enable native
```

This will use the web popup method even on mobile, which can help isolate if the issue is with native integration or Firebase configuration.

### 6. Build and Test Commands

```bash
# Clean and rebuild
npm run build
npx cap clean android
npx cap sync android
npx cap open android

# In Android Studio, clean and rebuild project
# Then install on physical device
```

## Next Steps

1. Run the debug commands above
2. Check device logs during sign-in attempt
3. Verify SHA-1 fingerprint is correct
4. Test on different physical device if available
5. Report back with specific error messages from logs