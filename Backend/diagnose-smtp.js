import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("=== SMTP Diagnostic Tool ===\n");

// Check environment variables
console.log("1. Environment Variables Check:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER ? 'SET (hidden)' : 'NOT SET'}`);
console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'SET (hidden)' : 'NOT SET'}`);
console.log(`   SENDER_EMAIL: ${process.env.SENDER_EMAIL || 'NOT SET'}`);
console.log();

if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.error("❌ SMTP credentials not found in environment variables!");
  process.exit(1);
}

// Create transporter
console.log("2. Creating SMTP Transporter...");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 45000,
  pool: false,
  debug: true, // Enable debug output
  logger: true, // Enable logger
});

console.log("✅ Transporter created\n");

// Test connection
console.log("3. Testing SMTP Connection...");
try {
  await transporter.verify();
  console.log("✅ SMTP connection successful!\n");
} catch (error) {
  console.error("❌ SMTP connection failed:");
  console.error(`   Error: ${error.message}`);
  console.error(`   Code: ${error.code}`);
  if (error.response) {
    console.error(`   Response: ${error.response}`);
  }
  process.exit(1);
}

// Test sending email
console.log("4. Testing Email Send...");
const testEmail = process.env.SENDER_EMAIL || "test@example.com";
const mailOptions = {
  from: `"Tutroid Test" <${process.env.SENDER_EMAIL}>`,
  to: testEmail,
  subject: "SMTP Diagnostic Test",
  text: "This is a test email from the SMTP diagnostic tool.",
  html: "<p>This is a test email from the SMTP diagnostic tool.</p>",
};

try {
  const startTime = Date.now();
  const info = await transporter.sendMail(mailOptions);
  const endTime = Date.now();
  
  console.log("✅ Email sent successfully!");
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Time taken: ${endTime - startTime}ms`);
  console.log(`   Response: ${info.response}`);
} catch (error) {
  console.error("❌ Email send failed:");
  console.error(`   Error: ${error.message}`);
  console.error(`   Code: ${error.code}`);
  if (error.response) {
    console.error(`   Response: ${error.response}`);
  }
  process.exit(1);
}

console.log("\n=== Diagnostic Complete ===");
process.exit(0);
