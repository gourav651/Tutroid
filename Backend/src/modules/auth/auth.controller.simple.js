import { signupService, loginService } from "./auth.service.js";
import { sendVerificationOTP } from "./emailVerification.service.js";
import prisma from "../../db.js";
import bcrypt from "bcrypt";

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
    if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be TRAINER, INSTITUTION, or STUDENT",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isVerified: true }
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: "Email already registered and verified. Please login instead.",
        });
      } else {
        // User exists but not verified - resend OTP
        try {
          await sendVerificationOTP(normalizedEmail);
          return res.status(200).json({
            success: true,
            message: "Account already exists but not verified. New verification OTP sent to your email.",
            data: { email: normalizedEmail },
            requiresVerification: true
          });
        } catch (err) {
          console.error("Failed to resend verification OTP:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to send verification email. Please try again.",
          });
        }
      }
    }

    // Store signup data temporarily (don't create user yet)
    const signupData = {
      email: normalizedEmail,
      password,
      role: normalizedRole,
      phone,
      organization,
      timestamp: new Date()
    };

    // Store in a temporary collection or cache (using database for simplicity)
    // We'll create a PendingSignup model or use a temporary field
    const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 4);
    
    // Create user but mark as unverified and inactive
    const tempUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary username
        password: hashedPassword,
        role: normalizedRole,
        headline: normalizedRole === "TRAINER" ? (organization || "Expert Trainer") : 
                 (normalizedRole === "INSTITUTION" ? (organization || "Educational Institution") : "Student"),
        isVerified: false,
        isActive: false, // Mark as inactive until verified
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Send verification OTP
    try {
      await sendVerificationOTP(normalizedEmail);
      console.log(`[Signup] Verification OTP sent to ${normalizedEmail}`);
    } catch (err) {
      console.error("Failed to send verification OTP:", err);
      // If email fails, delete the temporary user
      await prisma.user.delete({ where: { id: tempUser.id } }).catch(() => {});
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Verification OTP sent to your email. Please verify to complete registration.",
      data: {
        email: normalizedEmail,
        message: "Account will be created after email verification"
      },
      requiresVerification: true,
      nextStep: "Check your email for the verification code and use the verify-email endpoint."
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
