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
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;

// Connection state management
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Connection retry logic with exponential backoff
const connectWithRetry = async () => {
  if (isConnected) return;
  
  try {
    await client.$connect();
    isConnected = true;
    connectionAttempts = 0;
    console.log('✅ Database connected successfully');
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ Database connection failed (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`, error.message);
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 10000);
      console.log(`🔄 Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry();
    } else {
      console.error('💥 Failed to connect to database after multiple attempts');
      process.exit(1);
    }
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

// Reconnect handler
const reconnect = async () => {
  console.log('🔄 Attempting to reconnect to database...');
  await disconnect();
  await connectWithRetry();
};

// Health check with automatic reconnection
let healthCheckInterval;
const startHealthCheck = () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  
  healthCheckInterval = setInterval(async () => {
    try {
      // Use a timeout for health check
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      );
      
      await Promise.race([
        client.$queryRaw`SELECT 1`,
        timeoutPromise
      ]);
      
      if (!isConnected) {
        isConnected = true;
        console.log('✅ Database connection restored');
      }
    } catch (error) {
      if (isConnected) {
        console.error('❌ Health check failed:', error.message);
        isConnected = false;
      }
      
      // Attempt reconnection only if not already reconnecting
      if (!isConnected) {
        try {
          await reconnect();
        } catch (reconnectError) {
          console.error('❌ Reconnection failed:', reconnectError.message);
        }
      }
    }
  }, 60000); // Check every 60 seconds (reduced frequency)
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, closing database connection...`);
  if (healthCheckInterval) clearInterval(healthCheckInterval);
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
process.on('beforeExit', async () => {
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  await disconnect();
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  await disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

// Prevent memory leaks from too many listeners
process.setMaxListeners(20);

// Initialize connection
connectWithRetry().then(() => {
  startHealthCheck();
});

export default client;
