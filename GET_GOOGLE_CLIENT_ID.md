# How to Get Your Google Web Client ID

## Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: **doctorconnect-f0aa0**

## Step 2: Navigate to Authentication
1. In the left sidebar, click **Authentication**
2. Click on **Sign-in method** tab
3. Find **Google** in the list of providers

## Step 3: Get the Web Client ID
1. Click on **Google** provider
2. You'll see a section called **Web SDK configuration**
3. Copy the **Web client ID** (it looks like: `1041888734011-xxxxxxxxxx.apps.googleusercontent.com`)

## Step 4: Update Your Configuration Files

### File 1: `capacitor.config.ts`
Replace this line:
```typescript
serverClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
```

With your actual client ID:
```typescript
serverClientId: '1041888734011-xxxxxxxxxx.apps.googleusercontent.com',
```

### File 2: `src/app/services/google-auth.service.ts`
Replace this line:
```typescript
clientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
```

With your actual client ID:
```typescript
clientId: '1041888734011-xxxxxxxxxx.apps.googleusercontent.com',
```

## Step 5: Build and Test
```bash
npm run build
npx cap sync android
```

## Important Notes:
- The Web Client ID starts with your project number: `1041888734011`
- It's different from the Android Client ID
- You need the **Web** client ID, not the Android one
- Make sure to use the same ID in both files

## If You Can't Find It:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: **doctorconnect-f0aa0**
3. Go to **APIs & Services** > **Credentials**
4. Look for **Web client** (not Android client)
5. Copy the Client ID from there

Your project ID is: **doctorconnect-f0aa0**
Your project number is: **1041888734011**