# Doctor Video Consultation Guide

## How Doctors Join Video Calls After Approving Appointments

### 📋 **Complete Workflow for Doctors**

#### **Step 1: Receive Appointment Request**
1. Patient books a **Video Consultation** (FREE) through the app
2. Doctor receives notification of new appointment request
3. Appointment appears in **Doctor Dashboard** with "Pending" status

#### **Step 2: Approve the Appointment**
1. Go to **Doctor Dashboard** or **Bookings** page
2. Find the pending video appointment
3. Click **"Approve"** button
4. Appointment status changes to **"Confirmed"**
5. Patient receives notification that appointment is approved

#### **Step 3: Join Video Call (On Appointment Day)**
Doctors have **multiple ways** to join video calls:

##### **Option A: From Doctor Dashboard**
1. Open **Doctor Dashboard**
2. In "Today's Appointments" section
3. Find the confirmed video appointment
4. Click **"Start Video Call"** button
5. Automatically redirected to video consultation interface

##### **Option B: From Bookings Page**
1. Navigate to **Doctor → Bookings**
2. Filter by **"Confirmed"** appointments
3. Find today's video appointment
4. Click **"Start Video Call"** button
5. Join the video consultation

##### **Option C: Direct URL**
- Navigate directly to: `/video-consultation/{appointmentId}`
- Replace `{appointmentId}` with the actual appointment ID

### 🎥 **Video Consultation Interface for Doctors**

#### **What Doctors See:**
- **Full-screen video interface**
- **Patient's video** (main screen)
- **Doctor's video** (picture-in-picture, top-right)
- **Control buttons** at bottom:
  - 🎤 **Audio toggle** (mute/unmute)
  - 📹 **Video toggle** (camera on/off)
  - ☎️ **End call** button

#### **During the Consultation:**
1. **Conduct normal consultation** via video
2. **Toggle audio/video** as needed
3. **Take notes** (outside the video interface)
4. **End call** when consultation is complete

#### **After the Call:**
1. Appointment automatically marked as **"Completed"**
2. Doctor can add **prescription** if needed
3. Patient receives completion notification

### 📱 **Doctor Dashboard Features**

#### **Today's Appointments Section:**
```
┌─────────────────────────────────────┐
│ Patient Name: John Doe              │
│ Time: 2:00 PM                       │
│ Type: Video Consultation            │
│ Status: [Confirmed]                 │
│ [Start Video Call] [Mark Present]   │
└─────────────────────────────────────┘
```

#### **Appointment Status Colors:**
- 🟡 **Yellow (Warning)**: Pending approval
- 🟢 **Green (Success)**: Confirmed
- 🔵 **Blue (Primary)**: Completed
- 🔴 **Red (Danger)**: Cancelled

### 🔧 **Technical Requirements for Doctors**

#### **Browser Requirements:**
- ✅ **Chrome** (recommended)
- ✅ **Firefox**
- ✅ **Safari**
- ✅ **Edge**

#### **Permissions Needed:**
- 📹 **Camera access**
- 🎤 **Microphone access**
- 🌐 **Internet connection**

#### **Device Requirements:**
- 💻 **Desktop/Laptop** (recommended)
- 📱 **Tablet** (good experience)
- 📱 **Mobile phone** (basic support)

### 🚨 **Troubleshooting for Doctors**

#### **Common Issues & Solutions:**

##### **1. Can't See Patient's Video**
- Check if patient has joined the call
- Refresh the page
- Ensure stable internet connection

##### **2. Audio Not Working**
- Click microphone button to unmute
- Check browser permissions
- Test with another device

##### **3. Video Not Working**
- Click camera button to enable
- Check browser camera permissions
- Ensure camera is not used by another app

##### **4. Connection Issues**
- Check internet connection
- Try refreshing the page
- Use Chrome browser for best compatibility

### 📊 **Doctor Benefits**

#### **For Your Practice:**
- 🆓 **Free video consultations** attract more patients
- ⏰ **Flexible scheduling** - no physical presence needed
- 🌍 **Reach patients anywhere** in your service area
- 📈 **Increase appointment volume** without clinic space limits

#### **For Patients:**
- 💰 **No consultation fees** for video calls
- 🏠 **Convenience** of home consultations
- ⚡ **Quick access** to healthcare
- 🚗 **No travel time** required

### 📋 **Best Practices for Doctors**

#### **Before the Call:**
1. ✅ **Test your camera and microphone**
2. ✅ **Ensure good lighting** (face clearly visible)
3. ✅ **Find quiet environment**
4. ✅ **Have patient records ready**
5. ✅ **Check appointment details**

#### **During the Call:**
1. 👋 **Greet patient professionally**
2. 🔍 **Conduct thorough visual examination**
3. 📝 **Take detailed notes**
4. 💬 **Explain diagnosis clearly**
5. 📋 **Provide clear instructions**

#### **After the Call:**
1. ✅ **Mark appointment as completed**
2. 📝 **Add prescription if needed**
3. 📞 **Schedule follow-up if required**
4. 📊 **Update patient records**

### 🔄 **Integration with Existing Workflow**

#### **Appointment Management:**
- Video appointments appear alongside clinic appointments
- Same approval/rejection process
- Same patient management system
- Same prescription and follow-up workflow

#### **Revenue Tracking:**
- Video consultations marked as ₹0 fee
- Helps build patient relationships
- Can lead to paid clinic visits
- Increases overall patient volume

### 📞 **Support & Help**

#### **For Technical Issues:**
1. Check browser console for errors
2. Test with different browser
3. Verify internet connection
4. Contact technical support

#### **For Medical Questions:**
- Video consultations follow same medical standards
- Document consultations as per normal practice
- Follow telemedicine guidelines
- Maintain patient confidentiality

---

## 🎯 **Quick Reference for Doctors**

### **To Join a Video Call:**
1. **Dashboard** → Find appointment → **"Start Video Call"**
2. **OR Bookings** → Filter "Confirmed" → **"Start Video Call"**
3. **OR Direct URL**: `/video-consultation/{appointmentId}`

### **Video Controls:**
- 🎤 **Audio**: Click microphone icon
- 📹 **Video**: Click camera icon  
- ☎️ **End**: Click phone icon

### **After Call:**
- Appointment auto-marked as **"Completed"**
- Add **prescription** if needed
- Patient gets **completion notification**

The video consultation system is now fully integrated and ready for doctors to provide free, high-quality video consultations to their patients!