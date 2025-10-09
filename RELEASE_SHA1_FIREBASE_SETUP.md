# Release APK Google Sign-In Fix - Complete Guide

## ✅ Step 1: SHA-1 Fingerprints Identified

**Debug SHA-1** (already in Firebase): `BF:15:39:5A:30:96:9E:8F:DE:E9:20:7D:3A:1E:20:E1:A3:E2:3D:95`

**Release SHA-1** (need to add): `9D:F8:28:05:4C:E2:D1:04:C7:65:7B:AB:60:AC:04:BD:7C:37:FB:52`

## ✅ Step 2: Update build.gradle Configuration

Your `android/app/build.gradle` has been updated to use the new keystore:

```gradle
release {
    storeFile file('my-release-key.jks')
    storePassword 'your_keystore_password'
    keyAlias 'my-key-alias'
    keyPassword 'your_key_password'
}
```

**⚠️ IMPORTANT**: Replace `your_keystore_password` and `your_key_password` with your actual passwords!

## 🔥 Step 3: Add Release SHA-1 to Firebase Console

### 3.1 Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project: **doctorconnect-f0aa0**

### 3.2 Navigate to Project Settings
1. Click **Project Settings** (gear icon)
2. Go to **General** tab
3. Scroll down to **Your apps** section
4. Find your Android app: **com.Js.DoctorConnect**

### 3.3 Add Release SHA-1 Fingerprint
1. Click **Add fingerprint** button
2. Paste this SHA-1: `9D:F8:28:05:4C:E2:D1:04:C7:65:7B:AB:60:AC:04:BD:7C:37:FB:52`
3. Click **Save**

### 3.4 Verify Both SHA-1s Are Listed
After adding, you should see:
- ✅ Debug: `BF:15:39:5A:30:96:9E:8F:DE:E9:20:7D:3A:1E:20:E1:A3:E2:3D:95`
- ✅ Release: `9D:F8:28:05:4C:E2:D1:04:C7:65:7B:AB:60:AC:04:BD:7C:37:FB:52`

## 🔥 Step 4: Download Updated google-services.json

1. After adding the SHA-1, click **Download google-services.json**
2. Replace the file in: `android/app/google-services.json`
3. ⚠️ **This step is CRITICAL** - the new file contains both SHA-1 fingerprints

## 🔥 Step 5: Update build.gradle Passwords

Edit `android/app/build.gradle` and replace the placeholder passwords:

```gradle
release {
    storeFile file('my-release-key.jks')
    storePassword 'YOUR_ACTUAL_KEYSTORE_PASSWORD'  // Replace this
    keyAlias 'my-key-alias'
    keyPassword 'YOUR_ACTUAL_KEY_PASSWORD'         // Replace this
}
```

## 🔥 Step 6: Build Release APK

```bash
# Clean and rebuild
npm run build
npx cap clean android
npx cap sync android

# Build release APK
cd android
.\gradlew assembleRelease
```

## 🔥 Step 7: Test Release APK

1. Install the release APK: `android/app/build/outputs/apk/release/app-release.apk`
2. Test Google Sign-In
3. Should work now! ✅

## 📋 Quick Checklist

- [ ] Release SHA-1 added to Firebase Console: `9D:F8:28:05:4C:E2:D1:04:C7:65:7B:AB:60:AC:04:BD:7C:37:FB:52`
- [ ] Debug SHA-1 still in Firebase Console: `BF:15:39:5A:30:96:9E:8F:DE:E9:20:7D:3A:1E:20:E1:A3:E2:3D:95`
- [ ] Downloaded new google-services.json
- [ ] Replaced android/app/google-services.json
- [ ] Updated build.gradle with correct passwords
- [ ] Built new release APK
- [ ] Tested Google Sign-In on release APK

## 🚨 Common Issues

### Issue 1: Wrong Passwords in build.gradle
**Error**: Build fails with keystore password error
**Solution**: Use correct passwords in build.gradle

### Issue 2: Old google-services.json
**Error**: Still getting "something went wrong"
**Solution**: Download fresh google-services.json after adding SHA-1

### Issue 3: Cache Issues
**Solution**: Clean build and sync
```bash
npx cap clean android
npx cap sync android
```

## 🎯 Expected Result

After completing all steps:
- ✅ Debug APK: Google Sign-In works
- ✅ Release APK: Google Sign-In works
- ✅ Both APKs use same Firebase project
- ✅ Both SHA-1 fingerprints registered in Firebase

## 🔍 Verification Commands

**Check keystore info**:
```bash
keytool -list -v -keystore android/app/my-release-key.jks -alias my-key-alias
```

**Build release APK**:
```bash
cd android && .\gradlew assembleRelease
```

**Find APK**:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 Next Steps

1. **Update build.gradle passwords** (Step 5)
2. **Add SHA-1 to Firebase Console** (Step 3)
3. **Download new google-services.json** (Step 4)
4. **Build and test release APK** (Steps 6-7)

Once you complete these steps, your release APK Google Sign-In will work perfectly! 🎉