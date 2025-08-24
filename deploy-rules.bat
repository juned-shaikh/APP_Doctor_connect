@echo off
echo Deploying Firestore security rules...
firebase deploy --only firestore:rules
echo.
echo Rules deployed successfully!
echo.
echo Next steps:
echo 1. Ensure your admin user has role: 'admin' in Firestore
echo 2. Test the admin verification functionality
pause
