# Setup Admin User for Doctor Verification

## 🚨 **CRITICAL STEPS TO FIX PERMISSION ERROR**

### **Step 1: Deploy Firestore Security Rules**
```bash
# Run this command in the project root
firebase deploy --only firestore:rules
```

### **Step 2: Create Admin User in Firestore**

1. **Go to Firebase Console** → Your Project → Firestore Database
2. **Navigate to `users` collection**
3. **Find your user document** (or create new admin user)
4. **Update the user document** with these fields:

```json
{
  "uid": "your-user-id",
  "email": "admin@example.com", 
  "name": "Super Admin",
  "role": "admin",
  "userType": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### **Step 3: Verify Admin Access**

1. **Login with admin credentials**
2. **Navigate to Admin Dashboard** → Doctor Verification
3. **Check if doctors list loads** without permission errors

### **Alternative: Create Admin via Console**

If no admin user exists, create one manually:

1. **Firebase Console** → Authentication → Users → Add User
2. **Add user with admin email/password**
3. **Go to Firestore** → users collection → Add document
4. **Use the UID from Authentication as document ID**
5. **Add the admin fields above**

### **Step 4: Test Doctor KYC Flow**

1. **Register as doctor** → Submit KYC documents
2. **Login as admin** → Verify doctor appears in verification list
3. **Approve/Reject** doctor verification

---

## 🔧 **Quick Fix Commands**

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Check current user
firebase auth:export users.json
```

**The permission error will be resolved once these steps are completed.**
