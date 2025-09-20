#!/bin/bash

echo "🔍 Getting SHA-1 fingerprints for Google Sign-In setup..."
echo ""

echo "📱 Debug Keystore SHA-1 (for development):"
echo "----------------------------------------"
if [ -f ~/.android/debug.keystore ]; then
    keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
else
    echo "❌ Debug keystore not found at ~/.android/debug.keystore"
fi

echo ""
echo "🏗️ Release Keystore SHA-1 (if exists):"
echo "--------------------------------------"
if [ -f android/app/doctorapp-release-key.keystore ]; then
    keytool -list -v -keystore android/app/doctorapp-release-key.keystore -alias doctorapp-release -storepass android -keypass android | grep SHA1
else
    echo "❌ Release keystore not found at android/app/doctorapp-release-key.keystore"
fi

echo ""
echo "🔧 Alternative method using Gradle:"
echo "-----------------------------------"
echo "Run this command in your project root:"
echo "cd android && ./gradlew signingReport"

echo ""
echo "📋 Next Steps:"
echo "1. Copy the SHA1 fingerprint(s) above"
echo "2. Go to Firebase Console → Project Settings → Your Android App"
echo "3. Add the SHA1 fingerprint(s)"
echo "4. Download the updated google-services.json"
echo "5. Replace android/app/google-services.json with the new file"
echo "6. Rebuild and sync: npm run build && npx cap sync android"