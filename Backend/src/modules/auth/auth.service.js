import client from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/AppError.js";
import { withRetry } from "../../utils/dbHelper.js";
import { sendVerificationOTPEmail } from "../../services/email.service.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

const JWT_OPTIONS = {
  expiresIn: "1d", // longer life for demo
  issuer: process.env.JWT_ISSUER || "trainer-platform",
  audience: process.env.JWT_AUDIENCE || "trainer-users",
};

/**
 * Generate unique username from email
 * Format: firstname.lastname123 or email-prefix123
 */
const generateUsername = async (email, firstName, lastName) => {
  const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  
  let baseUsername;
  if (firstName && lastName) {
    baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, "");
  } else {
    baseUsername = emailPrefix;
  }

  // Try base username first
  let username = baseUsername;
  let suffix = 0;
  
  while (true) {
    const existing = await client.user.findUnique({
      where: { username },
      select: { id: true },
    });
    
    if (!existing) {
      return username;
    }
    
    // Add random number suffix
    suffix = Math.floor(Math.random() * 10000);
    username = `${baseUsername}${suffix}`;
  }
};

// ================= SIGNUP SERVICE =================
export const signupService = async ({ email, password, role, phone, organization }) => {
  console.log("SignupService CALLED with:", { email, role, phone, organization });
  if (!email || !password || !role) {
    throw new AppError("Missing required fields", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Prevent role escalation
  const allowedRoles = ["TRAINER", "INSTITUTION", "STUDENT"];
  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid role", 400);
  }

  // Check existing user with timeout
  const existingUser = await Promise.race([
    withRetry(async () => {
      return await client.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 5000)
    )
  ]);

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate unique username (simplified)
  const username = await generateUsername(normalizedEmail, null, null);

  // Create user with timeout and simplified profile creation
  const createdUser = await Promise.race([
    withRetry(async () => {
      return await client.user.create({
        data: {
          email: normalizedEmail,
          username,
          password: hashedPassword,
          role,
          headline: role === "TRAINER" ? (organization || "Expert Trainer") : 
                   (role === "INSTITUTION" ? (organization || "Educational Institution") : "Student"),

          // Create profiles separately to avoid complex nested operations
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          headline: true,
          createdAt: true,
        },
      });
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User creation timeout')), 10000)
    )
  ]);

  // Create profile records separately (non-blocking)
  createProfileAsync(createdUser.id, role, organization).catch(err => {
    console.error('Profile creation failed (background):', err);
  });

  const token = jwt.sign(
    {
      userId: createdUser.id,
      role: createdUser.role,
    },
    process.env.JWT_SECRET,
    JWT_OPTIONS,
  );

  console.log("Generated token for user:", createdUser.email, "Role:", createdUser.role);

  return {
    token,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      username: createdUser.username,
      role: createdUser.role,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      profilePicture: createdUser.profilePicture,
      headline: createdUser.headline,
      createdAt: createdUser.createdAt,
    },
  };
};

// Helper function to create profiles asynchronously
const createProfileAsync = async (userId, role, organization) => {
  try {
    if (role === "TRAINER") {
      await client.trainerProfile.create({
        data: {
          userId,
          experience: 0,
          skills: [],
          location: "Not specified",
          bio: organization ? `Expertise in ${organization}` : "Experienced trainer ready to share knowledge.",
        },
      });
    } else if (role === "INSTITUTION") {
      await client.institutionProfile.create({
        data: {
          userId,
          name: organization || "Educational Institution",
          location: "Not specified",
        },
      });
    } else if (role === "STUDENT") {
      await client.studentProfile.create({
        data: {
          userId,
          bio: "Aspiring student.",
        },
      });
    }
    console.log(`Profile created for user ${userId} with role ${role}`);
  } catch (error) {
    console.error(`Failed to create profile for user ${userId}:`, error);
  }
};


// ================= LOGIN SERVICE =================
export const loginService = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError("Missing credentials", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await withRetry(async () => {
    return await client.user.findUnique({
      where: { email: normalizedEmail },
    });
  });

  // Prevent user enumeration
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Suspended or soft-deleted check
  if (user.deletedAt) {
    throw new AppError("Account inactive", 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  // SECURITY: Require email verification before login
  if (!user.isVerified) {
    throw new AppError("Please verify your email address before logging in. Check your inbox for the verification code.", 403);
  }

  // Check if account is active (activated after email verification)
  if (!user.isActive) {
    throw new AppError("Account not activated. Please verify your email address first.", 403);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    JWT_OPTIONS,
  );

  // Debug logging
  console.log(
    "Generated login token for user:",
    user.email,
    "Role:",
    user.role,
  );
  console.log("JWT_SECRET set:", process.env.JWT_SECRET ? "YES" : "NO");
  console.log("JWT_ISSUER:", process.env.JWT_ISSUER);
  console.log("JWT_AUDIENCE:", process.env.JWT_AUDIENCE);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      headline: user.headline,
      location: user.location,
      createdAt: user.createdAt,
    },
  };
};
