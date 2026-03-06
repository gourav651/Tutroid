import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

let transporter;
let resend;

// Initialize Resend if API key is available
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("[Email] ✅ Resend initialized successfully");
} else {
  console.log("[Email] ⚠️  Resend API key not found, will use fallback");
}

// Create transporter - supports Resend, SendGrid, Brevo, Gmail, or Ethereal for testing
async function createTransporter() {
  console.log(`[Email] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Email] Resend API Key available: ${process.env.RESEND_API_KEY ? 'YES' : 'NO'}`);
  console.log(`[Email] SendGrid API Key available: ${process.env.SENDGRID_API_KEY ? 'YES' : 'NO'}`);
  
  // Option 1: Resend (Recommended for Render)
  if (process.env.RESEND_API_KEY) {
    console.log("[Email] Using Resend for email delivery");
    // Return a dummy transporter since we'll use Resend API directly
    return { isResend: true };
  }
  
  // Option 2: Brevo (300 emails/day free)
  if (process.env.BREVO_API_KEY) {
    console.log("[Email] Using Brevo API for email delivery");
    return nodemailer.createTransport({
      host: "smtp-relay.sendinblue.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER || process.env.FROM_EMAIL,
        pass: process.env.BREVO_API_KEY,
      },
    });
  }

  // Option 3: SendGrid (Fallback)
  if (process.env.SENDGRID_API_KEY) {
    console.log("[Email] Using SendGrid for email delivery");
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Option 2: Brevo (300 emails/day free)
  if (process.env.BREVO_API_KEY) {
    console.log("[Email] Using Brevo API for email delivery");
    return nodemailer.createTransport({
      host: "smtp-relay.sendinblue.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER || process.env.FROM_EMAIL,
        pass: process.env.BREVO_API_KEY,
      },
    });
  }

  // Option 3: Gmail SMTP (with App Password)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log("[Email] Using Gmail SMTP for email delivery");
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Option 4: Ethereal Email (fake email for testing)
  console.log("[Email] No credentials found. Using Ethereal Email for testing...");
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
let transporterPromise = createTransporter().then(t => {
  transporter = t;
  return t;
});

/**
 * Send OTP email for email verification (signup)
 */
export const sendVerificationOTPEmail = async (email, otp) => {
  // Wait for transporter to be ready
  await transporterPromise;
  
  // Use Resend if available
  if (process.env.RESEND_API_KEY && resend) {
    console.log(`[Email] 🚀 Using Resend to send OTP to ${email}`);
    try {
      const { data, error } = await resend.emails.send({
        from: 'Tutroid <onboarding@resend.dev>',
        to: [email],
        subject: 'Verify Your Email - Tutroid',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Tutroid!</h2>
            <p>Hello,</p>
            <p>Thank you for signing up. Please verify your email address using the OTP below:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't create an account with Tutroid, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        `,
      });

      if (error) {
        console.error("[Email] ❌ Resend API error:", error);
        console.error("[Email] ❌ Error details:", JSON.stringify(error, null, 2));
        throw new Error(`Resend API error: ${error.message || 'Unknown error'}`);
      }

      console.log(`[Email] ✅ Verification OTP sent to ${email} via Resend`);
      console.log(`[Email] 📧 Message ID: ${data.id}`);
      console.log(`[Email] 📊 Resend response:`, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error("[Email] ❌ Error sending verification OTP via Resend:", error);
      console.error("[Email] ❌ Full error object:", JSON.stringify(error, null, 2));
      throw new Error("Failed to send verification OTP email");
    }
  } else {
    console.log(`[Email] ⚠️  Resend not available, using fallback for ${email}`);
    console.log(`[Email] 🔍 Debug - RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`);
    console.log(`[Email] 🔍 Debug - resend object exists: ${!!resend}`);
  }
  
  // Fallback to existing email service (SendGrid/Gmail/etc)
  const senderEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || "noreply@tutroid.com";
  
  const mailOptions = {
    from: `"Tutroid" <${senderEmail}>`,
    to: email,
    subject: "Verify Your Email - Tutroid",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Tutroid!</h2>
        <p>Hello,</p>
        <p>Thank you for signing up. Please verify your email address using the OTP below:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p><strong>This OTP will expire in 10 minutes.</strong></p>
        <p>If you didn't create an account with Tutroid, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Verification OTP sent to ${email}`);
    console.log(`[Email] Message ID: ${info.messageId}`);
    console.log(`[Email] Response: ${info.response}`);
    
    // If using Ethereal, show the preview URL
    if (info.ethereal) {
      console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`[Email] Verification OTP Code: ${otp}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("[Email] ❌ Error sending verification OTP:", error);
    console.error("[Email] Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.body || error.response
    });
    throw new Error("Failed to send verification OTP email");
  }
};

/**
 * Send OTP email for password reset
 */
export const sendOTPEmail = async (email, otp) => {
  // Wait for transporter to be ready
  await transporterPromise;
  
  // Use Resend if available
  if (process.env.RESEND_API_KEY && resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Tutroid <onboarding@resend.dev>',
        to: [email],
        subject: 'Password Reset OTP - Tutroid',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your account. Use the following OTP to reset your password:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        `,
      });

      if (error) {
        console.error("[Email] ❌ Resend error:", error);
        throw new Error("Failed to send OTP email");
      }

      console.log(`[Email] ✅ Password reset OTP sent to ${email} via Resend`);
      console.log(`[Email] Message ID: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error("[Email] ❌ Error sending OTP via Resend:", error);
      throw new Error("Failed to send OTP email");
    }
  }
  
  // Fallback to existing email service
  const senderEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || "noreply@tutroid.com";
  
  const mailOptions = {
    from: `"Tutroid" <${senderEmail}>`,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your account. Use the following OTP to reset your password:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p><strong>This OTP will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] OTP sent to ${email}`);
    console.log(`[Email] Message ID: ${info.messageId}`);
    console.log(`[Email] Response: ${info.response}`);
    
    // If using Ethereal, show the preview URL
    if (info.ethereal) {
      console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`[Email] OTP Code: ${otp}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] Error sending OTP:", error);
    throw new Error("Failed to send OTP email");
  }
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmation = async (email) => {
  // Wait for transporter to be ready
  await transporterPromise;
  
  const senderEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || "noreply@tutroid.com";
  
  const mailOptions = {
    from: `"Tutroid" <${senderEmail}>`,
    to: email,
    subject: "Password Reset Successful",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Hello,</p>
        <p>Your password has been successfully reset.</p>
        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #155724; margin: 0;"><strong>✓ Your password was changed on ${new Date().toLocaleString()}</strong></p>
        </div>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset confirmation sent to ${email}`);
    
    // If using Ethereal, show the preview URL
    if (info.ethereal) {
      console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending confirmation:", error);
    // Don't throw - this is a non-critical email
    return { success: false };
  }
};
