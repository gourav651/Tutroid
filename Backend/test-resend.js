// Email service import disabled - OTP functionality disabled
// import { sendVerificationOTPEmail } from './src/services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testResend() {
  try {
    console.log('🧪 Testing Resend email service...\n');
    
    console.log('📋 Configuration:');
    console.log(`   Resend API Key: ${process.env.RESEND_API_KEY ? 'Set' : 'NOT SET'}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log('');

    if (!process.env.RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY not set. Please add it to your .env file');
      return;
    }

    // Test sending OTP
    const testEmail = 'kumargg1113@gmail.com';
    const testOTP = '123456';
    
    console.log(`📧 Sending test OTP ${testOTP} to ${testEmail}...`);
    
    const startTime = Date.now();
    const result = await sendVerificationOTPEmail(testEmail, testOTP);
    const endTime = Date.now();
    
    console.log(`✅ Email sent successfully in ${endTime - startTime}ms`);
    console.log(`📊 Result:`, result);
    
    console.log('\n🎉 Resend is working! Check your email for the OTP.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResend();