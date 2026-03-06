import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

async function testSignupFlow() {
  try {
    console.log('🧪 Testing Complete Signup Flow with OTP...\n');
    
    // Test data
    const testUser = {
      email: "kumargg1113@gmail.com", // Your email to receive OTP
      password: "testpassword123",
      role: "STUDENT"
    };
    
    console.log('📋 Test User Data:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Base URL: ${BASE_URL}`);
    console.log('');

    // Step 1: Test Signup API
    console.log('🚀 Step 1: Testing Signup API...');
    
    const signupResponse = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const signupData = await signupResponse.json();
    
    console.log(`📊 Signup Response Status: ${signupResponse.status}`);
    console.log('📊 Signup Response Data:', JSON.stringify(signupData, null, 2));
    
    if (signupData.success) {
      console.log('✅ Signup API working correctly!');
      console.log('📧 OTP should be sent to your email now.');
      console.log('');
      
      // Step 2: Instructions for manual OTP verification
      console.log('🔍 Step 2: Manual OTP Verification Test');
      console.log('');
      console.log('📋 INSTRUCTIONS:');
      console.log('1. Check your email inbox: kumargg1113@gmail.com');
      console.log('2. Look for email with subject: "Verify Your Email - Tutroid"');
      console.log('3. Copy the 6-digit OTP from the email');
      console.log('4. Test the verification API manually or wait for frontend test');
      console.log('');
      
      // Step 3: Show verification API format
      console.log('🔧 Step 3: Verification API Format');
      console.log('');
      console.log('To verify the OTP, use this API call:');
      console.log(`POST ${BASE_URL}/auth/verify-email`);
      console.log('Body:');
      console.log(JSON.stringify({
        email: testUser.email,
        otp: "YOUR_OTP_FROM_EMAIL"
      }, null, 2));
      console.log('');
      
      // Step 4: Show resend API format
      console.log('🔄 Step 4: Resend OTP API Format');
      console.log('');
      console.log('To resend OTP if needed:');
      console.log(`POST ${BASE_URL}/auth/resend-verification-otp`);
      console.log('Body:');
      console.log(JSON.stringify({
        email: testUser.email
      }, null, 2));
      
    } else {
      console.log('❌ Signup API failed:', signupData.message);
    }

  } catch (error) {
    console.error('❌ Error testing signup flow:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('🚨 Server Connection Error:');
      console.log('   Make sure your backend server is running');
      console.log(`   Try: npm start or node src/index.js`);
      console.log(`   Server should be running on: ${BASE_URL}`);
    }
  }
}

testSignupFlow();