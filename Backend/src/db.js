import { PrismaClient } from '@prisma/client';

// Create a singleton instance with optimized settings for Neon
const globalForPrisma = global;

const client = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize connection pool
  __internal: {
    engine: {
      connection_limit: 10,
      pool_timeout: 30,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;

// Connection state management
let isConnected = false;

// Simple connection with timeout
const connectWithRetry = async () => {
  if (isConnected) return;
  
  try {
    await client.$connect();
    isConnected = true;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error(`❌ Database connection failed:`, error.message);
    // Don't exit, let the app handle it
  }
};

// Disconnect handler
const disconnect = async () => {
  if (isConnected) {
    try {
      await client.$disconnect();
      isConnected = false;
      console.log('✅ Database disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error.message);
    }
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, closing database connection...`);
  await disconnect();
  
  // For nodemon restarts, don't exit immediately
  if (signal === 'SIGUSR2') {
    process.kill(process.pid, 'SIGUSR2');
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart signal

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

// Initialize connection
connectWithRetry();

export default client;
