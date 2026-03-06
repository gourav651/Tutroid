import prisma from "../../db.js";

/**
 * Request verification
 * POST /verification/request
 */
export const requestVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    // Check if user is trainer or institution
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isVerified: true,
        trainerProfile: {
          select: { verified: true }
        },
        institutionProfile: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Only trainers and institutions can request verification
    if (user.role !== "TRAINER" && user.role !== "INSTITUTION") {
      return res.status(403).json({
        success: false,
        message: "Only trainers and institutions can request verification"
      });
    }

    // Check if already verified
    if (user.isVerified || (user.trainerProfile && user.trainerProfile.verified)) {
      return res.status(400).json({
        success: false,
        message: "You are already verified"
      });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending verification request"
      });
    }

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId,
        message: message || null,
        status: "PENDING"
      }
    });

    res.json({
      success: true,
      message: "Verification request submitted successfully. Please wait for admin approval.",
      data: verificationRequest
    });
  } catch (error) {
    console.error("Error requesting verification:", error);
    next(error);
  }
};

/**
 * Get user's verification request status
 * GET /verification/status
 */
export const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Quick check - if user is already verified, no need to check requests
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true }
    });

    if (user?.isVerified) {
      return res.json({
        success: true,
        data: {
          hasRequest: false,
          status: "ACCEPTED",
          isVerified: true
        }
      });
    }

    // Only query verification requests if user is not verified
    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        createdAt: true,
        reviewedAt: true,
        adminNote: true
      }
    });

    if (!verificationRequest) {
      return res.json({
        success: true,
        data: {
          hasRequest: false,
          status: null,
          isVerified: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasRequest: true,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt,
        reviewedAt: verificationRequest.reviewedAt,
        adminNote: verificationRequest.adminNote,
        isVerified: false
      }
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    // Return a safe default instead of erroring
    res.json({
      success: true,
      data: {
        hasRequest: false,
        status: null,
        isVerified: false
      }
    });
  }
};

/**
 * Cancel verification request
 * DELETE /verification/request
 */
export const cancelVerificationRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const verificationRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        status: "PENDING"
      }
    });

    if (!verificationRequest) {
      return res.status(404).json({
        success: false,
        message: "No pending verification request found"
      });
    }

    await prisma.verificationRequest.delete({
      where: { id: verificationRequest.id }
    });

    res.json({
      success: true,
      message: "Verification request cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling verification request:", error);
    next(error);
  }
};
