import { sendVerificationOTPEmail } from './src/services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testBrevoEmail() {
  try {
    console.log('🧪 Testing Brevo email service for signup OTP...\n');
    
    console.log('📋 Configuration:');
    console.log(`   SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`   SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`   SMTP User: ${process.env.SMTP_USER ? 'Set' : 'NOT SET'}`);
    console.log(`   SMTP Password: ${process.env.SMTP_PASSWORD ? 'Set (hidden)' : 'NOT SET'}`);
    console.log(`   Sender Email: ${process.env.SENDER_EMAIL}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log('');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('❌ Brevo SMTP credentials not set. Will use Ethereal for testing.');
      console.log('   Add SMTP_USER and SMTP_PASSWORD to your .env file');
      console.log('');
    }

    // Test email and OTP
    const testEmail = process.env.SENDER_EMAIL || "test@example.com";
    const testOTP = "123456";
    
    console.log(`📧 Sending test verification OTP to: ${testEmail}`);
    console.log(`🔑 Test OTP: ${testOTP}`);
    console.log('');
    
    const startTime = Date.now();
    const result = await sendVerificationOTPEmail(testEmail, testOTP);
    const endTime = Date.now();
    
    console.log(`⏱️  Email sent in ${endTime - startTime}ms`);
    console.log(`📊 Result:`, result);
    
    console.log('\n🎉 Brevo email service is working! Check your email for the OTP.');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check your email inbox (and spam folder)');
    console.log('2. Test the complete signup flow in your frontend');
    console.log('3. Verify OTP verification works correctly');

  } catch (error) {
    console.error('❌ Error testing Brevo email:', error.message);
    console.error('Full error:', error);
  }
}

testBrevoEmail();