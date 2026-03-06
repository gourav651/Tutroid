import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testSendGridDetailed() {
  try {
    console.log('🧪 Testing SendGrid configuration in detail...\n');
    
    console.log('📋 Configuration:');
    console.log(`   SendGrid API Key: ${process.env.SENDGRID_API_KEY ? 'Set (' + process.env.SENDGRID_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`   From Email: ${process.env.FROM_EMAIL}`);
    console.log('');

    // Create SendGrid transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });

    // Test connection
    console.log('🔗 Testing SendGrid connection...');
    try {
      await transporter.verify();
      console.log('✅ SendGrid connection successful');
    } catch (error) {
      console.log('❌ SendGrid connection failed:', error.message);
      return;
    }

    // Send test email to your actual email
    const testEmails = [
      'kumargg1113@gmail.com',
      'gouravmanjhi9313@gmail.com',
      'gk0843874@gmail.com'
    ];

    for (const email of testEmails) {
      console.log(`\n📧 Sending test OTP to ${email}...`);
      
      const mailOptions = {
        from: `"Tutroid Test" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: "Test OTP - Tutroid Backend Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">🧪 Backend Test - OTP Verification</h2>
            <p>This is a test email from your Tutroid backend.</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 8px; margin: 0;">123456</h1>
            </div>
            <p><strong>If you received this email, your backend email service is working!</strong></p>
            <p>Time sent: ${new Date().toLocaleString()}</p>
          </div>
        `,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`   ✅ Email sent successfully`);
        console.log(`   📧 Message ID: ${info.messageId}`);
        console.log(`   📊 Response: ${info.response}`);
        console.log(`   🎯 Accepted: ${info.accepted?.join(', ') || 'N/A'}`);
        console.log(`   ❌ Rejected: ${info.rejected?.join(', ') || 'None'}`);
      } catch (error) {
        console.log(`   ❌ Failed to send: ${error.message}`);
        console.log(`   🔍 Error code: ${error.code}`);
        console.log(`   📝 Full error:`, error);
      }
    }

    console.log('\n📋 TROUBLESHOOTING TIPS:');
    console.log('1. Check your spam/junk folder');
    console.log('2. Verify SendGrid API key has "Mail Send" permissions');
    console.log('3. Check if sender email is verified in SendGrid');
    console.log('4. Check SendGrid activity logs at https://app.sendgrid.com/email_activity');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSendGridDetailed();