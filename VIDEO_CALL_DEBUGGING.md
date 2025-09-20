# Video Call Debugging Guide

## 🚨 **Current Issue: "Waiting for participant"**

The video call interface loads but gets stuck on "Waiting for participant". Here's how to debug and fix this:

## 🔍 **Step-by-Step Debugging**

### **1. Check Browser Console**
Open browser developer tools (F12) and check for errors:

```javascript
// Common errors to look for:
- "Permission denied" (camera/microphone)
- "Firebase permission denied" 
- "ICE candidate failed"
- "WebRTC connection failed"
```

### **2. Test Browser Permissions**
```javascript
// Test camera/microphone access manually
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then(stream => console.log('Media access OK:', stream))
  .catch(err => console.error('Media access failed:', err));
```

### **3. Check Firebase Rules**
Update your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow video call documents
    match /videoCalls/{callId} {
      allow read, write: if request.auth != null;
      
      // Allow ICE candidates subcollection
      match /iceCandidates/{candidateId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Allow appointments access
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **4. Test Network Connectivity**
```javascript
// Test STUN server connectivity
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE candidate:', event.candidate);
  }
};
```

## 🛠️ **Quick Fixes**

### **Fix 1: Update Firebase Rules**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Rules" tab
4. Update rules to allow video call access
5. Publish rules

### **Fix 2: Enable HTTPS (Required for WebRTC)**
WebRTC requires HTTPS in production. For local development:

```bash
# Serve with HTTPS locally
ng serve --ssl --ssl-key path/to/key.pem --ssl-cert path/to/cert.pem
```

Or use `localhost` (which is treated as secure context).

### **Fix 3: Test with Simple Demo**
Navigate to `/video-demo` and:
1. Enter appointment ID: `test-123`
2. Click "Create & Join Demo Call"
3. Open another browser tab/window
4. Go to `/video-demo` again
5. Enter same ID: `test-123`
6. Click "Join Existing Call"

### **Fix 4: Check Browser Compatibility**
Use Chrome/Chromium for best WebRTC support:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ❌ Internet Explorer (not supported)

## 🔧 **Advanced Debugging**

### **Enable Detailed Logging**
Add this to your video call service:

```typescript
// In video-call.service.ts constructor
constructor(private firebaseService: FirebaseService) {
  // Enable WebRTC logging
  (window as any).RTCPeerConnection = (window as any).RTCPeerConnection || (window as any).webkitRTCPeerConnection;
}
```

### **Test Firebase Connection**
```typescript
// Test Firebase video call document creation
async testFirebaseConnection() {
  try {
    const callId = 'test-call-123';
    await this.firebaseService.createVideoCall(callId, 'doctor-id', 'patient-id');
    console.log('Firebase connection OK');
    
    // Test document retrieval
    this.firebaseService.getVideoCall(callId).subscribe(
      data => console.log('Video call data:', data),
      error => console.error('Firebase read error:', error)
    );
  } catch (error) {
    console.error('Firebase connection failed:', error);
  }
}
```

### **Test WebRTC Peer Connection**
```typescript
// Test basic peer connection
async testWebRTC() {
  const pc1 = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  const pc2 = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  // Test connection
  pc1.onicecandidate = (e) => {
    if (e.candidate) pc2.addIceCandidate(e.candidate);
  };
  
  pc2.onicecandidate = (e) => {
    if (e.candidate) pc1.addIceCandidate(e.candidate);
  };
  
  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  await pc2.setRemoteDescription(offer);
  
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  await pc1.setRemoteDescription(answer);
  
  console.log('WebRTC test completed');
}
```

## 🎯 **Most Likely Solutions**

### **Solution 1: Firebase Rules Issue**
**Problem**: Video call documents can't be read/written
**Fix**: Update Firestore rules as shown above

### **Solution 2: Browser Permissions**
**Problem**: Camera/microphone access denied
**Fix**: 
1. Click camera icon in browser address bar
2. Allow camera and microphone access
3. Refresh page

### **Solution 3: Network/Firewall**
**Problem**: STUN servers blocked
**Fix**: 
1. Try different network (mobile hotspot)
2. Check corporate firewall settings
3. Use TURN servers for production

### **Solution 4: Document ID Mismatch**
**Problem**: Doctor and patient using different call IDs
**Fix**: Both should use same pattern: `call_${appointmentId}`

## 🚀 **Testing Steps**

### **Test 1: Single User Test**
1. Open video consultation page
2. Check if local video appears
3. Look for console errors

### **Test 2: Two Browser Test**
1. Open Chrome browser
2. Navigate to `/video-consultation/test-123`
3. Open Firefox browser  
4. Navigate to `/video-consultation/test-123`
5. Both should connect

### **Test 3: Doctor-Patient Test**
1. Login as doctor
2. Create/approve video appointment
3. Click "Start Video Call"
4. Login as patient (different browser)
5. Join same appointment

## 📞 **Emergency Fallback**

If video calls still don't work, implement audio-only mode:

```typescript
// Fallback to audio-only
const constraints = {
  video: false,  // Disable video
  audio: true    // Keep audio
};

const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

## 🔍 **Check These Common Issues**

1. **HTTPS Required**: WebRTC needs secure context
2. **Firebase Rules**: Must allow videoCalls collection access
3. **Browser Permissions**: Camera/microphone must be allowed
4. **Network**: STUN servers must be reachable
5. **Document IDs**: Both users must use same call ID pattern
6. **Authentication**: Both users must be logged in

The video call should work once these issues are resolved!