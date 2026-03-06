import express from "express";

const router = express.Router();

// Debug endpoint to check email configuration
router.get("/email-config", (req, res) => {
  const config = {
    environment: process.env.NODE_ENV,
    hasBrevoSMTP: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    smtpHost: process.env.SMTP_HOST || 'not-set',
    smtpPort: process.env.SMTP_PORT || 'not-set',
    senderEmail: process.env.SENDER_EMAIL || 'not-set',
    hasEmailConfig: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    timestamp: new Date().toISOString()
  };

  console.log('[Debug] Email config check:', config);

  res.json({
    success: true,
    message: "Email configuration check",
    data: config
  });
});

// Check user verification status
router.get("/user-status/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    // Import prisma client
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "User status retrieved",
      data: {
        user,
        canLogin: user.isVerified && user.isActive
      }
    });
    
  } catch (error) {
    console.error('[Debug] User status check failed:', error);
    res.status(500).json({
      success: false,
      message: "Failed to check user status",
      error: error.message
    });
  }
});

export default router;