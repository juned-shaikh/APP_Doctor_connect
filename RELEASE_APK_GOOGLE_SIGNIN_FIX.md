# Release APK Google Sign-In Fix

## Problem
Release APK mein Google Sign-In not working but debug APK mein working hai.

**Root Cause**: Release APK ka SHA-1 fingerprint different hota hai debug keystore se.

## Solution Steps

### Step 1: Get Release APK SHA-1 Fingerprint

**Method 1: From Release Keystore**
```bash
# Navigate to android directory
cd android

# Get SHA-1 from release keystore
keytool -list -v -keystore app/doctorapp-release-key.keystore -alias doctorapp-release -storepass android -keypass android
```

**Method 2: From Built APK**
```bash
# If you have the APK file
keytool -printcert -jarfile app-release.apk
```

**Method 3: Using Gradle**
```bash
cd android
.\gradlew signingReport
```

### Step 2: Add Release SHA-1 to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `doctorconnect-f0aa0`
3. Go to **Project Settings** → **General**
4. Select your Android app: `com.Js.DoctorConnect`
5. Click **Add fingerprint**
6. Add the **Release SHA-1 fingerprint**
7. Keep the existing debug SHA-1: `BF:15:39:5A:30:96:9E:8F:DE:E9:20:7D:3A:1E:20:E1:A3:E2:3D:95`

### Step 3: Download Updated google-services.json

1. After adding release SHA-1, download new `google-services.json`
2. Replace `android/app/google-services.json`
3. Rebuild the app

### Step 4: Rebuild Release APK

```bash
# Clean and rebuild
npm run build
npx cap clean android
npx cap sync android

# Build release APK
cd android
.\gradlew assembleRelease

# Or build in Android Studio
npx cap open android
# Then Build → Generate Signed Bundle/APK
```

## Current Configuration

**Debug SHA-1** (already added): `BF:15:39:5A:30:96:9E:8F:DE:E9:20:7D:3A:1E:20:E1:A3:E2:3D:95`

**Release Keystore Info**:
- File: `android/app/doctorapp-release-key.keystore`
- Alias: `doctorapp-release`
- Store Password: `android`
- Key Password: `android`

## Quick Commands

**Get Release SHA-1**:
```bash
cd android
keytool -list -v -keystore app/doctorapp-release-key.keystore -alias doctorapp-release -storepass android -keypass android | findstr SHA1
```

**Build Release APK**:
```bash
cd android
.\gradlew assembleRelease
```

**Find APK Location**:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Verification Steps

1. **Get release SHA-1** using above command
2. **Add to Firebase Console** alongside existing debug SHA-1
3. **Download new google-services.json**
4. **Replace** the file in `android/app/`
5. **Rebuild** release APK
6. **Test** on device

## Common Issues

### Issue 1: Multiple SHA-1 Fingerprints
**Solution**: Add both debug and release SHA-1 to Firebase Console

### Issue 2: Wrong Keystore
**Solution**: Ensure you're using the same keystore that signed the APK

### Issue 3: Cached google-services.json
**Solution**: Always download fresh google-services.json after adding SHA-1

## Expected Result

After adding release SHA-1:
- ✅ Debug APK: Google Sign-In works
- ✅ Release APK: Google Sign-In works
- ✅ Both use same Firebase project
- ✅ Both have their SHA-1 in Firebase Console

## Firebase Console SHA-1 List

After fix, you should have:
1. **Debug SHA-1**: `BF:15:39:5A:30:96:9E:8F:DE:E9:20:7D:3A:1E:20:E1:A3:E2:3D:95`
2. **Release SHA-1**: `[TO BE ADDED]`

Both fingerprints should be listed under the same Android app in Firebase Console.