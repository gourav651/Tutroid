import { signup } from './src/modules/auth/auth.controller.simple.js';
import dotenv from 'dotenv';

dotenv.config();

// Mock request and response objects
const createMockReq = (body) => ({
  body,
  headers: {},
  method: 'POST',
  url: '/auth/signup'
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      console.log(`📊 Response Status: ${this.statusCode}`);
      console.log('📊 Response Data:', JSON.stringify(data, null, 2));
      return this;
    }
  };
  return res;
};

async function testSignupDirect() {
  try {
    console.log('🧪 Testing Signup Controller Directly...\n');
    
    // Test data - using your email to receive OTP
    const testUser = {
      email: "kumargg1113@gmail.com",
      password: "testpassword123",
      role: "STUDENT"
    };
    
    console.log('📋 Test User Data:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Role: ${testUser.role}`);
    console.log('');

    console.log('🚀 Calling Signup Controller...');
    
    const req = createMockReq(testUser);
    const res = createMockRes();
    
    // Call the signup controller directly
    await signup(req, res);
    
    if (res.data && res.data.success) {
      console.log('');
      console.log('✅ SUCCESS! Signup controller worked correctly!');
      console.log('📧 OTP email should be sent to: kumargg1113@gmail.com');
      console.log('');
      console.log('📋 NEXT STEPS:');
      console.log('1. Check your email inbox (and spam folder)');
      console.log('2. Look for email with subject: "Verify Your Email - Tutroid"');
      console.log('3. Copy the 6-digit OTP from the email');
      console.log('4. If you receive the OTP, the system is working perfectly!');
      console.log('');
      console.log('🚀 Ready for frontend integration and Render deployment!');
    } else {
      console.log('');
      console.log('❌ Signup failed. Check the response above for details.');
    }

  } catch (error) {
    console.error('❌ Error testing signup:', error.message);
    console.error('Full error:', error);
  }
}

console.log('🔧 Direct Signup Controller Test');
console.log('================================');
testSignupDirect();