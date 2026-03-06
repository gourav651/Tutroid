# 🚀 Deployment Guide - OTP Signup Flow

## 📋 Pre-Deployment Checklist

### ✅ **Code Changes Ready**
- Backend: Brevo SMTP integration complete
- Frontend: OTP flow integration complete
- Email templates: Professional Tutroid branding
- Error handling: Comprehensive coverage

## 🔧 **Render Backend Deployment**

### **1. Environment Variables to Add**
In your Render dashboard, add these environment variables:

```
SENDER_EMAIL=your-verified-email@domain.com
SMTP_USER=your-brevo-smtp-user
SMTP_PASSWORD=your-brevo-smtp-password
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
```

**Note:** Use your actual Brevo SMTP credentials from your Brevo account dashboard.

### **2. Complete Environment Variables List**
```
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
JWT_ISSUER=tutroid
JWT_AUDIENCE=tutroid-users
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.vercel.app
BCRYPT_ROUNDS=10
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./storage/materials
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SIGNUP_RATE_LIMIT=50
FORGOT_PASSWORD_RATE_LIMIT=15
OTP_RATE_LIMIT=15
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

## 🧪 **Testing After Deployment**

### **1. Test Signup Flow**
1. Go to your deployed frontend URL
2. Navigate to `/signup`
3. Fill out signup form with a real email
4. Click "Create Account"
5. Should redirect to verification page
6. Check email inbox for OTP
7. Enter OTP and verify
8. Should redirect to dashboard

### **2. Expected Behavior**

**Signup Response:**
```json
{
  "success": true,
  "message": "Verification OTP sent to your email...",
  "requiresVerification": true
}
```

**Email Received:**
- Subject: "Verify Your Email - Tutroid"
- Professional template with 6-digit OTP
- 10-minute expiry warning

## 🎉 **Ready for Deployment!**

Your OTP signup flow is production-ready. Deploy with confidence!