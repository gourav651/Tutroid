// Email service import disabled - OTP functionality disabled
// import { sendVerificationOTPEmail } from './src/services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  try {
    console.log('🧪 Testing email service...');
    console.log('SendGrid API Key:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
    console.log('From Email:', process.env.FROM_EMAIL);
    
    const testOTP = '123456';
    const testEmail = 'test@example.com';
    
    console.log(`Sending test OTP ${testOTP} to ${testEmail}...`);
    
    const result = await Promise.race([
      sendVerificationOTPEmail(testEmail, testOTP),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000)
      )
    ]);
    
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();