import dotenv from 'dotenv';
dotenv.config();

// Simple diagnostic script for Render
console.log('🔍 RENDER EMAIL DIAGNOSTICS');
console.log('==========================');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Platform: ${process.platform}`);
console.log(`Node Version: ${process.version}`);
console.log('');

console.log('📧 EMAIL SERVICE CHECK:');
console.log(`Resend API Key: ${process.env.RESEND_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`From Email: ${process.env.FROM_EMAIL || 'NOT SET'}`);
console.log('');

if (process.env.RESEND_API_KEY) {
  console.log('✅ Resend should be used for email delivery');
} else if (process.env.SENDGRID_API_KEY) {
  console.log('⚠️  Falling back to SendGrid (may have delivery issues)');
} else {
  console.log('❌ No email service configured!');
}

console.log('');
console.log('🚀 NEXT STEPS:');
if (!process.env.RESEND_API_KEY) {
  console.log('1. Add RESEND_API_KEY to Render environment variables');
  console.log('2. Redeploy the service');
  console.log('3. Test email functionality');
} else {
  console.log('✅ Email service should be working with Resend');
}