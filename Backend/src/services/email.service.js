import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter;

// Create Brevo SMTP transporter
async function createBrevoTransporter() {
  console.log(`[Email] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Email] Brevo SMTP User available: ${process.env.SMTP_USER ? 'YES' : 'NO'}`);
  
  // Option 1: Brevo SMTP (Primary)
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    console.log("[Email] Using Brevo SMTP for email delivery");
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Reduced timeouts for faster failure detection
      connectionTimeout: 30000, // 30 seconds (reduced from 60)
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 45000, // 45 seconds (reduced from 60)
      // Disable pooling to avoid connection reuse issues
      pool: false,
      // Add retry configuration
      maxConnections: 1,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  // Option 2: Ethereal Email (Testing fallback)
  console.log("[Email] No Brevo credentials found. Using Ethereal Email for testing...");
  const testAccount = await nodemailer.createTestAccount();
  console.log("[Email] Ethereal test account created:");
  console.log(`[Email]   User: ${testAccount.user}`);
  console.log(`[Email]   Pass: ${testAccount.pass}`);
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// Initialize transporter
let transporterPromise = createBrevoTransporter().then(t => {
  transporter = t;
  console.log("[Email] ✅ Brevo transporter initialized successfully");
  return t;
}).catch(error => {
  console.error("[Email] ❌ Failed to initialize transporter:", error);
  throw error;
});

/**
 * Send email with timeout wrapper
 */
const sendEmailWithTimeout = async (mailOptions, timeoutMs = 30000) => {
  return Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout exceeded')), timeoutMs)
    )
  ]);
};

/**
 * Send OTP email for email verification (signup)
 */
export const sendVerificationOTPEmail = async (email, otp) => {
  console.log(`[Email] 📧 Sending verification OTP to ${email}`);
  
  // Wait for transporter to be ready
  await transporterPromise;
  
  // Ensure transporter is valid
  if (!transporter || typeof transporter.sendMail !== 'function') {
    throw new Error("Email transporter not properly initialized");
  }
  
  const senderEmail = process.env.SENDER_EMAIL || "noreply@tutroid.com";
  
  const mailOptions = {
    from: `"Tutroid Platform" <${senderEmail}>`,
    to: email,
    subject: "Verify Your Email - Tutroid",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Tutroid</h1>
          <p style="color: #666; margin: 5px 0;">Learning Platform</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome to Tutroid!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Thank you for signing up. Please verify your email address using the OTP below:
          </p>
          
          <div style="background-color: #ffffff; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #3b82f6;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code</p>
            <h1 style="color: #3b82f6; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 3px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⏰ <strong>This OTP will expire in 10 minutes.</strong>
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            If you didn't create an account with Tutroid, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated email. Please do not reply to this message.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">
            © 2024 Tutroid Platform. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await sendEmailWithTimeout(mailOptions, 30000);
    console.log(`[Email] ✅ Verification OTP sent to ${email}`);
    console.log(`[Email] 📧 Message ID: ${info.messageId}`);
    
    // If using Ethereal, show the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email] 🔗 Preview URL: ${previewUrl}`);
      console.log(`[Email] 🔑 Verification OTP Code: ${otp}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] ❌ Error sending verification OTP:", error);
    console.error("[Email] Error details:", {
      message: error.message,
      code: error.code,
      response: error.response
    });
    throw new Error("Failed to send verification OTP email");
  }
};

/**
 * Send OTP email for password reset
 */
export const sendOTPEmail = async (email, otp) => {
  console.log(`[Email] 📧 Sending password reset OTP to ${email}`);
  
  // Wait for transporter to be ready
  await transporterPromise;
  
  // Ensure transporter is valid
  if (!transporter || typeof transporter.sendMail !== 'function') {
    throw new Error("Email transporter not properly initialized");
  }
  
  const senderEmail = process.env.SENDER_EMAIL || "noreply@tutroid.com";
  
  const mailOptions = {
    from: `"Tutroid Platform" <${senderEmail}>`,
    to: email,
    subject: "Password Reset OTP - Tutroid",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Tutroid</h1>
          <p style="color: #666; margin: 5px 0;">Learning Platform</p>
        </div>
        
        <div style="background-color: #fef2f2; padding: 30px; border-radius: 10px; border-left: 4px solid #ef4444;">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            You requested a password reset for your account. Use the following OTP to reset your password:
          </p>
          
          <div style="background-color: #ffffff; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #ef4444;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your Reset Code</p>
            <h1 style="color: #ef4444; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 3px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⏰ <strong>This OTP will expire in 10 minutes.</strong>
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            If you didn't request this password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated email. Please do not reply to this message.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">
            © 2024 Tutroid Platform. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await sendEmailWithTimeout(mailOptions, 30000);
    console.log(`[Email] ✅ Password reset OTP sent to ${email}`);
    console.log(`[Email] 📧 Message ID: ${info.messageId}`);
    
    // If using Ethereal, show the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email] 🔗 Preview URL: ${previewUrl}`);
      console.log(`[Email] 🔑 OTP Code: ${otp}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] ❌ Error sending password reset OTP:", error);
    throw new Error("Failed to send OTP email");
  }
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmation = async (email) => {
  // Wait for transporter to be ready
  await transporterPromise;
  
  // Ensure transporter is valid
  if (!transporter || typeof transporter.sendMail !== 'function') {
    console.log("[Email] ⚠️ Transporter not available for confirmation email");
    return { success: false };
  }
  
  const senderEmail = process.env.SENDER_EMAIL || "noreply@tutroid.com";
  
  const mailOptions = {
    from: `"Tutroid Platform" <${senderEmail}>`,
    to: email,
    subject: "Password Reset Successful - Tutroid",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Tutroid</h1>
          <p style="color: #666; margin: 5px 0;">Learning Platform</p>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 30px; border-radius: 10px; border-left: 4px solid #22c55e;">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Successful</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Your password has been successfully reset.
          </p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #166534; margin: 0; font-size: 16px;">
              ✅ <strong>Your password was changed on ${new Date().toLocaleString()}</strong>
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            If you didn't make this change, please contact our support team immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated email. Please do not reply to this message.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">
            © 2024 Tutroid Platform. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await sendEmailWithTimeout(mailOptions, 30000);
    console.log(`[Email] ✅ Password reset confirmation sent to ${email}`);
    
    // If using Ethereal, show the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email] 🔗 Preview URL: ${previewUrl}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("[Email] ❌ Error sending confirmation:", error);
    // Don't throw - this is a non-critical email
    return { success: false };
  }
};