import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Brevo API Email Service
 * Uses Brevo's v3 API instead of SMTP for better reliability on cloud platforms
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SMTP_PASSWORD;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@tutroid.com";
const SENDER_NAME = "Tutroid Platform";

console.log(`[Email] Environment: ${process.env.NODE_ENV}`);
console.log(`[Email] Brevo API Key available: ${BREVO_API_KEY ? 'YES' : 'NO'}`);
console.log(`[Email] Sender Email: ${SENDER_EMAIL}`);

/**
 * Send email using Brevo API
 */
const sendBrevoEmail = async (to, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    throw new Error("Brevo API key not configured");
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: to,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      timeout: 15000, // 15 second timeout
    });

    return {
      success: true,
      messageId: response.data.messageId,
    };
  } catch (error) {
    console.error("[Email] Brevo API error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to send email: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Send OTP email for email verification (signup)
 */
export const sendVerificationOTPEmail = async (email, otp) => {
  console.log(`[Email] 📧 Sending verification OTP to ${email}`);

  const htmlContent = `
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
  `;

  try {
    const result = await sendBrevoEmail(email, "Verify Your Email - Tutroid", htmlContent);
    console.log(`[Email] ✅ Verification OTP sent to ${email}`);
    console.log(`[Email] 📧 Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("[Email] ❌ Error sending verification OTP:", error.message);
    throw error;
  }
};

/**
 * Send OTP email for password reset
 */
export const sendOTPEmail = async (email, otp) => {
  console.log(`[Email] 📧 Sending password reset OTP to ${email}`);

  const htmlContent = `
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
  `;

  try {
    const result = await sendBrevoEmail(email, "Password Reset OTP - Tutroid", htmlContent);
    console.log(`[Email] ✅ Password reset OTP sent to ${email}`);
    console.log(`[Email] 📧 Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("[Email] ❌ Error sending password reset OTP:", error.message);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmation = async (email) => {
  console.log(`[Email] 📧 Sending password reset confirmation to ${email}`);

  const htmlContent = `
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
  `;

  try {
    const result = await sendBrevoEmail(email, "Password Reset Successful - Tutroid", htmlContent);
    console.log(`[Email] ✅ Password reset confirmation sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("[Email] ❌ Error sending confirmation:", error.message);
    return { success: false };
  }
};
