# Local Notification Debugging Guide

## Steps to Test Local Notifications

1. **Build and deploy the app to your mobile device**
   ```bash
   npm run build
   npx cap copy
   npx cap open android
   # Then build and run from Android Studio
   ```

2. **Open the Notification Test Page**
   - Navigate to `/notification-test` in your app
   - Tap the "Send Test Notification" button
   - Check if you receive a notification

3. **Check the Browser Console (for web testing)**
   - Open Chrome DevTools
   - Look for DEBUG messages in the console
   - Check for any error messages

4. **Check Android Logcat (for native testing)**
   - In Android Studio, open the Logcat window
   - Filter by "Capacitor" or your app name
   - Look for DEBUG messages from the notification service

## Common Issues and Solutions

### 1. Permissions Not Granted
**Symptoms**: No notifications appear, but no errors in console
**Solution**: 
- Check if the app has notification permissions in device settings
- Uninstall and reinstall the app to trigger permission prompts again

### 2. App in Foreground
**Symptoms**: Notifications don't appear when app is open
**Solution**: 
- Notifications may not appear when app is in foreground depending on device settings
- Try minimizing the app before triggering notifications

### 3. Timing Issues
**Symptoms**: Notifications appear delayed or not at all
**Solution**: 
- Notifications are scheduled for 2 seconds in the future to ensure delivery
- Check if the device is in battery saving mode which might delay notifications

### 4. Android Channel Issues
**Symptoms**: Notifications work on some devices but not others
**Solution**: 
- Android 8+ requires notification channels
- The Capacitor plugin should create a default channel automatically

## Debugging Checklist

- [ ] App is running on a physical device (not browser)
- [ ] Local notifications permission is granted
- [ ] App is minimized when testing foreground notifications
- [ ] No errors in console/logcat
- [ ] Notification service is properly initialized
- [ ] Appointment status is actually changing from 'pending' to 'confirmed'

## Testing Appointment Confirmation Notifications

1. Book a new appointment (status will be 'pending')
2. As a doctor, approve the appointment (status changes to 'confirmed')
3. Check if notification appears on patient device

If notifications still aren't working, please provide:
1. Console/logcat output
2. Device type and Android version
3. Steps you took to test