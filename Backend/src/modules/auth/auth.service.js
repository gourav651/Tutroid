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

  const existingUser = await withRetry(async () => {
    return await client.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
  });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate unique username
  const username = await generateUsername(normalizedEmail, null, null);

  const createdUser = await withRetry(async () => {
    return await client.user.create({
      data: {
        email: normalizedEmail,
        username,
        password: hashedPassword,
        role,
        // Use organization as a headline or name base
        headline: role === "TRAINER" ? (organization || "Expert Trainer") : (role === "INSTITUTION" ? (organization || "Educational Institution") : "Student"),

        // Automatically create appropriate profile record
        ...(role === "TRAINER" && {
        trainerProfile: {
          create: {
            experience: 0,
            skills: [],
            location: "Not specified",
            bio: organization ? `Expertise in ${organization}` : "Experienced trainer ready to share knowledge.",
          },
        },
      }),
      ...(role === "INSTITUTION" && {
        institutionProfile: {
          create: {
            name: organization || normalizedEmail.split("@")[0],
            location: "Not specified",
          },
        },
      }),
      ...(role === "STUDENT" && {
        studentProfile: {
          create: {
            bio: "Aspiring student.",
          },
        },
      }),
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
  });


  const token = jwt.sign(
    {
      userId: createdUser.id,
      role: createdUser.role,
    },
    process.env.JWT_SECRET,
    JWT_OPTIONS,
  );

  // Debug logging
  console.log(
    "Generated token for user:",
    createdUser.email,
    "Role:",
    createdUser.role,
  );

  // Don't send verification OTP here - it's handled in the controller
  // Token will be sent after email verification

  return {
    token, // Keep token for now, but controller won't send it until verified
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

  if (!user.isActive) {
    throw new AppError("Account suspended", 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  // Email verification removed - users can login without verification

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
