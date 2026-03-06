import express from "express";

const router = express.Router();

// Debug endpoint to check email configuration
router.get("/email-config", (req, res) => {
  const config = {
    environment: process.env.NODE_ENV,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'not-set',
    timestamp: new Date().toISOString()
  };

  console.log('[Debug] Email config check:', config);

  res.json({
    success: true,
    message: "Email configuration check",
    data: config
  });
});

export default router;