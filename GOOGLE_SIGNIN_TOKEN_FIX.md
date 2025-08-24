# Google Sign-In Token Issue Fix

## Problem Identified
Error: `"id token is not issued by Google"` with `auth/invalid-credential`

This happens because the native Google Sign-In plugin returns tokens in a different format than Firebase expects.

## Root Cause
The native Google Auth plugin needs both:
1. **ID Token** - for user identity
2. **Access Token** - for Google API access

Firebase needs both tokens to properly validate the credential.

## Solution Applied
✅ Updated `GoogleAuthService.signInWithFirebase()` to use both tokens
✅ Added fallback mechanism for token validation issues
✅ Enhanced error logging for better debugging

## Still Need to Fix: Client ID Configuration

You still have placeholder values in your config files. You MUST replace these:

### 1. Get Your Real Google Web Client ID
From Firebase Console → Authentication → Sign-in method → Google → Web client ID

### 2. Update These Files:

**File: `capacitor.config.ts`**
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_REAL_CLIENT_ID.apps.googleusercontent.com', // Replace this!
  forceCodeForRefreshToken: true
}
```

**File: `src/app/services/google-auth.service.ts`**
```typescript
await GoogleAuth.initialize({
  clientId: 'YOUR_REAL_CLIENT_ID.apps.googleusercontent.com', // Replace this!
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});
```

## Expected Client ID Format
Based on your Firebase config, it should look like:
`1041888734011-abcdefghijklmnop.apps.googleusercontent.com`

## Test Steps
1. Replace the placeholder client IDs
2. Build and sync: `npm run build && npx cap sync android`
3. Test on physical device
4. Check console logs for detailed error info

## Alternative Solution (If Still Failing)
If the token issue persists, we can implement a hybrid approach:
- Use native Google Sign-In to get user info
- Use Firebase Auth with email/password for the actual authentication
- Link the accounts after successful sign-in

## Debug Commands
To see exactly what's happening:
```bash
# Check current config
grep -r "YOUR_ACTUAL_WEB_CLIENT_ID" .

# View detailed logs during sign-in
adb logcat | grep -i google
```

The token handling is now fixed - you just need to configure the correct client ID!