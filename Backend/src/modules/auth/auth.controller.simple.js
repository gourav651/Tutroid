import { signupService, loginService } from "./auth.service.js";
import { sendVerificationOTP } from "./emailVerification.service.js";
import prisma from "../../db.js";

// ================= SIMPLE SIGNUP CONTROLLER =================
export const signup = async (req, res, next) => {
  try {
    console.log("Simple signup - request body:", req.body);

    // Direct validation without complex schema
    const { email, password, role, phone, organization } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    // Convert role to uppercase to match frontend lowercase values
    const normalizedRole = role ? role.toUpperCase() : role;

    // Basic role validation
    const allowedRoles = ["TRAINER", "INSTITUTION", "STUDENT"];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be TRAINER, INSTITUTION, or STUDENT",
      });
    }

    // Call service with timeout
    const result = await Promise.race([
      signupService({
        email,
        password,
        role: normalizedRole,
        phone,
        organization
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup service timeout')), 15000) // 15 second timeout
      )
    ]);

    // Send verification OTP (REQUIRED for signup) - Make it non-blocking
    try {
      // Don't await - send email in background
      sendVerificationOTP(email).catch(err => {
        console.error("Failed to send verification OTP (background):", err);
      });
      console.log(`[Signup] Verification OTP queued for ${email}`);
    } catch (err) {
      console.error("Failed to queue verification OTP:", err);
      // Don't fail signup if email fails - user can request resend
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully! Verification OTP sent to your email. Please verify to continue.",
      data: {
        user: result.user, // Don't send token yet
        email: email,
      },
      requiresVerification: true, // Changed to true - verification is REQUIRED
    });
  } catch (err) {
    console.error("Simple signup error:", err);
    
    // Handle specific timeout errors
    if (err.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: "Registration is taking longer than expected. Please try again.",
      });
    }
    
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Signup failed",
    });
  }
};

// ================= SIMPLE LOGIN CONTROLLER =================
export const login = async (req, res, next) => {
  try {
    console.log("Simple login - request body:", req.body);

    // Direct validation without complex schema
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Call service directly
    const result = await loginService({ email, password });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err) {
    console.error("Simple login error:", err);
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "Login failed",
    });
  }
};
