import { sendVerificationOTPEmail, sendOTPEmail } from './src/services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

console.log("=== Brevo API Email Test ===\n");

// Test email and OTP
const testEmail = process.env.SENDER_EMAIL || "test@example.com";
const testOTP = "123456";

console.log(`Testing email delivery to: ${testEmail}`);
console.log(`Test OTP: ${testOTP}\n`);

// Test 1: Verification OTP Email
console.log("Test 1: Sending Verification OTP Email...");
try {
  const startTime = Date.now();
  const result = await sendVerificationOTPEmail(testEmail, testOTP);
  const endTime = Date.now();
  
  console.log(`✅ Verification email sent successfully!`);
  console.log(`   Message ID: ${result.messageId}`);
  console.log(`   Time taken: ${endTime - startTime}ms\n`);
} catch (error) {
  console.error(`❌ Verification email failed:`);
  console.error(`   Error: ${error.message}\n`);
  process.exit(1);
}

// Test 2: Password Reset OTP Email
console.log("Test 2: Sending Password Reset OTP Email...");
try {
  const startTime = Date.now();
  const result = await sendOTPEmail(testEmail, testOTP);
  const endTime = Date.now();
  
  console.log(`✅ Password reset email sent successfully!`);
  console.log(`   Message ID: ${result.messageId}`);
  console.log(`   Time taken: ${endTime - startTime}ms\n`);
} catch (error) {
  console.error(`❌ Password reset email failed:`);
  console.error(`   Error: ${error.message}\n`);
  process.exit(1);
}

console.log("=== All Tests Passed! ===");
console.log("✅ Brevo API is working correctly");
console.log("✅ Ready for production deployment\n");

process.exit(0);
