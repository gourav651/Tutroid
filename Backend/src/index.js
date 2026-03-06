import app from "./app.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { initializeSocket } from "./socket/socket.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageDir = path.join(__dirname, "../storage/materials");
try {
  fs.mkdirSync(storageDir, { recursive: true });
} catch (err) {
  console.warn("Could not create storage directory:", err.message);
}

const PORT = process.env.PORT || 5000;

// Create HTTP server and initialize Socket.io
const server = createServer(app);
initializeSocket(server);

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// For nodemon restarts
process.once('SIGUSR2', () => {
  console.log('🔄 Nodemon restart detected');
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io initialized`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
